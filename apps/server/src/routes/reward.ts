import express from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest, requireFamilyMembership, requireParentRole } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { CreateRewardRequest, RedeemRewardRequest, RedemptionStatus } from '@questkit/shared';

const router = express.Router();

// Get family rewards
router.get('/', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { category, available, page = 1, limit = 20 } = req.query;
  
  const where: any = {
    familyId: req.user!.familyId!
  };

  if (category) {
    where.category = category;
  }

  if (available !== undefined) {
    where.isAvailable = available === 'true';
  }

  const rewards = await prisma.reward.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      },
      _count: {
        select: {
          redemptions: {
            where: { status: RedemptionStatus.FULFILLED }
          }
        }
      }
    },
    orderBy: { cost: 'asc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });

  const total = await prisma.reward.count({ where });

  res.json({
    success: true,
    data: {
      rewards,
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

// Create new reward (parents only)
router.post('/', requireFamilyMembership, requireParentRole, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const rewardData: CreateRewardRequest = req.body;

  const reward = await prisma.reward.create({
    data: {
      title: rewardData.title.trim(),
      description: rewardData.description?.trim(),
      cost: rewardData.cost,
      category: rewardData.category,
      maxRedemptions: rewardData.maxRedemptions,
      familyId: req.user!.familyId!,
      createdBy: req.user!.id
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: reward,
    message: 'Reward created successfully'
  });
}));

// Redeem reward
router.post('/:rewardId/redeem', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { rewardId } = req.params;
  const { notes }: RedeemRewardRequest = req.body;

  const reward = await prisma.reward.findFirst({
    where: {
      id: rewardId,
      familyId: req.user!.familyId!,
      isAvailable: true,
      isRedeemable: true
    }
  });

  if (!reward) {
    throw new AppError('Reward not found or not available', 404);
  }

  // Check if user has enough coins
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { availableCoins: true }
  });

  if (!user || user.availableCoins < reward.cost) {
    throw new AppError('Insufficient coins to redeem this reward', 400);
  }

  // Check max redemptions
  if (reward.maxRedemptions) {
    const currentRedemptions = await prisma.rewardRedemption.count({
      where: {
        rewardId: reward.id,
        status: { in: [RedemptionStatus.APPROVED, RedemptionStatus.FULFILLED] }
      }
    });

    if (currentRedemptions >= reward.maxRedemptions) {
      throw new AppError('Reward has reached maximum redemptions', 400);
    }
  }

  // Create redemption request
  const redemption = await prisma.rewardRedemption.create({
    data: {
      rewardId: reward.id,
      userId: req.user!.id,
      notes,
      status: RedemptionStatus.PENDING
    },
    include: {
      reward: {
        select: {
          id: true,
          title: true,
          cost: true,
          category: true
        }
      },
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true
        }
      }
    }
  });

  // Deduct coins from user
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      availableCoins: { decrement: reward.cost }
    }
  });

  res.json({
    success: true,
    data: redemption,
    message: 'Reward redemption requested successfully'
  });
}));

// Get user's redemptions
router.get('/my-redemptions', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const where: any = {
    userId: req.user!.id
  };

  if (status) {
    where.status = status;
  }

  const redemptions = await prisma.rewardRedemption.findMany({
    where,
    include: {
      reward: {
        select: {
          id: true,
          title: true,
          description: true,
          cost: true,
          category: true
        }
      }
    },
    orderBy: { requestedAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });

  const total = await prisma.rewardRedemption.count({ where });

  res.json({
    success: true,
    data: {
      redemptions,
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

// Approve redemption (parents only)
router.put('/redemptions/:redemptionId/approve', requireFamilyMembership, requireParentRole, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { redemptionId } = req.params;

  const redemption = await prisma.rewardRedemption.findFirst({
    where: {
      id: redemptionId,
      reward: {
        familyId: req.user!.familyId!
      },
      status: RedemptionStatus.PENDING
    }
  });

  if (!redemption) {
    throw new AppError('Redemption request not found', 404);
  }

  const updatedRedemption = await prisma.rewardRedemption.update({
    where: { id: redemptionId },
    data: {
      status: RedemptionStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: req.user!.id
    },
    include: {
      reward: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: updatedRedemption,
    message: 'Redemption approved successfully'
  });
}));

export default router;