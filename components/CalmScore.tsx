'use client';

import { motion } from 'framer-motion';

interface Props {
  score: number;
}

export default function CalmScore({ score }: Props) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90 drop-shadow-lg">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="none"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
      </svg>
      <motion.span
        className="text-5xl font-bold mt-4"
        style={{ color }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        {score}
      </motion.span>
      <span className="text-sm text-gray-500 mt-1 uppercase tracking-wide">Calm Score</span>
    </div>
  );
}