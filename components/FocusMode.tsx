'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  id: number;
  title: string;
  body: string;
  source_type: string;
  sender?: string;
  is_critical: boolean;
}

interface Props {
  item: Item;
  score: number;
  onExit: () => void;
}

export default function FocusMode({ item, score, onExit }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        className="focus-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <span className="section-label">Focus Mode</span>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#6366f1]" />
              <span className="text-2xl">🔍</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#6366f1]" />
            </div>
          </motion.div>

          {/* #1 Item */}
          <motion.div
            className="glass glow-indigo p-8 w-full mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="badge badge-critical">⚡ #1 Priority · {score}% relevance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f0f4ff] mb-4 leading-snug">
              {item.title}
            </h2>
            {item.body && (
              <p className="text-[#8892a4] leading-relaxed text-sm sm:text-base">
                {item.body}
              </p>
            )}
            {item.sender && (
              <p className="text-xs text-[#4b5563] mt-4">
                From: <span className="text-[#6366f1]">{item.sender}</span>
              </p>
            )}
          </motion.div>

          {/* Instruction */}
          <motion.p
            className="text-[#8892a4] text-sm mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            This is the single most important item right now. Handle it first.
          </motion.p>

          {/* Exit button */}
          <motion.button
            onClick={onExit}
            className="btn-ghost px-6 py-3 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Exit Focus Mode
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
