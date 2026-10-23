/**
 * Pure logic helper functions for Bizmunity
 */

/**
 * Validates a username string:
 * - Must be 3 to 20 alphanumeric characters (or underscores)
 * - Strip leading '@' if present
 * - Must not be a reserved keyword
 */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'bizmunity',
  'official',
  'support',
  'system',
  'help',
  'root',
  'explore',
  'feed',
  'settings',
]);

export interface UsernameValidationResult {
  isValid: boolean;
  cleanUsername: string;
  error?: string;
}

export function validateUsernameFormat(raw: string): UsernameValidationResult {
  if (!raw) {
    return { isValid: false, cleanUsername: '', error: 'Username is required' };
  }

  const clean = raw.trim().replace(/^@/, '').toLowerCase();

  if (clean.length < 3) {
    return { isValid: false, cleanUsername: clean, error: 'Username must be at least 3 characters' };
  }

  if (clean.length > 20) {
    return { isValid: false, cleanUsername: clean, error: 'Username cannot exceed 20 characters' };
  }

  if (!/^[a-z0-9_]+$/.test(clean)) {
    return { isValid: false, cleanUsername: clean, error: 'Username can only contain letters, numbers, and underscores' };
  }

  if (RESERVED_USERNAMES.has(clean)) {
    return { isValid: false, cleanUsername: clean, error: 'This username is reserved' };
  }

  return { isValid: true, cleanUsername: clean };
}

/**
 * Calculate loyalty streak and points bonus
 */
export function calculateStreakBonus(currentStreak: number, lastActiveDateStr?: string, todayStr?: string): {
  newStreak: number;
  bonusPoints: number;
} {
  const today = todayStr || new Date().toISOString().split('T')[0];

  if (!lastActiveDateStr) {
    return { newStreak: 1, bonusPoints: 10 };
  }

  const lastActive = lastActiveDateStr.split('T')[0];
  if (lastActive === today) {
    // Already active today
    return { newStreak: currentStreak, bonusPoints: 0 };
  }

  const lastDate = new Date(lastActive);
  const curDate = new Date(today);
  const diffTime = Math.abs(curDate.getTime() - lastDate.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const nextStreak = currentStreak + 1;
    let bonus = 10;
    if (nextStreak % 7 === 0) bonus += 50; // Weekly streak bonus
    if (nextStreak % 30 === 0) bonus += 200; // Monthly streak bonus
    return { newStreak: nextStreak, bonusPoints: bonus };
  } else {
    // Broken streak
    return { newStreak: 1, bonusPoints: 10 };
  }
}

/**
 * Match a query against searchable text fields
 */
export function matchesQuery(query: string, ...fields: (string | undefined | null)[]): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return fields.some((f) => f && f.toLowerCase().includes(q));
}

/**
 * Calculate customer community check-in streak:
 * - If last check-in was today: alreadyCheckedInToday = true
 * - If last check-in was yesterday (diffDays === 1): streak = currentStreak + 1
 * - If missed 1+ days: streak reset to Day 1 (unless streakProtection is true)
 */
export function calculateCheckInStreak(
  lastCheckInDateStr: string | undefined,
  currentStreak: number,
  todayStr?: string,
  streakProtection = false
): {
  alreadyCheckedInToday: boolean;
  newStreak: number;
  isFirstDay: boolean;
  streakContinued: boolean;
  streakReset: boolean;
} {
  const today = todayStr || new Date().toISOString().split('T')[0];

  if (!lastCheckInDateStr) {
    return {
      alreadyCheckedInToday: false,
      newStreak: 1,
      isFirstDay: true,
      streakContinued: false,
      streakReset: false,
    };
  }

  const lastCheckIn = lastCheckInDateStr.split('T')[0];
  if (lastCheckIn === today) {
    return {
      alreadyCheckedInToday: true,
      newStreak: Math.max(1, currentStreak),
      isFirstDay: false,
      streakContinued: false,
      streakReset: false,
    };
  }

  const lastDate = new Date(lastCheckIn);
  const curDate = new Date(today);
  const diffTime = curDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return {
      alreadyCheckedInToday: false,
      newStreak: Math.max(1, currentStreak) + 1,
      isFirstDay: false,
      streakContinued: true,
      streakReset: false,
    };
  } else if (diffDays > 1) {
    if (streakProtection) {
      return {
        alreadyCheckedInToday: false,
        newStreak: Math.max(1, currentStreak),
        isFirstDay: false,
        streakContinued: false,
        streakReset: false,
      };
    } else {
      return {
        alreadyCheckedInToday: false,
        newStreak: 1,
        isFirstDay: false,
        streakContinued: false,
        streakReset: true,
      };
    }
  }

  return {
    alreadyCheckedInToday: false,
    newStreak: 1,
    isFirstDay: true,
    streakContinued: false,
    streakReset: false,
  };
}

/**
 * QR Code Payloads & Parser
 * ONLY THREE QR TYPES:
 * 1. user (My Profile QR)
 * 2. community (Community QR)
 * 3. checkin (Check-In QR)
 */
export interface ParsedQRPayload {
  type: 'user' | 'community' | 'checkin' | 'unknown';
  userId?: string;
  username?: string;
  name?: string;
  communityId?: string;
  handle?: string;
  checkInCode?: string;
  pointsPerCheckIn?: number;
  raw: string;
}

export function parseQRPayload(raw: string): ParsedQRPayload {
  if (!raw || typeof raw !== 'string') {
    return { type: 'unknown', raw: '' };
  }

  const trimmed = raw.trim();

  // 1. Try JSON format
  try {
    const obj = JSON.parse(trimmed);

    // Check-In QR
    if (obj.type === 'checkin' || obj.checkInCode) {
      return {
        type: 'checkin',
        communityId: obj.communityId,
        name: obj.name || obj.communityName,
        checkInCode: obj.checkInCode,
        pointsPerCheckIn: Number(obj.pointsPerCheckIn) || 10,
        raw: trimmed,
      };
    }

    // Community QR (also handles legacy 'business' type for backwards compatibility)
    if (obj.type === 'community' || obj.type === 'business' || (obj.communityId && !obj.checkInCode)) {
      return {
        type: 'community',
        communityId: obj.communityId || obj.businessId,
        name: obj.name || obj.businessName,
        handle: obj.handle,
        raw: trimmed,
      };
    }

    // User Profile QR
    if (obj.type === 'user' || obj.userId) {
      return {
        type: 'user',
        userId: obj.userId,
        username: obj.username,
        name: obj.name,
        raw: trimmed,
      };
    }
  } catch {
    // Non-JSON format
  }

  // 2. URI Schemes
  if (trimmed.startsWith('bizmunity://checkin/')) {
    const parts = trimmed.replace('bizmunity://checkin/', '').split('?');
    const cid = parts[0];
    const params = new URLSearchParams(parts[1] || '');
    return {
      type: 'checkin',
      communityId: cid,
      checkInCode: params.get('code') || '',
      raw: trimmed,
    };
  }

  if (trimmed.startsWith('bizmunity://community/') || trimmed.startsWith('bizmunity://business/')) {
    const cid = trimmed
      .replace('bizmunity://community/', '')
      .replace('bizmunity://business/', '')
      .split('?')[0];
    return { type: 'community', communityId: cid, raw: trimmed };
  }

  if (trimmed.startsWith('bizmunity://user/')) {
    const uid = trimmed.replace('bizmunity://user/', '').split('?')[0];
    return { type: 'user', userId: uid, raw: trimmed };
  }

  return { type: 'unknown', raw: trimmed };
}

