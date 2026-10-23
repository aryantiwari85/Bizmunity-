import React, { useState } from 'react';
import { Users, Megaphone, Award, ArrowRight, Check } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: Users,
    gradient: 'from-amber-500 to-orange-600',
    title: 'Founder & Business Communities',
    description:
      'Join curated circles of verified entrepreneurs, local businesses, and digital creators to collaborate, share knowledge, and scale.',
  },
  {
    icon: Megaphone,
    gradient: 'from-orange-500 to-rose-600',
    title: 'Real-time Feed & Announcements',
    description:
      'Share business updates, product launches, special offers, and RSVP to offline & online networking meetups in realtime.',
  },
  {
    icon: Award,
    gradient: 'from-rose-500 to-purple-600',
    title: 'Loyalty Rewards & Streaks',
    description:
      'Earn points every day, build consecutive login streaks, unlock VIP tier badges, and redeem exclusive business coupons.',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col justify-between p-6 text-zinc-900 dark:text-white select-none">
      {/* Top Bar with Skip */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onComplete}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1 rounded-full transition"
        >
          Skip
        </button>
      </div>

      {/* Main Slide Illustration & Content */}
      <div className="flex flex-col items-center text-center px-4 my-auto">
        <div
          className={`w-24 h-24 rounded-3xl bg-gradient-to-tr ${slide.gradient} flex items-center justify-center text-white shadow-xl shadow-orange-500/20 mb-8 animate-in zoom-in-90 duration-300`}
        >
          <Icon className="w-12 h-12 stroke-[1.8]" />
        </div>

        <h2 className="text-2xl font-black tracking-tight mb-3 text-zinc-900 dark:text-white">
          {slide.title}
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
          {slide.description}
        </p>
      </div>

      {/* Bottom Controls: Dots & Action Button */}
      <div className="space-y-6 pb-4">
        {/* Dot Indicators */}
        <div className="flex justify-center items-center gap-2">
          {SLIDES.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-6 bg-orange-500'
                  : 'w-2 bg-zinc-300 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Android Material Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 text-sm"
        >
          {currentSlide === SLIDES.length - 1 ? (
            <>
              Get Started <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
