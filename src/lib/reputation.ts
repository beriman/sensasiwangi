import { REPUTATION_LEVELS } from "./forum";

// Get user's reputation level based on exp
export function getUserReputationLevel(exp: number) {
  // Find the highest level the user qualifies for
  for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
    if (exp >= REPUTATION_LEVELS[i].exp) {
      return REPUTATION_LEVELS[i];
    }
  }

  // Default to level 1 if something goes wrong
  return REPUTATION_LEVELS[0];
}

// Get next reputation level
export function getNextReputationLevel(currentLevel: number) {
  if (currentLevel < REPUTATION_LEVELS.length) {
    return REPUTATION_LEVELS[currentLevel];
  }
  return null; // Max level reached
}

// Check if user has a specific privilege
export function hasPrivilege(exp: number, privilege: string): boolean {
  const userLevel = getUserReputationLevel(exp);

  // Check all privileges at current level and below
  for (let i = 0; i <= userLevel.level - 1; i++) {
    if (REPUTATION_LEVELS[i].privileges.includes(privilege)) {
      return true;
    }
  }

  return false;
}

// Get all privileges a user has
export function getUserPrivileges(exp: number): string[] {
  const userLevel = getUserReputationLevel(exp);
  const privileges: string[] = [];

  // Collect all privileges from level 1 up to current level
  for (let i = 0; i <= userLevel.level - 1; i++) {
    privileges.push(...REPUTATION_LEVELS[i].privileges);
  }

  return privileges;
}

// Calculate progress to next level as percentage
export function calculateLevelProgress(exp: number): {
  progress: number;
  currentLevel: (typeof REPUTATION_LEVELS)[0];
  nextLevel: (typeof REPUTATION_LEVELS)[0] | null;
  expToNextLevel: number;
} {
  const currentLevel = getUserReputationLevel(exp);
  const nextLevelIndex = currentLevel.level;

  // Check if user is at max level
  if (nextLevelIndex >= REPUTATION_LEVELS.length) {
    return {
      progress: 100,
      currentLevel,
      nextLevel: null,
      expToNextLevel: 0,
    };
  }

  const nextLevel = REPUTATION_LEVELS[nextLevelIndex];
  const expForCurrentLevel = exp - currentLevel.exp;
  const expRequiredForNextLevel = nextLevel.exp - currentLevel.exp;
  const progress = Math.min(
    Math.floor((expForCurrentLevel / expRequiredForNextLevel) * 100),
    100,
  );

  return {
    progress,
    currentLevel,
    nextLevel,
    expToNextLevel: nextLevel.exp - exp,
  };
}
