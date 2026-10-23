import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [mounted, setMounted] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Fade-in trigger
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 50);

    // Fade-out trigger after ~2200ms
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 2200);

    // Complete splash
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2550);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`flex-1 bg-white flex flex-col items-center justify-between p-8 text-zinc-900 select-none transition-opacity duration-350 ease-out ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div />

      {/* Centered Real Bizmunity Splash Logo (1000075340-Picsart-BackgroundRemover.png) */}
      <div
        className={`flex flex-col items-center text-center transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${
          mounted
            ? 'opacity-100 transform scale-100 translate-y-0'
            : 'opacity-0 transform scale-90 translate-y-2'
        }`}
      >
        <img
          src="/1000075340-Picsart-BackgroundRemover.png"
          alt="Bizmunity"
          className="w-52 h-auto object-contain drop-shadow-sm select-none"
        />
        <p className="text-[11px] font-bold text-orange-500 tracking-widest uppercase mt-4">
          Business &amp; Creator Network
        </p>
      </div>

      <div className="pb-4" />
    </div>
  );
};
