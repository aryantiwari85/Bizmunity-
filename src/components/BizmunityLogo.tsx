import React, { useState } from 'react';

export interface BizmunityLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'icon' | 'horizontal';
  showText?: boolean;
  tagline?: string;
  animate?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BizmunityLogo: React.FC<BizmunityLogoProps> = ({
  size = 'md',
  variant = 'icon',
  animate = false,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  // Height mappings for exact PNG renders
  const iconHeightMap = {
    xs: 'h-7 w-auto',
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-28 w-auto',
    hero: 'h-40 w-auto',
  };

  const horizontalHeightMap = {
    xs: 'h-6 w-auto',
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
    hero: 'h-20 w-auto',
  };

  // 1. HORIZONTAL LOGO: 1000075337-Picsart-BackgroundRemover.png
  if (variant === 'horizontal') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img
          src="/1000075337-Picsart-BackgroundRemover.png"
          alt="Bizmunity"
          onError={() => setImageError(true)}
          className={`${horizontalHeightMap[size]} object-contain shrink-0 ${
            animate ? 'transition-transform duration-300 hover:scale-105' : ''
          }`}
        />
      </div>
    );
  }

  // 2. VERTICAL / SPLASH LOGO: 1000075340-Picsart-BackgroundRemover.png
  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src="/1000075340-Picsart-BackgroundRemover.png"
        alt="Bizmunity"
        onError={() => setImageError(true)}
        className={`${iconHeightMap[size]} object-contain shrink-0 ${
          animate ? 'transition-transform duration-500 hover:scale-105' : ''
        }`}
      />
    </div>
  );
};
