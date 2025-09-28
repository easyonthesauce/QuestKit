import express from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest, requireFamilyMembership } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { QuestStatus } from '@questkit/shared';

const router = express.Router();

// Get user stats
router.get('/user', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.query.userId as string || req.user!.id;

  // Verify user is in same family
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      familyId: req.user!.familyId!
    }
  });

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: 'User not found in family'
    });
  }

  const [
    user,
    questsCompleted,
    questsCreated,
    rewardsRedeemed,
    achievements,
    recentActivity
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        level: true,
        totalXP: true,
        totalCoins: true,
        availableCoins: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveAt: true
      }
    }),
    prisma.questCompletion.count({
      where: { userId }
    }),
    prisma.quest.count({
      where: { createdBy: userId }
    }),
    prisma.rewardRedemption.count({
      where: {
        userId,
        status: 'FULFILLED'
      }
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
      take: 10
    }),
    prisma.activityFeedItem.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20
    })
  ]);

  const stats = {
    ...user,
    questsCompleted,
    questsCreated,
    rewardsRedeemed,
    achievements,
    recentActivity
  };

  res.json({
    success: true,
    data: stats
  });
}));

// Get family stats
router.get('/family', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const familyId = req.user!.familyId!;

  const [
    family,
    totalQuests,
    completedQuests,
    activeQuests,
    totalXPEarned,
    topPerformers,
    recentActivity
  ] = await Promise.all([
    prisma.family.findUnique({
      where: { id: familyId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      }
    }),
    prisma.quest.count({
      where: { familyId }
    }),
    prisma.quest.count({
      where: {
        familyId,
        status: { in: [QuestStatus.COMPLETED, QuestStatus.VERIFIED] }
      }
    }),
    prisma.quest.count({
      where: {
        familyId,
        status: QuestStatus.ACTIVE
      }
    }),
    prisma.user.aggregate({
      where: { familyId },
      _sum: { totalXP: true }
    }),
    prisma.user.findMany({
      where: { familyId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        level: true,
        totalXP: true,
        currentStreak: true,
        _count: {
          select: {
            completions: true
          }
        }
      },
      orderBy: { totalXP: 'desc' },
      take: 5
    }),
    prisma.activityFeedItem.findMany({
      where: {
        user: { familyId }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    })
  ]);

  const averageCompletionRate = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  const familyStats = {
    family,
    totalQuests,
    completedQuests,
    activeQuests,
    totalXPEarned: totalXPEarned._sum.totalXP || 0,
    averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
    topPerformers,
    recentActivity
  };

  res.json({
    success: true,
    data: familyStats
  });
}));

// Get quest statistics
router.get('/quests', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const familyId = req.user!.familyId!;
  const { period = '30' } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period as string));

  const [
    questsByCategory,
    questsByDifficulty,
    questsByStatus,
    completionTrend
  ] = await Promise.all([
    prisma.quest.groupBy({
      by: ['category'],
      where: { familyId },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    }),
    prisma.quest.groupBy({
      by: ['difficulty'],
      where: { familyId },
      _count: { difficulty: true },
      orderBy: { _count: { difficulty: 'desc' } }
    }),
    prisma.quest.groupBy({
      by: ['status'],
      where: { familyId },
      _count: { status: true }
    }),
    prisma.questCompletion.groupBy({
      by: ['completedAt'],
      where: {
        quest: { familyId },
        completedAt: { gte: startDate }
      },
      _count: { completedAt: true },
      orderBy: { completedAt: 'asc' }
    })
  ]);

  const questStats = {
    questsByCategory,
    questsByDifficulty,
    questsByStatus,
    completionTrend,
    period: parseInt(period as string)
  };

  res.json({
    success: true,
    data: questStats
  });
}));

// Get leaderboard
router.get('/leaderboard', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const familyId = req.user!.familyId!;
  const { metric = 'totalXP', period = 'all' } = req.query;

  let dateFilter = {};
  if (period !== 'all') {
    const startDate = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    startDate.setDate(startDate.getDate() - days);
    dateFilter = { createdAt: { gte: startDate } };
  }

  let orderBy: any = { totalXP: 'desc' };
  
  switch (metric) {
    case 'currentStreak':
      orderBy = { currentStreak: 'desc' };
      break;
    case 'questsCompleted':
      // This would require a more complex query with quest completion counts
      break;
    case 'totalCoins':
      orderBy = { totalCoins: 'desc' };
      break;
  }

  const leaderboard = await prisma.user.findMany({
    where: { 
      familyId,
      isActive: true,
      ...dateFilter
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      level: true,
      totalXP: true,
      totalCoins: true,
      currentStreak: true,
      longestStreak: true,
      _count: {
        select: {
          completions: true,
          createdQuests: true
        }
      }
    },
    orderBy,
    take: 10
  });

  res.json({
    success: true,
    data: {
      leaderboard,
      metric,
      period
    }
  });
}));

export default router;