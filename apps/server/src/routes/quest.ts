import express from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest, requireFamilyMembership } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { CreateQuestRequest, CompleteQuestRequest, QuestStatus } from '@questkit/shared';
import { getXPReward, getCoinReward, applyStreakBonus } from '@questkit/shared';

const router = express.Router();

// Get family quests
router.get('/', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { status, assignedTo, page = 1, limit = 20 } = req.query;
  
  const where: any = {
    familyId: req.user!.familyId!
  };

  if (status) {
    where.status = status;
  }

  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  const quests = await prisma.quest.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      },
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      },
      completions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });

  const total = await prisma.quest.count({ where });

  res.json({
    success: true,
    data: {
      quests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    }
  });
}));

// Create new quest
router.post('/', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const questData: CreateQuestRequest = req.body;
  
  // Check family settings for quest creation permissions
  const family = await prisma.family.findUnique({
    where: { id: req.user!.familyId! },
    select: { settings: true }
  });

  const settings = family?.settings as any;
  if (!settings.allowChildQuestCreation && req.user!.role === 'CHILD') {
    throw new AppError('Only parents can create quests in this family', 403);
  }

  // Calculate XP and coin rewards
  const xpReward = getXPReward(questData.difficulty);
  const coinReward = getCoinReward(questData.difficulty);

  const quest = await prisma.quest.create({
    data: {
      title: questData.title.trim(),
      description: questData.description?.trim(),
      category: questData.category,
      difficulty: questData.difficulty,
      xpReward,
      coinReward,
      requiresPhoto: questData.requiresPhoto,
      isRecurring: questData.isRecurring,
      recurringPattern: questData.recurringPattern,
      deadline: questData.deadline,
      assignedTo: questData.assignedTo,
      createdBy: req.user!.id,
      familyId: req.user!.familyId!
    },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      },
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: quest,
    message: 'Quest created successfully'
  });
}));

// Complete quest
router.post('/:questId/complete', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { questId } = req.params;
  const { verificationPhoto, notes }: CompleteQuestRequest = req.body;

  const quest = await prisma.quest.findFirst({
    where: {
      id: questId,
      familyId: req.user!.familyId!,
      status: QuestStatus.ACTIVE
    },
    include: {
      assignee: true
    }
  });

  if (!quest) {
    throw new AppError('Quest not found or not active', 404);
  }

  // Check if quest is assigned to someone else
  if (quest.assignedTo && quest.assignedTo !== req.user!.id) {
    throw new AppError('Quest is assigned to another user', 403);
  }

  // Check if photo is required
  if (quest.requiresPhoto && !verificationPhoto) {
    throw new AppError('Photo verification required for this quest', 400);
  }

  // Get user's current streak for bonus calculation
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { currentStreak: true }
  });

  // Calculate XP with potential streak bonus
  const baseXP = quest.xpReward;
  const finalXP = applyStreakBonus(baseXP, user?.currentStreak || 0);
  const streakBonus = finalXP > baseXP;

  // Create completion record
  const completion = await prisma.questCompletion.create({
    data: {
      questId: quest.id,
      userId: req.user!.id,
      verificationPhoto,
      xpEarned: finalXP,
      coinsEarned: quest.coinReward,
      streakBonus,
      notes
    }
  });

  // Update quest status
  const updatedQuest = await prisma.quest.update({
    where: { id: questId },
    data: {
      status: quest.requiresPhoto ? QuestStatus.PENDING_VERIFICATION : QuestStatus.COMPLETED,
      completedAt: new Date()
    }
  });

  // Update user stats if quest is immediately completed (no photo verification needed)
  if (!quest.requiresPhoto) {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        totalXP: { increment: finalXP },
        totalCoins: { increment: quest.coinReward },
        availableCoins: { increment: quest.coinReward },
        currentStreak: { increment: 1 }
      }
    });
  }

  res.json({
    success: true,
    data: {
      quest: updatedQuest,
      completion,
      xpEarned: finalXP,
      coinsEarned: quest.coinReward,
      streakBonus
    },
    message: 'Quest completed successfully'
  });
}));

// Get quest by ID
router.get('/:questId', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { questId } = req.params;

  const quest = await prisma.quest.findFirst({
    where: {
      id: questId,
      familyId: req.user!.familyId!
    },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      },
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      },
      completions: {
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
        orderBy: { completedAt: 'desc' }
      }
    }
  });

  if (!quest) {
    throw new AppError('Quest not found', 404);
  }

  res.json({
    success: true,
    data: quest
  });
}));

export default router;