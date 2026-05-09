'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Props {
  score: number;
  previousScore?: number;
}

export default function CalmScore({ score, previousScore = 0 }: Props) {
  const radius = 72;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const viewBoxSize = (radius + strokeWidth) * 2 + 4;
  const center = viewBoxSize / 2;

  // Color logic
  const color =
    score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';
  const glowColor =
    score >= 70
      ? 'rgba(16,185,129,0.25)'
      : score >= 40
      ? 'rgba(245,158,11,0.25)'
      : 'rgba(244,63,94,0.25)';

  const label =
    score >= 70 ? 'Calm' : score >= 40 ? 'Moderate' : 'Chaotic';

  // Animated counter
  const countRef = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(previousScore);

  useEffect(() => {
    const controls = animate(motionVal, score, {
      duration: 1.8,
      ease: 'easeInOut',
      onUpdate: (v) => {
        if (countRef.current) {
          countRef.current.textContent = Math.round(v).toString();
        }
      },
    });
    return controls.stop;
  }, [score]);

  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="section-label mb-1">Calm Score™</p>
      <div className="relative flex items-center justify-center">
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: glowColor }}
        />

        <svg
          width={viewBoxSize}
          height={viewBoxSize}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="-rotate-90"
          style={{ filter: `drop-shadow(0 0 16px ${glowColor})` }}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center">
          <span
            ref={countRef}
            className="text-4xl font-bold leading-none"
            style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {previousScore}
          </span>
          <span className="text-xs mt-1" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      {/* Score bar description */}
      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs" style={{ color: '#f43f5e' }}>Chaotic</span>
        <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#f43f5e] via-[#f59e0b] to-[#10b981] opacity-60" />
        <span className="text-xs" style={{ color: '#10b981' }}>Calm</span>
      </div>
    </div>
  );
}