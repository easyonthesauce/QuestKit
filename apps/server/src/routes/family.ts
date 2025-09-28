import express from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest, requireFamilyMembership, requireParentRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get family details
router.get('/', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const family = await prisma.family.findUnique({
    where: { id: req.user!.familyId! },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          level: true,
          totalXP: true,
          currentStreak: true,
          role: true,
          isActive: true,
          lastActiveAt: true
        },
        orderBy: { totalXP: 'desc' }
      },
      _count: {
        select: {
          quests: true,
          rewards: true
        }
      }
    }
  });

  if (!family) {
    return res.status(404).json({
      success: false,
      error: 'Family not found'
    });
  }

  res.json({
    success: true,
    data: family
  });
}));

// Update family settings (parents only)
router.put('/settings', requireFamilyMembership, requireParentRole, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { settings } = req.body;

  const family = await prisma.family.update({
    where: { id: req.user!.familyId! },
    data: { settings },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          level: true,
          totalXP: true,
          currentStreak: true,
          role: true,
          isActive: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: family,
    message: 'Family settings updated successfully'
  });
}));

// Generate new invite code (parents only)
router.post('/regenerate-invite', requireFamilyMembership, requireParentRole, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { generateInviteCode } = await import('@questkit/shared');
  
  const family = await prisma.family.update({
    where: { id: req.user!.familyId! },
    data: { inviteCode: generateInviteCode() },
    select: {
      id: true,
      name: true,
      inviteCode: true
    }
  });

  res.json({
    success: true,
    data: family,
    message: 'New invite code generated'
  });
}));

// Leave family
router.post('/leave', requireFamilyMembership, asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Check if user is the family creator
  const family = await prisma.family.findUnique({
    where: { id: req.user!.familyId! },
    select: { createdBy: true }
  });

  if (family?.createdBy === req.user!.id) {
    return res.status(400).json({
      success: false,
      error: 'Family creator cannot leave. Transfer ownership or delete the family first.'
    });
  }

  // Remove user from family
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      familyId: null,
      role: 'PARENT' // Reset to parent when leaving family
    }
  });

  res.json({
    success: true,
    message: 'Successfully left the family'
  });
}));

export default router;