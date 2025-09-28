import express from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      level: true,
      totalXP: true,
      totalCoins: true,
      availableCoins: true,
      currentStreak: true,
      longestStreak: true,
      familyId: true,
      role: true,
      isActive: true,
      lastActiveAt: true,
      createdAt: true,
      updatedAt: true,
      family: {
        select: {
          id: true,
          name: true,
          description: true,
          inviteCode: true,
          settings: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: user
  });
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { displayName, avatar } = req.body;
  
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(displayName && { displayName: displayName.trim() }),
      ...(avatar && { avatar })
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      level: true,
      totalXP: true,
      totalCoins: true,
      availableCoins: true,
      currentStreak: true,
      longestStreak: true,
      familyId: true,
      role: true,
      isActive: true,
      lastActiveAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    data: user,
    message: 'Profile updated successfully'
  });
}));

// Get user achievements
router.get('/achievements', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const achievements = await prisma.userAchievement.findMany({
    where: { userId: req.user!.id },
    include: {
      achievement: true
    },
    orderBy: { unlockedAt: 'desc' }
  });

  res.json({
    success: true,
    data: achievements
  });
}));

export default router;