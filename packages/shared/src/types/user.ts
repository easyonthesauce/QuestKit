export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  familyId?: string;
  role: 'PARENT' | 'CHILD' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  settings: FamilySettings;
  members: User[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilySettings {
  allowChildQuestCreation: boolean;
  requirePhotoVerification: boolean;
  xpMultiplier: number;
  maxDailyQuests: number;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
  familyInviteCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}