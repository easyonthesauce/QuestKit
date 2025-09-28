export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
  userId?: string;
  familyId?: string;
}

export enum WebSocketMessageType {
  // Quest events
  QUEST_CREATED = 'QUEST_CREATED',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  QUEST_VERIFIED = 'QUEST_VERIFIED',
  QUEST_UPDATED = 'QUEST_UPDATED',
  
  // User events
  USER_LEVEL_UP = 'USER_LEVEL_UP',
  USER_ACHIEVEMENT = 'USER_ACHIEVEMENT',
  USER_JOINED = 'USER_JOINED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  
  // Reward events
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  REWARD_APPROVED = 'REWARD_APPROVED',
  
  // System events
  NOTIFICATION = 'NOTIFICATION',
  FAMILY_UPDATE = 'FAMILY_UPDATE',
  STATS_UPDATE = 'STATS_UPDATE'
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  userId?: string;
  actionUrl?: string;
}