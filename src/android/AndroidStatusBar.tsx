import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export const AndroidStatusBar: React.FC<{ lightTheme?: boolean }> = ({ lightTheme = false }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`h-7 px-5 flex items-center justify-between text-[11px] font-semibold tracking-tight select-none z-50 transition-colors ${
        lightTheme
          ? 'bg-transparent text-zinc-800'
          : 'bg-zinc-950 text-white'
      }`}
    >
      {/* Android System Clock */}
      <span className="font-medium tracking-tight">{time || '09:41'}</span>

      {/* Android System Icons */}
      <div className="flex items-center gap-1.5 opacity-90">
        <Signal className="w-3.5 h-3.5 fill-current" />
        <span className="text-[10px] font-bold">5G</span>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] font-medium mr-0.5">88%</span>
          <Battery className="w-4 h-4 fill-current" />
        </div>
      </div>
    </div>
  );
};
