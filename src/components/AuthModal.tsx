import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  AtSign,
  Phone,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  signInWithGoogle,
  registerWithEmail,
  loginWithEmail,
  resetPassword,
  checkUsernameAvailable,
  reserveUsernameAndCreateProfile,
  setupRecaptcha,
  startPhoneAuth,
} from '../firebase/authService';
import { useAuth } from '../context/AuthContext';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'phone';
}

const COUNTRY_CODES = [
  { code: '+1', country: 'United States / Canada' },
  { code: '+91', country: 'India' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+971', country: 'United Arab Emirates' },
  { code: '+65', country: 'Singapore' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+81', country: 'Japan' },
  { code: '+55', country: 'Brazil' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { isNewGoogleUser, pendingGoogleUser, setIsNewGoogleUser, setPendingGoogleUser } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'phone'>(initialTab);

  // Email login state
  const [loginEmailVal, setLoginEmailVal] = useState('');
  const [loginPasswordVal, setLoginPasswordVal] = useState('');

  // Email registration flow steps (Email -> Username -> Password -> Full Name)
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message: string;
  }>({ checking: false, message: '' });

  // Password reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Phone Auth state
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // New Google User Setup state
  const [googleUsername, setGoogleUsername] = useState('');
  const [googleFullName, setGoogleFullName] = useState('');
  const [googleUsernameStatus, setGoogleUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message: string;
  }>({ checking: false, message: '' });

  // General loading and errors
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Debounced check username for registration
  useEffect(() => {
    if (!regUsername || regUsername.length < 3) {
      setUsernameStatus({ checking: false, message: '' });
      return;
    }

    setUsernameStatus({ checking: true, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(regUsername);
      setUsernameStatus({
        checking: false,
        available: res.available,
        message: res.message,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [regUsername]);

  // Debounced check username for new Google users
  useEffect(() => {
    if (!googleUsername || googleUsername.length < 3) {
      setGoogleUsernameStatus({ checking: false, message: '' });
      return;
    }

    setGoogleUsernameStatus({ checking: true, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(googleUsername);
      setGoogleUsernameStatus({
        checking: false,
        available: res.available,
        message: res.message,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [googleUsername]);

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  if (!isOpen) return null;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { user, profile, isNewUser } = await signInWithGoogle();
      if (isNewUser || !profile) {
        setIsNewGoogleUser(true);
        setPendingGoogleUser(user);
        setGoogleFullName(user.displayName || '');
        // propose default username from email or name
        const suggested = (user.email?.split('@')[0] || user.displayName?.toLowerCase().replace(/\s+/g, '_') || '')
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 15);
        setGoogleUsername(suggested);
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Google user profile with unique username
  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;
    if (!googleUsernameStatus.available) {
      setErrorMsg('Please choose an available username first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await reserveUsernameAndCreateProfile(
        pendingGoogleUser,
        googleUsername,
        googleFullName || pendingGoogleUser.displayName || 'Bizmunity Member',
        undefined,
        pendingGoogleUser.photoURL || undefined
      );
      setIsNewGoogleUser(false);
      setPendingGoogleUser(null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete profile.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithEmail(loginEmailVal, loginPasswordVal);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials or user not found.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailVal) {
      setErrorMsg('Please enter your email address to receive reset link.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await resetPassword(loginEmailVal);
      setResetSent(true);
      setSuccessMsg(`Password reset email sent to ${loginEmailVal}. Check your inbox!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Step transitions for Email Registration Flow
  const handleNextRegStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (regStep === 1) {
      if (!regEmail || !regEmail.includes('@')) {
        setErrorMsg('Please provide a valid email address.');
        return;
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!usernameStatus.available) {
        setErrorMsg('Please choose an available username.');
        return;
      }
      setRegStep(3);
    } else if (regStep === 3) {
      if (regPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      setRegStep(4);
    } else if (regStep === 4) {
      finishEmailRegistration();
    }
  };

  const finishEmailRegistration = async () => {
    if (!regFullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await registerWithEmail(regEmail, regPassword, regFullName, regUsername);
      setSuccessMsg('Account created successfully! A verification email has been sent to your address.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone OTP Request
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneRaw.replace(/\D/g, '');
    if (cleanPhone.length < 6) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanPhone}`;
    setLoading(true);
    setErrorMsg('');

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container');
      }

      const confirmation = await startPhoneAuth(fullPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setOtpCountdown(30);
      setSuccessMsg(`OTP sent to ${fullPhoneNumber}`);
    } catch (err: any) {
      console.error('Phone auth error:', err);
      setErrorMsg(err.message || 'Failed to send verification code. Check number format.');
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const cred = await confirmationResult.confirm(otpCode);
      const user = cred.user;

      // Check if profile exists, else route to username setup
      const checkRes = await signInWithGoogle(); // reuse check logic or direct profile check
      if (!checkRes.profile) {
        setIsNewGoogleUser(true);
        setPendingGoogleUser(user);
        setGoogleUsername(`user_${cleanPhoneName(user.phoneNumber || '')}`);
      } else {
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setErrorMsg('Invalid OTP. Please check the code and try again.');
      } else if (err.code === 'auth/code-expired') {
        setErrorMsg('This code has expired. Please request a new OTP.');
      } else {
        setErrorMsg(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cleanPhoneName = (phone: string) => phone.replace(/\D/g, '').slice(-6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Hidden container for Firebase invisible recaptcha */}
      <div id="recaptcha-container"></div>

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 w-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* Brand header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Bizmunity
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Where businesses, creators & communities unite
              </p>
            </div>
          </div>

          {/* Alert banners */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* New User Profile Completion Mode (e.g. from Google or Phone) */}
          {isNewGoogleUser && pendingGoogleUser ? (
            <div>
              <div className="mb-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 mb-1">
                  Step: Complete Profile
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Choose your unique username
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Your handle will be unique across all of Bizmunity (e.g. @{googleUsername || 'aryan'})
                </p>
              </div>

              <form onSubmit={handleCompleteGoogleProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={googleFullName}
                      onChange={(e) => setGoogleFullName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={googleUsername}
                      onChange={(e) => setGoogleUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {googleUsernameStatus.checking && (
                      <Loader2 className="absolute right-3 top-3 w-4 h-4 text-zinc-400 animate-spin" />
                    )}
                  </div>
                  {googleUsernameStatus.message && (
                    <p
                      className={`text-xs mt-1 font-medium ${
                        googleUsernameStatus.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                      }`}
                    >
                      {googleUsernameStatus.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !googleUsernameStatus.available}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finish & Enter Bizmunity'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Primary OAuth Action: Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-medium rounded-xl shadow-sm transition flex items-center justify-center gap-3 text-sm mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-zinc-400">
                  Or choose method
                </span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              {/* Tabs: Login / Register / Phone */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl mb-5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setIsResetMode(false);
                    setErrorMsg('');
                  }}
                  className={`py-1.5 rounded-lg transition ${
                    tab === 'login'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setRegStep(1);
                    setErrorMsg('');
                  }}
                  className={`py-1.5 rounded-lg transition ${
                    tab === 'register'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('phone');
                    setErrorMsg('');
                  }}
                  className={`py-1.5 rounded-lg transition ${
                    tab === 'phone'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Phone OTP
                </button>
              </div>

              {/* TAB 1: EMAIL SIGN IN */}
              {tab === 'login' && (
                <div>
                  {isResetMode ? (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Enter your account email to receive a password recovery link.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                          <input
                            type="email"
                            required
                            value={loginEmailVal}
                            onChange={(e) => setLoginEmailVal(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsResetMode(false)}
                          className="w-1/2 py-2 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          Back to Login
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-1/2 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Reset Link'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                          <input
                            type="email"
                            required
                            value={loginEmailVal}
                            onChange={(e) => setLoginEmailVal(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsResetMode(true)}
                            className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                          <input
                            type="password"
                            required
                            value={loginPasswordVal}
                            onChange={(e) => setLoginPasswordVal(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: EMAIL REGISTRATION FLOW */}
              {tab === 'register' && (
                <div>
                  {/* Step progress bar */}
                  <div className="flex items-center justify-between mb-4 text-xs font-medium text-zinc-400">
                    <span className={regStep >= 1 ? 'text-orange-500 font-bold' : ''}>1. Email</span>
                    <span>→</span>
                    <span className={regStep >= 2 ? 'text-orange-500 font-bold' : ''}>2. Username</span>
                    <span>→</span>
                    <span className={regStep >= 3 ? 'text-orange-500 font-bold' : ''}>3. Password</span>
                    <span>→</span>
                    <span className={regStep >= 4 ? 'text-orange-500 font-bold' : ''}>4. Name</span>
                  </div>

                  <form onSubmit={handleNextRegStep} className="space-y-4">
                    {regStep === 1 && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Step 1: Your Business or Personal Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                          <input
                            type="email"
                            required
                            autoFocus
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="founder@company.com"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          We will send an email verification link to verify ownership.
                        </p>
                      </div>
                    )}

                    {regStep === 2 && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Step 2: Choose Unique Username
                        </label>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                          <input
                            type="text"
                            required
                            autoFocus
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="e.g. aryan, founder, bizmunity"
                            className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          {usernameStatus.checking && (
                            <Loader2 className="absolute right-3 top-3 w-4 h-4 text-zinc-400 animate-spin" />
                          )}
                        </div>
                        {usernameStatus.message && (
                          <p
                            className={`text-xs mt-1 font-medium ${
                              usernameStatus.available
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500'
                            }`}
                          >
                            {usernameStatus.message}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Globally unique. Only one user can claim this handle.
                        </p>
                      </div>
                    )}

                    {regStep === 3 && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Step 3: Secure Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                          <input
                            type="password"
                            required
                            autoFocus
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    )}

                    {regStep === 4 && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Step 4: Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                          <input
                            type="text"
                            required
                            autoFocus
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="Aryan Tiwari"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div className="mt-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-400">Email:</span>
                            <span className="font-medium">{regEmail}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-400">Username:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">@{regUsername}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {regStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setRegStep((prev) => (prev - 1) as any)}
                          className="w-1/3 py-2 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading || (regStep === 2 && !usernameStatus.available)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5 text-xs"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : regStep === 4 ? (
                          'Create Account & Join'
                        ) : (
                          <>
                            Continue <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: PHONE NUMBER OTP */}
              {tab === 'phone' && (
                <div>
                  {!confirmationResult ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Sign in with OTP sent directly to your phone via Firebase Authentication.
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Country & Phone Number
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-28 text-xs py-2 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} ({c.country.split(' ')[0]})
                              </option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                            <input
                              type="tel"
                              required
                              value={phoneRaw}
                              onChange={(e) => setPhoneRaw(e.target.value)}
                              placeholder="9876543210"
                              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send 6-Digit OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Enter 6-Digit Verification Code
                          </label>
                          {otpCountdown > 0 ? (
                            <span className="text-[11px] text-zinc-400">Resend in {otpCountdown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendOtp()}
                              className="text-[11px] text-orange-600 dark:text-orange-400 font-medium hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Resend OTP
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          autoFocus
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full tracking-widest text-center text-xl font-bold py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmationResult(null)}
                          className="w-1/3 py-2 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          Change Number
                        </button>
                        <button
                          type="submit"
                          disabled={loading || otpCode.length !== 6}
                          className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5 text-xs"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Sign In'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
