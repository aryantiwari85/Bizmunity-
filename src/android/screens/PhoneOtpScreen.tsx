import React, { useState, useEffect, useRef } from 'react';
import { Phone, ArrowLeft, Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { setupRecaptcha, startPhoneAuth } from '../../firebase/authService';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { BizmunityLogo } from '../../components/BizmunityLogo';

interface PhoneOtpScreenProps {
  onSuccess: (isNewUser?: boolean) => void;
  onGoBack: () => void;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'USA / Canada' },
  { code: '+91', country: 'India' },
  { code: '+44', country: 'UK' },
  { code: '+971', country: 'UAE' },
  { code: '+65', country: 'Singapore' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
];

export const PhoneOtpScreen: React.FC<PhoneOtpScreenProps> = ({ onSuccess, onGoBack }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneRaw.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanPhone}`;
    setLoading(true);
    setErrorMsg('');

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptcha('phone-recaptcha-container');
      }

      const confirmation = await startPhoneAuth(fullPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setCountdown(30);
      setSuccessMsg(`OTP sent to ${fullPhoneNumber}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to send OTP. Check phone format.');
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await confirmationResult.confirm(otpCode);
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setErrorMsg('Invalid OTP. Please check the code.');
      } else if (err.code === 'auth/code-expired') {
        setErrorMsg('OTP has expired. Please request a new code.');
      } else {
        setErrorMsg(err.message || 'OTP Verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col justify-between p-6 text-zinc-900 dark:text-white overflow-y-auto">
      <div id="phone-recaptcha-container"></div>

      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2 mb-6">
          <button onClick={onGoBack} className="p-1 -ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <BizmunityLogo size="xs" showText={false} />
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Phone Authentication</span>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">
            {!confirmationResult ? 'Login with Phone Number' : 'Verify 6-Digit Code'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {!confirmationResult
              ? 'Receive a secure one-time password on your mobile device.'
              : `Enter the code sent to ${countryCode} ${phoneRaw}`}
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

        {!confirmationResult ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Country & Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-28 text-xs py-2.5 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.country})
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phoneRaw}
                    onChange={(e) => setPhoneRaw(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2 text-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Verification Code
                </label>
                {countdown > 0 ? (
                  <span className="text-[11px] text-zinc-400 font-mono">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend
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
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmationResult(null)}
                className="w-1/3 py-2.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400"
              >
                Change
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center text-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Login'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 text-center text-xs">
        <button onClick={onGoBack} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium">
          Cancel and return to Email login
        </button>
      </div>
    </div>
  );
};
