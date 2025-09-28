export interface Reward {
  id: string;
  title: string;
  description?: string;
  cost: number; // In coins
  category: RewardCategory;
  isAvailable: boolean;
  isRedeemable: boolean;
  maxRedemptions?: number;
  currentRedemptions: number;
  familyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum RewardCategory {
  SCREEN_TIME = 'SCREEN_TIME',
  TREATS = 'TREATS',
  ACTIVITIES = 'ACTIVITIES',
  PRIVILEGES = 'PRIVILEGES',
  MONEY = 'MONEY',
  CUSTOM = 'CUSTOM'
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  userId: string;
  status: RedemptionStatus;
  requestedAt: Date;
  approvedAt?: Date;
  fulfilledAt?: Date;
  notes?: string;
  approvedBy?: string;
}

export enum RedemptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED'
}

export interface CreateRewardRequest {
  title: string;
  description?: string;
  cost: number;
  category: RewardCategory;
  maxRedemptions?: number;
}

export interface RedeemRewardRequest {
  rewardId: string;
  notes?: string;
}