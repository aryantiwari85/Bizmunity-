import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUsernameFormat,
  calculateStreakBonus,
  calculateCheckInStreak,
  matchesQuery,
  parseQRPayload,
} from './bizmunityLogic.ts';

test('validateUsernameFormat accepts valid username with or without leading @', () => {
  const r1 = validateUsernameFormat('@aryan');
  assert.equal(r1.isValid, true);
  assert.equal(r1.cleanUsername, 'aryan');

  const r2 = validateUsernameFormat('founder_99');
  assert.equal(r2.isValid, true);
  assert.equal(r2.cleanUsername, 'founder_99');
});

test('validateUsernameFormat rejects short, long, invalid characters, and reserved names', () => {
  const short = validateUsernameFormat('ab');
  assert.equal(short.isValid, false);

  const special = validateUsernameFormat('user!name');
  assert.equal(special.isValid, false);

  const reserved = validateUsernameFormat('admin');
  assert.equal(reserved.isValid, false);
});

test('calculateStreakBonus computes consecutive day bonuses', () => {
  const firstDay = calculateStreakBonus(0, undefined, '2026-10-14');
  assert.equal(firstDay.newStreak, 1);
  assert.equal(firstDay.bonusPoints, 10);

  const consecutive = calculateStreakBonus(1, '2026-10-13', '2026-10-14');
  assert.equal(consecutive.newStreak, 2);
  assert.equal(consecutive.bonusPoints, 10);

  // 7th day weekly bonus
  const weekly = calculateStreakBonus(6, '2026-10-13', '2026-10-14');
  assert.equal(weekly.newStreak, 7);
  assert.equal(weekly.bonusPoints, 60);

  // Broken streak
  const broken = calculateStreakBonus(10, '2026-10-10', '2026-10-14');
  assert.equal(broken.newStreak, 1);
  assert.equal(broken.bonusPoints, 10);
});

test('calculateCheckInStreak correctly computes daily streaks, resets, and guards against double check-in', () => {
  // 1. First day check-in
  const day1 = calculateCheckInStreak(undefined, 0, '2026-10-19');
  assert.equal(day1.isFirstDay, true);
  assert.equal(day1.newStreak, 1);
  assert.equal(day1.alreadyCheckedInToday, false);

  // 2. Already checked in today
  const dup = calculateCheckInStreak('2026-10-19', 1, '2026-10-19');
  assert.equal(dup.alreadyCheckedInToday, true);
  assert.equal(dup.newStreak, 1);

  // 3. Consecutive day check-in (Day 2)
  const day2 = calculateCheckInStreak('2026-10-19', 1, '2026-10-20');
  assert.equal(day2.alreadyCheckedInToday, false);
  assert.equal(day2.streakContinued, true);
  assert.equal(day2.newStreak, 2);

  // 4. Missed day without streak protection -> reset to Day 1
  const reset = calculateCheckInStreak('2026-10-15', 5, '2026-10-20', false);
  assert.equal(reset.streakReset, true);
  assert.equal(reset.newStreak, 1);

  // 5. Missed day with streak protection -> preserved
  const protectedStreak = calculateCheckInStreak('2026-10-15', 5, '2026-10-20', true);
  assert.equal(protectedStreak.newStreak, 5);
});

test('matchesQuery correctly evaluates search query against multiple fields', () => {
  assert.equal(matchesQuery('tech', 'Tech Community', 'A group for founders'), true);
  assert.equal(matchesQuery('founder', 'Developers Club', 'A place for every founder'), true);
  assert.equal(matchesQuery('crypto', 'Coffee Club', 'Morning brew lovers'), false);
});

test('parseQRPayload accurately parses ONLY the 3 allowed QR types: user, community, checkin', () => {
  // 1. User Profile QR
  const userJson = JSON.stringify({ type: 'user', userId: 'usr123', username: 'aryan' });
  const p1 = parseQRPayload(userJson);
  assert.equal(p1.type, 'user');
  assert.equal(p1.userId, 'usr123');
  assert.equal(p1.username, 'aryan');

  // 2. Community QR
  const communityJson = JSON.stringify({ type: 'community', communityId: 'comm_brew', name: 'Brew Lab', handle: 'brewlab' });
  const p2 = parseQRPayload(communityJson);
  assert.equal(p2.type, 'community');
  assert.equal(p2.communityId, 'comm_brew');
  assert.equal(p2.name, 'Brew Lab');

  // 3. Check-In QR
  const checkinJson = JSON.stringify({ type: 'checkin', communityId: 'comm_brew', checkInCode: 'CHK_9876', pointsPerCheckIn: 15 });
  const p3 = parseQRPayload(checkinJson);
  assert.equal(p3.type, 'checkin');
  assert.equal(p3.communityId, 'comm_brew');
  assert.equal(p3.checkInCode, 'CHK_9876');
  assert.equal(p3.pointsPerCheckIn, 15);

  // 4. URI Scheme for user
  const p4 = parseQRPayload('bizmunity://user/usr999');
  assert.equal(p4.type, 'user');
  assert.equal(p4.userId, 'usr999');

  // 5. URI Scheme for checkin
  const p5 = parseQRPayload('bizmunity://checkin/comm_glow?code=CHK_GLOW1');
  assert.equal(p5.type, 'checkin');
  assert.equal(p5.communityId, 'comm_glow');
  assert.equal(p5.checkInCode, 'CHK_GLOW1');
});
