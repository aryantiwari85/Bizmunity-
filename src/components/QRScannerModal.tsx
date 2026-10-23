import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  User,
  ArrowRight,
  Loader2,
  Flame,
  Award,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { performCommunityCheckIn } from '../firebase/firestoreService';
import { parseQRPayload } from '../utils/bizmunityLogic';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScannedUser: (userId: string) => void;
  onScannedBusiness: (communityId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScannedUser,
  onScannedBusiness,
}) => {
  const { currentUser } = useAuth();
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'user' | 'community' | 'checkin' | 'unknown';
    title: string;
    description: string;
    data?: any;
    isCheckIn?: boolean;
    streak?: number;
    pointsEarned?: number;
    milestoneReward?: string;
    alreadyCheckedIn?: boolean;
    communityName?: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Initialize and clean up camera scanner
  useEffect(() => {
    if (!isOpen || activeMode !== 'camera') {
      if (scannerRef.current && scannerStarted) {
        scannerRef.current
          .stop()
          .catch((err) => console.warn('Error stopping scanner:', err))
          .finally(() => {
            scannerRef.current = null;
            setScannerStarted(false);
          });
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const scannerId = 'qr-reader-viewport';
        const element = document.getElementById(scannerId);
        if (!element) return;

        const html5Qr = new Html5Qrcode(scannerId);
        scannerRef.current = html5Qr;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setCameraError('No camera found on this device. Please use Image Upload.');
          setActiveMode('upload');
          return;
        }

        const cameraId = cameras[cameras.length - 1].id; // Prefer back camera

        await html5Qr.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          () => {
            // Frame parse error, ignore
          }
        );

        setScannerStarted(true);
        setCameraError('');
      } catch (err: any) {
        console.warn('Camera start failed:', err);
        setCameraError('Camera access unavailable or blocked in this environment. Use image upload.');
        setActiveMode('upload');
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerStarted) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
            setScannerStarted(false);
          });
      }
    };
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  // Process decoded QR text
  const handleDecodedText = async (rawText: string) => {
    if (processing) return;
    setProcessing(true);

    // Stop camera if running
    if (scannerRef.current && scannerStarted) {
      try {
        await scannerRef.current.stop();
        setScannerStarted(false);
      } catch (e) {}
    }

    try {
      const parsed = parseQRPayload(rawText);

      // 1. CHECK-IN QR
      if (parsed.type === 'checkin' && parsed.communityId) {
        if (!currentUser) {
          setScanResult({
            type: 'checkin',
            title: 'Sign In Required',
            description: 'Please sign in to Bizmunity to check in and earn streak rewards!',
          });
          setProcessing(false);
          return;
        }

        const res = await performCommunityCheckIn(
          currentUser.uid,
          parsed.communityId,
          parsed.checkInCode || ''
        );

        if (res.alreadyCheckedIn) {
          setScanResult({
            type: 'checkin',
            title: 'Already Checked In Today!',
            description: res.message || 'You have already checked in today! Come back tomorrow to continue your streak.',
            isCheckIn: true,
            alreadyCheckedIn: true,
            streak: res.streak || 1,
            communityName: res.communityName,
          });
        } else if (res.success) {
          setScanResult({
            type: 'checkin',
            title: `🔥 Day ${res.streak} Streak!`,
            description: `Checked in successfully at ${res.communityName || 'the community'}!`,
            isCheckIn: true,
            alreadyCheckedIn: false,
            streak: res.streak,
            pointsEarned: res.pointsEarned,
            milestoneReward: res.milestoneReward,
            communityName: res.communityName,
          });
        } else {
          setScanResult({
            type: 'checkin',
            title: 'Check-In Notice',
            description: res.message || 'Could not verify check-in QR code.',
          });
        }
      }
      // 2. USER PROFILE QR
      else if (parsed.type === 'user' && parsed.userId) {
        setScanResult({
          type: 'user',
          title: `User Profile: @${parsed.username || 'member'}`,
          description: 'Opening member profile, communities, and posts...',
          data: parsed,
        });
        setTimeout(() => {
          onClose();
          onScannedUser(parsed.userId!);
        }, 1200);
      }
      // 3. COMMUNITY PROFILE QR
      else if (parsed.type === 'community' && parsed.communityId) {
        setScanResult({
          type: 'community',
          title: `Community: ${parsed.name || 'Verified Community'}`,
          description: 'Opening community profile, deals, events, and posts...',
          data: parsed,
        });
        setTimeout(() => {
          onClose();
          onScannedBusiness(parsed.communityId!);
        }, 1200);
      } else {
        setScanResult({
          type: 'unknown',
          title: 'Unrecognized QR Code',
          description: 'This QR code is not recognized as a Bizmunity Profile, Community, or Check-In QR.',
        });
      }
    } catch (err: any) {
      console.error('Scan handling failed:', err);
      setScanResult({
        type: 'unknown',
        title: 'Scan Error',
        description: err.message || 'Could not verify QR code. Please try again.',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Image Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setCameraError('');

    try {
      const html5Qr = new Html5Qrcode('qr-upload-sandbox');
      const text = await html5Qr.scanFile(file, true);
      handleDecodedText(text);
    } catch (err: any) {
      console.error('Failed to parse uploaded QR image:', err);
      setCameraError('No QR code detected in this image. Please choose a clearer image.');
      setProcessing(false);
    }
  };

  // Manual submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedText(manualInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-black text-sm text-zinc-900 dark:text-white">
              Bizmunity QR Scanner
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 flex gap-1">
          <button
            onClick={() => {
              setActiveMode('camera');
              setScanResult(null);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMode === 'camera'
                ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('upload');
              setScanResult(null);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMode === 'upload'
                ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('manual');
              setScanResult(null);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMode === 'manual'
                ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Enter Code</span>
          </button>
        </div>

        {/* Viewport & Scan Area */}
        <div className="p-5 flex-1 flex flex-col items-center justify-center text-center overflow-y-auto">
          {cameraError && (
            <div className="w-full mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {scanResult ? (
            <div className="p-5 w-full bg-zinc-50 dark:bg-zinc-800/80 rounded-3xl border border-zinc-200 dark:border-zinc-700 space-y-4 animate-scale-up">
              {/* Check-In Celebration Display */}
              {scanResult.isCheckIn ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/35">
                    <Flame className="w-9 h-9 fill-current animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                      Check-In Verified
                    </span>
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center justify-center gap-1.5 pt-1">
                      🔥 Day {scanResult.streak} Streak
                    </h4>
                    <p className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                      +{scanResult.pointsEarned || 10} Points
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                      {scanResult.communityName}
                    </p>
                  </div>

                  {!scanResult.alreadyCheckedIn ? (
                    <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-orange-500/30 space-y-2.5 text-left shadow-sm">
                      {scanResult.milestoneReward && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Milestone Unlocked: {scanResult.milestoneReward}</span>
                        </div>
                      )}

                      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                          Tomorrow:
                        </span>
                        <div className="flex items-center justify-between text-xs font-black text-zinc-800 dark:text-zinc-200">
                          <span className="flex items-center gap-1">
                            🔥 Day {(scanResult.streak || 1) + 1}
                          </span>
                          <span className="text-orange-600 dark:text-orange-400 font-extrabold">
                            +{scanResult.pointsEarned || 10} Points
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center font-medium">
                        Continue increasing the streak every day!
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 text-center space-y-1">
                      <p className="font-extrabold text-zinc-900 dark:text-white">
                        Already Checked In Today!
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Current Streak: <strong className="text-orange-600">Day {scanResult.streak || 1}</strong>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Come back tomorrow to continue your streak to Day {(scanResult.streak || 1) + 1}!
                      </p>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {scanResult.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {scanResult.description}
                  </p>

                  <button
                    onClick={() => {
                      setScanResult(null);
                      setActiveMode('camera');
                    }}
                    className="w-full py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 font-bold text-xs rounded-xl transition"
                  >
                    Scan Another Code
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {activeMode === 'camera' && (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-64 h-64 rounded-3xl overflow-hidden border-2 border-orange-500 bg-black shadow-inner flex items-center justify-center">
                    <div id="qr-reader-viewport" className="w-full h-full"></div>

                    {/* Laser Scanner Animation */}
                    <div className="absolute inset-0 border-4 border-orange-500/30 rounded-3xl pointer-events-none">
                      <div className="w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 shadow-lg shadow-orange-500/80 animate-scan-pulse" />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-3">
                    Align Bizmunity QR code inside square frame to scan automatically
                  </p>
                </div>
              )}

              {activeMode === 'upload' && (
                <div className="w-full flex flex-col items-center py-4">
                  <label className="w-full py-8 border-2 border-dashed border-orange-500/50 hover:border-orange-500 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-50 dark:bg-zinc-900 transition">
                    <Upload className="w-8 h-8 text-orange-500" />
                    <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                      Select QR Code from Gallery / Files
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      PNG, JPG, or Screenshot supported
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <div id="qr-upload-sandbox" className="hidden"></div>
                </div>
              )}

              {activeMode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="w-full space-y-3 py-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Paste or Type QR Payload / Code
                    </label>
                    <textarea
                      rows={4}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder='e.g. {"type":"checkin", "communityId":"...", "checkInCode":"..."}'
                      className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-zinc-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processing || !manualInput.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
