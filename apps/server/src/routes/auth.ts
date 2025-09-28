import express from 'express';
import { AuthService } from '../services/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { authRateLimiterMiddleware } from '../middleware/rateLimiter';
import { CreateUserRequest, LoginRequest } from '@questkit/shared';

const router = express.Router();

// Register new user
router.post('/register', authRateLimiterMiddleware, asyncHandler(async (req, res) => {
  const userData: CreateUserRequest = req.body;
  
  const result = await AuthService.register(userData);
  
  res.status(201).json({
    success: true,
    data: result,
    message: 'User registered successfully'
  });
}));

// Login user
router.post('/login', authRateLimiterMiddleware, asyncHandler(async (req, res) => {
  const credentials: LoginRequest = req.body;
  
  const result = await AuthService.login(credentials);
  
  res.json({
    success: true,
    data: result,
    message: 'Login successful'
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token required'
    });
  }
  
  const result = await AuthService.refreshToken(refreshToken);
  
  res.json({
    success: true,
    data: result,
    message: 'Token refreshed successfully'
  });
}));

// Create family
router.post('/create-family', authRateLimiterMiddleware, asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { userId } = req.body; // This should come from auth token in real implementation
  
  if (!name || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Family name and user ID required'
    });
  }
  
  const family = await AuthService.createFamily(userId, name, description);
  
  res.status(201).json({
    success: true,
    data: family,
    message: 'Family created successfully'
  });
}));

// Join family
router.post('/join-family', authRateLimiterMiddleware, asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  const { userId } = req.body; // This should come from auth token in real implementation
  
  if (!inviteCode || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Invite code and user ID required'
    });
  }
  
  const family = await AuthService.joinFamily(userId, inviteCode);
  
  res.json({
    success: true,
    data: family,
    message: 'Successfully joined family'
  });
}));

export default router;