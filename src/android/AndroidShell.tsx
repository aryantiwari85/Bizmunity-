import React from 'react';
import { AndroidStatusBar } from './AndroidStatusBar';

interface AndroidShellProps {
  children: React.ReactNode;
  lightTheme?: boolean;
}

export const AndroidShell: React.FC<AndroidShellProps> = ({ children, lightTheme = false }) => {
  return (
    <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center sm:p-2 select-none overflow-hidden">
      {/* Mobile Device Frame Container */}
      <div className="w-full sm:max-w-[412px] h-full sm:h-[96vh] sm:max-h-[860px] bg-white dark:bg-zinc-950 sm:rounded-[40px] shadow-2xl sm:border-[6px] sm:border-zinc-800 flex flex-col overflow-hidden relative sm:ring-1 sm:ring-white/10">
        {/* Android Camera Punch Hole */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 pointer-events-none hidden sm:block border border-zinc-800" />

        {/* Android Status Bar */}
        <AndroidStatusBar lightTheme={lightTheme} />

        {/* Screen Viewport with smooth scroll & safe padding */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
