import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  AtSign,
  Camera,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Phone,
} from 'lucide-react';
import { registerWithEmail, checkUsernameAvailable, signInWithGoogle } from '../../firebase/authService';
import { compressImage } from '../../utils/imageCompressor';
import { BizmunityLogo } from '../../components/BizmunityLogo';
import { useAuth } from '../../context/AuthContext';

interface RegisterScreenProps {
  onSuccess: (isNewUser?: boolean) => void;
  onGoToLogin: () => void;
  onGoToPhone: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSuccess,
  onGoToLogin,
  onGoToPhone,
}) => {
  const { setIsNewGoogleUser, setPendingGoogleUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string>('');

  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message: string;
  }>({ checking: false, message: '' });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Google Registration shortcut
  const handleGoogleRegister = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { user, profile, isNewUser } = await signInWithGoogle();
      if (isNewUser || !profile?.username) {
        setIsNewGoogleUser(true);
        setPendingGoogleUser(user);
        onSuccess(true);
      } else {
        onSuccess(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Realtime username availability checker
  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 3) {
      setUsernameStatus({ checking: false, message: '' });
      return;
    }

    setUsernameStatus({ checking: true, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean);
      if (res.available) {
        setUsernameStatus({
          checking: false,
          available: true,
          message: '✅ Username Available',
        });
      } else {
        setUsernameStatus({
          checking: false,
          available: false,
          message: '❌ Username Already Taken',
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.8);
      setAvatarBase64(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      if (!email || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!usernameStatus.available) {
        setErrorMsg('Please choose an available username to proceed.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
      await registerWithEmail(email, password, fullName.trim(), cleanUser);
      setSuccessMsg('Account Created! Welcome to Bizmunity.');
      setTimeout(() => {
        onSuccess(false);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Account creation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col justify-between p-6 text-zinc-900 dark:text-white overflow-y-auto">
      <div>
        {/* Top Header with Back & Step */}
        <div className="flex items-center justify-between pt-1 mb-5">
          <button
            onClick={step > 1 ? () => setStep((s) => (s - 1) as any) : onGoToLogin}
            className="p-1 -ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <BizmunityLogo size="xs" showText={false} />

          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
            Step {step} of 5
          </span>
        </div>

        {/* Step Progress Line */}
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Headings */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            {step === 1 && 'Create your account'}
            {step === 2 && 'Choose unique username'}
            {step === 3 && 'Secure your account'}
            {step === 4 && 'What is your full name?'}
            {step === 5 && 'Add profile photo'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {step === 1 && 'Sign up with Google, Phone, or continue with your email.'}
            {step === 2 && 'Usernames are unique across Bizmunity (@aryan, @founder).'}
            {step === 3 && 'Create a strong password with at least 6 characters.'}
            {step === 4 && 'This name will appear on your posts, circles, and verified profile.'}
            {step === 5 && 'Upload an optional profile picture, or skip to finish setup.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1 Quick Action Buttons (Google & Phone) */}
        {step === 1 && (
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={handleGoogleRegister}
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

            <button
              type="button"
              onClick={onGoToPhone}
              disabled={loading}
              className="w-full py-3 px-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 font-semibold rounded-2xl shadow-sm transition flex items-center justify-center gap-2.5 text-xs"
            >
              <Phone className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Continue with Phone Number</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                OR EMAIL
              </span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
          </div>
        )}

        {/* Multi-step Form */}
        <form onSubmit={handleNext} className="space-y-4">
          {/* Step 1: Email */}
          {step === 1 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@company.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Choose Username with Realtime Check */}
          {step === 2 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Unique @username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-xs font-bold text-zinc-400">@</div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  placeholder="aryan, founder, bizmunity"
                  className="w-full pl-8 pr-10 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
                {usernameStatus.checking && (
                  <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400 animate-spin" />
                )}
              </div>

              {/* Realtime Availability Message */}
              {usernameStatus.message && (
                <div
                  className={`mt-2 p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    usernameStatus.available
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                  }`}
                >
                  <span>{usernameStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Create Password */}
          {step === 3 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* Step 4: Full Name */}
          {step === 4 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aryan Tiwari"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* Step 5: Optional Profile Photo */}
          {step === 5 && (
            <div className="flex flex-col items-center py-2">
              <label className="relative cursor-pointer group mb-4">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-orange-500/50 overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 group-hover:border-orange-500 transition">
                  {avatarBase64 ? (
                    <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-400">
                      <Camera className="w-7 h-7 text-orange-500" />
                      <span className="text-[10px] font-semibold">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {/* Review summary */}
              <div className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-900/70 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Name:</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Username:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    @{username.replace(/^@/, '')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Email:</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit / Continue Button */}
          <button
            type="submit"
            disabled={loading || (step === 2 && !usernameStatus.available)}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2 text-xs mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : step === 5 ? (
              'Complete Registration & Launch App'
            ) : (
              <>
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom Sign In Link */}
      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 text-center text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Already have an account? </span>
        <button
          onClick={onGoToLogin}
          className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
