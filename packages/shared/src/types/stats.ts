export interface UserStats {
  userId: string;
  level: number;
  totalXP: number;
  totalCoins: number;
  availableCoins: number;
  currentStreak: number;
  longestStreak: number;
  questsCompleted: number;
  questsCreated: number;
  rewardsRedeemed: number;
  achievements: Achievement[];
  lastActiveAt: Date;
}

export interface FamilyStats {
  familyId: string;
  totalQuests: number;
  completedQuests: number;
  activeQuests: number;
  totalXPEarned: number;
  averageCompletionRate: number;
  topPerformers: UserStats[];
  recentActivity: ActivityFeedItem[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  unlockedAt: Date;
  progress?: number;
  maxProgress?: number;
}

export enum AchievementCategory {
  STREAKS = 'STREAKS',
  QUESTS = 'QUESTS',
  XP = 'XP',
  TEAMWORK = 'TEAMWORK',
  CONSISTENCY = 'CONSISTENCY',
  SPECIAL = 'SPECIAL'
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  userId: string;
  username: string;
  userAvatar?: string;
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export enum ActivityType {
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  QUEST_CREATED = 'QUEST_CREATED',
  LEVEL_UP = 'LEVEL_UP',
  STREAK_MILESTONE = 'STREAK_MILESTONE',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  JOINED_FAMILY = 'JOINED_FAMILY'
}