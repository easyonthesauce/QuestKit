export interface Quest {
  id: string;
  title: string;
  description?: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xpReward: number;
  coinReward: number;
  requiresPhoto: boolean;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  deadline?: Date;
  assignedTo?: string; // User ID
  createdBy: string; // User ID
  familyId: string;
  status: QuestStatus;
  completedAt?: Date;
  verificationPhoto?: string;
  streakCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum QuestCategory {
  CHORES = 'CHORES',
  HOMEWORK = 'HOMEWORK',
  EXERCISE = 'EXERCISE',
  CREATIVITY = 'CREATIVITY',
  KINDNESS = 'KINDNESS',
  LEARNING = 'LEARNING',
  HEALTH = 'HEALTH',
  CUSTOM = 'CUSTOM'
}

export enum QuestDifficulty {
  EASY = 'EASY',    // 10-25 XP
  MEDIUM = 'MEDIUM', // 30-60 XP
  HARD = 'HARD',    // 70-100 XP
  EPIC = 'EPIC'     // 120+ XP
}

export enum QuestStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED'
}

export interface RecurringPattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number;   // 1-31
  endDate?: Date;
}

export interface QuestCompletion {
  id: string;
  questId: string;
  userId: string;
  completedAt: Date;
  verificationPhoto?: string;
  xpEarned: number;
  coinsEarned: number;
  streakBonus: boolean;
  notes?: string;
}

export interface CreateQuestRequest {
  title: string;
  description?: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  requiresPhoto: boolean;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  deadline?: Date;
  assignedTo?: string;
}

export interface CompleteQuestRequest {
  questId: string;
  verificationPhoto?: string;
  notes?: string;
}