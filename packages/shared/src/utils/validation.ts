/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Username validation regex (alphanumeric, underscore, dash, 3-20 chars)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

/**
 * Password strength validation
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/**
 * Username validation
 */
export function validateUsername(username: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!username) {
    errors.push('Username is required');
    return { isValid: false, errors };
  }
  
  if (!USERNAME_REGEX.test(username)) {
    errors.push('Username must be 3-20 characters long and contain only letters, numbers, underscores, and dashes');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Display name validation
 */
export function validateDisplayName(displayName: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!displayName || !displayName.trim()) {
    errors.push('Display name is required');
    return { isValid: false, errors };
  }
  
  if (displayName.trim().length < 2) {
    errors.push('Display name must be at least 2 characters long');
  }
  
  if (displayName.trim().length > 50) {
    errors.push('Display name must be no more than 50 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Quest title validation
 */
export function validateQuestTitle(title: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!title || !title.trim()) {
    errors.push('Quest title is required');
    return { isValid: false, errors };
  }
  
  if (title.trim().length < 3) {
    errors.push('Quest title must be at least 3 characters long');
  }
  
  if (title.trim().length > 100) {
    errors.push('Quest title must be no more than 100 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Family invite code validation
 */
export function validateInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Generate a random family invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}