import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { WebSocketMessage, WebSocketMessageType } from '@questkit/shared';

interface AuthenticatedSocket {
  userId?: string;
  familyId?: string;
}

export function initializeSocketHandlers(io: Server) {
  // Authentication middleware for Socket.IO
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error('JWT secret not configured'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, familyId: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid token or user not found'));
      }

      socket.userId = user.id;
      socket.familyId = user.familyId;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: any) => {
    console.log(`User ${socket.userId} connected`);

    // Join family room for real-time updates
    if (socket.familyId) {
      socket.join(`family:${socket.familyId}`);
      console.log(`User ${socket.userId} joined family room: ${socket.familyId}`);
    }

    // Handle user going online
    socket.on('user:online', async () => {
      if (socket.familyId) {
        socket.to(`family:${socket.familyId}`).emit('user:status_changed', {
          userId: socket.userId,
          status: 'online',
          timestamp: new Date()
        });
      }
    });

    // Handle quest completion broadcast
    socket.on('quest:completed', async (data: any) => {
      if (socket.familyId) {
        const message: WebSocketMessage = {
          type: WebSocketMessageType.QUEST_COMPLETED,
          payload: data,
          timestamp: new Date(),
          userId: socket.userId,
          familyId: socket.familyId
        };

        socket.to(`family:${socket.familyId}`).emit('quest:completed', message);
      }
    });

    // Handle quest creation broadcast
    socket.on('quest:created', async (data: any) => {
      if (socket.familyId) {
        const message: WebSocketMessage = {
          type: WebSocketMessageType.QUEST_CREATED,
          payload: data,
          timestamp: new Date(),
          userId: socket.userId,
          familyId: socket.familyId
        };

        socket.to(`family:${socket.familyId}`).emit('quest:created', message);
      }
    });

    // Handle level up broadcast
    socket.on('user:level_up', async (data: any) => {
      if (socket.familyId) {
        const message: WebSocketMessage = {
          type: WebSocketMessageType.USER_LEVEL_UP,
          payload: data,
          timestamp: new Date(),
          userId: socket.userId,
          familyId: socket.familyId
        };

        socket.to(`family:${socket.familyId}`).emit('user:level_up', message);
      }
    });

    // Handle achievement unlock broadcast
    socket.on('user:achievement', async (data: any) => {
      if (socket.familyId) {
        const message: WebSocketMessage = {
          type: WebSocketMessageType.USER_ACHIEVEMENT,
          payload: data,
          timestamp: new Date(),
          userId: socket.userId,
          familyId: socket.familyId
        };

        socket.to(`family:${socket.familyId}`).emit('user:achievement', message);
      }
    });

    // Handle reward redemption broadcast
    socket.on('reward:redeemed', async (data: any) => {
      if (socket.familyId) {
        const message: WebSocketMessage = {
          type: WebSocketMessageType.REWARD_REDEEMED,
          payload: data,
          timestamp: new Date(),
          userId: socket.userId,
          familyId: socket.familyId
        };

        // Send to parents for approval
        socket.to(`family:${socket.familyId}`).emit('reward:redeemed', message);
      }
    });

    // Handle family updates
    socket.on('family:updated', async (data: any) => {
      if (socket.familyId) {
        const message: WebSocketMessage = {
          type: WebSocketMessageType.FAMILY_UPDATE,
          payload: data,
          timestamp: new Date(),
          userId: socket.userId,
          familyId: socket.familyId
        };

        socket.to(`family:${socket.familyId}`).emit('family:updated', message);
      }
    });

    // Handle notifications
    socket.on('notification:send', async (data: any) => {
      const { targetUserId, notification } = data;

      if (targetUserId) {
        // Send to specific user
        socket.to(`user:${targetUserId}`).emit('notification', {
          type: WebSocketMessageType.NOTIFICATION,
          payload: notification,
          timestamp: new Date(),
          userId: socket.userId
        });
      } else if (socket.familyId) {
        // Send to all family members
        socket.to(`family:${socket.familyId}`).emit('notification', {
          type: WebSocketMessageType.NOTIFICATION,
          payload: notification,
          timestamp: new Date(),
          userId: socket.userId,
          familyId: socket.familyId
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);

      if (socket.familyId) {
        socket.to(`family:${socket.familyId}`).emit('user:status_changed', {
          userId: socket.userId,
          status: 'offline',
          timestamp: new Date()
        });
      }

      // Update user's last active time
      if (socket.userId) {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { lastActiveAt: new Date() }
        }).catch(console.error);
      }
    });
  });
}

// Utility functions for broadcasting from API routes
export class SocketService {
  private static io: Server;

  static initialize(io: Server) {
    this.io = io;
  }

  static broadcastToFamily(familyId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`family:${familyId}`).emit(event, data);
    }
  }

  static broadcastToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  static broadcastQuestCompleted(familyId: string, questData: any, userData: any) {
    this.broadcastToFamily(familyId, 'quest:completed', {
      type: WebSocketMessageType.QUEST_COMPLETED,
      payload: { quest: questData, user: userData },
      timestamp: new Date()
    });
  }

  static broadcastLevelUp(familyId: string, userData: any, newLevel: number) {
    this.broadcastToFamily(familyId, 'user:level_up', {
      type: WebSocketMessageType.USER_LEVEL_UP,
      payload: { user: userData, newLevel },
      timestamp: new Date()
    });
  }

  static broadcastAchievementUnlocked(familyId: string, userData: any, achievement: any) {
    this.broadcastToFamily(familyId, 'user:achievement', {
      type: WebSocketMessageType.USER_ACHIEVEMENT,
      payload: { user: userData, achievement },
      timestamp: new Date()
    });
  }

  static broadcastRewardRedeemed(familyId: string, redemptionData: any) {
    this.broadcastToFamily(familyId, 'reward:redeemed', {
      type: WebSocketMessageType.REWARD_REDEEMED,
      payload: redemptionData,
      timestamp: new Date()
    });
  }
}