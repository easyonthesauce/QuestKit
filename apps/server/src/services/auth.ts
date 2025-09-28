import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CreateUserRequest, LoginRequest, AuthResponse } from '@questkit/shared';
import { validateEmail, validatePassword, validateUsername, validateDisplayName, generateInviteCode } from '@questkit/shared';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class AuthService {
  private static generateTokens(userId: string) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new AppError('JWT secrets not configured', 500);
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });

    return { token, refreshToken };
  }

  static async register(userData: CreateUserRequest): Promise<AuthResponse> {
    // Validate input
    if (!validateEmail(userData.email)) {
      throw new AppError('Invalid email format', 400);
    }

    const usernameValidation = validateUsername(userData.username);
    if (!usernameValidation.isValid) {
      throw new AppError(usernameValidation.errors[0], 400);
    }

    const displayNameValidation = validateDisplayName(userData.displayName);
    if (!displayNameValidation.isValid) {
      throw new AppError(displayNameValidation.errors[0], 400);
    }

    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors[0], 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email.toLowerCase() },
          { username: userData.username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      throw new AppError('User with this email or username already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Handle family invitation
    let familyId: string | undefined;
    if (userData.familyInviteCode) {
      const family = await prisma.family.findUnique({
        where: { inviteCode: userData.familyInviteCode.toUpperCase() }
      });

      if (!family) {
        throw new AppError('Invalid family invite code', 400);
      }

      familyId = family.id;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        username: userData.username.toLowerCase(),
        displayName: userData.displayName.trim(),
        passwordHash,
        familyId,
        role: familyId ? 'CHILD' : 'PARENT' // First user in family becomes parent
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        level: true,
        totalXP: true,
        currentStreak: true,
        longestStreak: true,
        familyId: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate tokens
    const { token, refreshToken } = this.generateTokens(user.id);

    return {
      user,
      token,
      refreshToken
    };
  }

  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (!validateEmail(credentials.email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        level: true,
        totalXP: true,
        currentStreak: true,
        longestStreak: true,
        familyId: true,
        role: true,
        isActive: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    // Generate tokens
    const { token, refreshToken } = this.generateTokens(user.id);

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new AppError('JWT refresh secret not configured', 500);
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as any;
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new tokens
      return this.generateTokens(user.id);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  static async createFamily(userId: string, familyName: string, description?: string) {
    // Check if user already has a family
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true, role: true }
    });

    if (user?.familyId) {
      throw new AppError('User already belongs to a family', 400);
    }

    // Create family
    const family = await prisma.family.create({
      data: {
        name: familyName.trim(),
        description: description?.trim(),
        inviteCode: generateInviteCode(),
        settings: {
          allowChildQuestCreation: true,
          requirePhotoVerification: false,
          xpMultiplier: 1,
          maxDailyQuests: 10
        },
        createdBy: userId
      }
    });

    // Update user to join family and become parent
    await prisma.user.update({
      where: { id: userId },
      data: {
        familyId: family.id,
        role: 'PARENT'
      }
    });

    return family;
  }

  static async joinFamily(userId: string, inviteCode: string) {
    // Check if user already has a family
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true }
    });

    if (user?.familyId) {
      throw new AppError('User already belongs to a family', 400);
    }

    // Find family by invite code
    const family = await prisma.family.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() }
    });

    if (!family) {
      throw new AppError('Invalid invite code', 404);
    }

    // Update user to join family
    await prisma.user.update({
      where: { id: userId },
      data: {
        familyId: family.id,
        role: 'CHILD'
      }
    });

    return family;
  }
}