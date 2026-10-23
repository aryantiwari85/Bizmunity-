import React, { useState } from 'react';
import { Mail, Lock, Phone, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { signInWithGoogle, loginWithEmail, resetPassword } from '../../firebase/authService';
import { useAuth } from '../../context/AuthContext';
import { BizmunityLogo } from '../../components/BizmunityLogo';

interface LoginScreenProps {
  onSuccess: (isNewUser?: boolean) => void;
  onGoToRegister: () => void;
  onGoToPhone: () => void;
  onExploreGuest?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onGoToRegister,
  onGoToPhone,
  onExploreGuest,
}) => {
  const { setIsNewGoogleUser, setPendingGoogleUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  // 1. Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { user, profile, isNewUser } = await signInWithGoogle();
      if (isNewUser || !profile?.username) {
        setIsNewGoogleUser(true);
        setPendingGoogleUser(user);
        onSuccess(true); // new user flag
      } else {
        onSuccess(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMsg('');
    setLoading(true);
    try {
      const profile = await loginWithEmail(email, password);
      if (!profile?.username) {
        onSuccess(true); // needs username setup
      } else {
        onSuccess(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email to receive recovery instructions.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await resetPassword(email);
      setResetSuccess(`Password reset instructions sent to ${email}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col justify-between p-6 text-zinc-900 dark:text-white overflow-y-auto">
      <div>
        {/* Official Bizmunity Header & Logo */}
        <div className="flex flex-col items-center text-center pt-2 mb-6">
          <BizmunityLogo size="lg" className="mb-3" />
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            {resetMode ? 'Reset Password' : 'Welcome to Bizmunity'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            {resetMode
              ? 'Enter your registered email address to receive password reset link.'
              : 'Business & Creator Network where founders, creators, and communities connect.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* Primary Social & Phone Buttons */}
        {!resetMode && (
          <div className="space-y-2.5 mb-5">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 font-semibold rounded-2xl shadow-sm transition flex items-center justify-center gap-3 text-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            {/* Continue with Phone Number */}
            <button
              type="button"
              onClick={onGoToPhone}
              disabled={loading}
              className="w-full py-3 px-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 font-semibold rounded-2xl shadow-sm transition flex items-center justify-center gap-2.5 text-xs"
            >
              <Phone className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Continue with Phone Number</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                OR
              </span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
          </div>
        )}

        {/* Email Login Form */}
        <form onSubmit={resetMode ? handlePasswordReset : handleEmailLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {!resetMode && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setErrorMsg('');
                    setResetSuccess('');
                  }}
                  className="text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2 text-xs mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : resetMode ? (
              'Send Reset Instructions'
            ) : (
              'Login'
            )}
          </button>
        </form>

        {resetMode && (
          <button
            type="button"
            onClick={() => {
              setResetMode(false);
              setErrorMsg('');
              setResetSuccess('');
            }}
            className="w-full mt-3 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-center font-medium"
          >
            Back to Login
          </button>
        )}
      </div>

      {/* Bottom Sign Up Link & Guest Mode */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-900 text-center text-xs space-y-2">
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Don't have an account? </span>
          <button
            onClick={onGoToRegister}
            className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
          >
            Create Account
          </button>
        </div>
        {onExploreGuest && (
          <div>
            <button
              type="button"
              onClick={onExploreGuest}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[11px] font-medium"
            >
              Explore feed as guest →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
