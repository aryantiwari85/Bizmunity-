import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import { UserProfile } from '../types/bizmunity';
import { validateUsernameFormat } from '../utils/bizmunityLogic';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Check if a username is globally available
 */
export async function checkUsernameAvailable(username: string): Promise<{ available: boolean; message: string }> {
  const validation = validateUsernameFormat(username);
  if (!validation.isValid) {
    return { available: false, message: validation.error || 'Invalid username' };
  }

  const clean = validation.cleanUsername;
  const usernameRef = doc(db, 'usernames', clean);

  try {
    const snap = await getDoc(usernameRef);
    if (snap.exists()) {
      return { available: false, message: '❌ Username already taken' };
    }
    return { available: true, message: '✅ Username available' };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `usernames/${clean}`);
  }
}

/**
 * Reserve a unique username and create or update user profile atomically
 */
export async function reserveUsernameAndCreateProfile(
  firebaseUser: FirebaseUser,
  username: string,
  fullName: string,
  phone?: string,
  avatar?: string
): Promise<UserProfile> {
  const validation = validateUsernameFormat(username);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const cleanUsername = validation.cleanUsername;
  const userRef = doc(db, 'users', firebaseUser.uid);
  const usernameRef = doc(db, 'usernames', cleanUsername);

  try {
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      if (usernameDoc.exists() && usernameDoc.data().uid !== firebaseUser.uid) {
        throw new Error('Username already taken. Please choose another.');
      }

      const existingUserDoc = await transaction.get(userRef);
      const existingData = existingUserDoc.exists() ? existingUserDoc.data() : {};

      const profileData: Record<string, any> = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        username: cleanUsername,
        name: fullName || firebaseUser.displayName || 'Bizmunity Member',
        email: firebaseUser.email || '',
        phone: phone || firebaseUser.phoneNumber || '',
        bio: existingData.bio || 'Founder & Creator on Bizmunity',
        avatar: avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanUsername}`,
        followersCount: existingData.followersCount || 0,
        followingCount: existingData.followingCount || 0,
        joinedCommunitiesCount: existingData.joinedCommunitiesCount || 0,
        createdCommunitiesCount: existingData.createdCommunitiesCount || 0,
        loyaltyPoints: existingData.loyaltyPoints !== undefined ? existingData.loyaltyPoints : 100, // Welcome points
        badge: existingData.badge || 'New Member',
        createdAt: existingData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      transaction.set(usernameRef, {
        uid: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });

      transaction.set(userRef, profileData, { merge: true });
    });

    if (fullName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: fullName });
    }

    const createdDoc = await getDoc(userRef);
    return createdDoc.data() as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
  }
}

/**
 * Sign in or Sign up with Google popup
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile | null; isNewUser: boolean }> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;

    // Check if user profile already exists
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      return { user, profile: userSnap.data() as UserProfile, isNewUser: false };
    }

    // New Google user needs to complete profile / pick username
    return { user, profile: null, isNewUser: true };
  } catch (err) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

/**
 * Register with Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  fullName: string,
  username: string,
  phone?: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  // Validate username first
  const check = await checkUsernameAvailable(username);
  if (!check.available) {
    throw new Error(check.message);
  }

  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  // Send email verification
  try {
    await sendEmailVerification(user);
  } catch (e) {
    console.warn('Could not send verification email:', e);
  }

  // Set up profile and reserve username
  const profile = await reserveUsernameAndCreateProfile(user, username, fullName, phone);
  return { user, profile };
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  const userDocRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  // Auto-generate profile if somehow missing
  const defaultUsername = email.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 15) || 'user_' + user.uid.slice(0, 5);
  return await reserveUsernameAndCreateProfile(user, defaultUsername, user.displayName || 'Bizmunity Member');
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Setup Recaptcha for Phone Authentication
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // Recaptcha solved
    },
  });
}

/**
 * Start Phone Authentication
 */
export async function startPhoneAuth(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

/**
 * Log out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}
