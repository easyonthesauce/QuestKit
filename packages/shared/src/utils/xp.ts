import { QuestDifficulty } from '../types/quest';

/**
 * Calculate XP reward based on difficulty
 */
export function getXPReward(difficulty: QuestDifficulty): number {
  switch (difficulty) {
    case QuestDifficulty.EASY:
      return Math.floor(Math.random() * 16) + 10; // 10-25 XP
    case QuestDifficulty.MEDIUM:
      return Math.floor(Math.random() * 31) + 30; // 30-60 XP
    case QuestDifficulty.HARD:
      return Math.floor(Math.random() * 31) + 70; // 70-100 XP
    case QuestDifficulty.EPIC:
      return Math.floor(Math.random() * 81) + 120; // 120-200 XP
    default:
      return 10;
  }
}

/**
 * Calculate coin reward based on difficulty
 */
export function getCoinReward(difficulty: QuestDifficulty): number {
  const xp = getXPReward(difficulty);
  return Math.floor(xp * 0.1); // Coins are roughly 10% of XP
}

/**
 * Calculate user level based on total XP
 * Level progression: 100 XP for level 1, then +100 XP per level
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP < 100) return 1;
  return Math.floor((totalXP - 100) / 100) + 2;
}

/**
 * Calculate XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel === 1) return 100;
  return currentLevel * 100;
}

/**
 * Calculate XP progress to next level
 */
export function getXPProgress(totalXP: number): { 
  currentLevel: number; 
  currentLevelXP: number; 
  nextLevelXP: number; 
  progress: number; 
} {
  const currentLevel = calculateLevel(totalXP);
  const xpForCurrentLevel = currentLevel === 1 ? 0 : (currentLevel - 1) * 100;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const currentLevelXP = totalXP - xpForCurrentLevel;
  const progress = (currentLevelXP / nextLevelXP) * 100;

  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP,
    progress: Math.min(progress, 100)
  };
}

/**
 * Apply streak bonus to XP
 */
export function applyStreakBonus(baseXP: number, streakCount: number): number {
  if (streakCount < 3) return baseXP;
  
  // 10% bonus for 3-6 day streak, 20% for 7-13 days, 30% for 14+ days
  let multiplier = 1;
  if (streakCount >= 14) multiplier = 1.3;
  else if (streakCount >= 7) multiplier = 1.2;
  else if (streakCount >= 3) multiplier = 1.1;
  
  return Math.floor(baseXP * multiplier);
}