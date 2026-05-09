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
  onSnooze: (id: number) => void;
  snoozingId: number | null;
}

const SOURCE_ICONS: Record<string, string> = {
  email: '✉',
  calendar: '📅',
  rss: '📡',
  slack: '💬',
};

function getBarColor(score: number) {
  if (score >= 75) return 'linear-gradient(90deg, #f43f5e, #fb7185)';
  if (score >= 45) return 'linear-gradient(90deg, #f59e0b, #fcd34d)';
  return 'linear-gradient(90deg, #374151, #4b5563)';
}

function getScoreClass(score: number) {
  if (score >= 75) return 'score-high text-[#fb7185]';
  if (score >= 45) return 'score-mid text-[#fcd34d]';
  return 'score-low text-[#6b7280]';
}

export default function ItemCard({ item, score, onSnooze, snoozingId }: Props) {
  const isUrgent = score >= 75 || item.is_critical;
  const isSnoozingThis = snoozingId === item.id;
  const icon = SOURCE_ICONS[item.source_type] ?? '📌';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`glass-sm card-hover p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
        isUrgent ? 'border-[rgba(244,63,94,0.2)]' : ''
      }`}
    >
      {/* Source icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[#f0f4ff] truncate">{item.title}</span>
          {isUrgent && (
            <span className="badge badge-critical">⚡ Critical</span>
          )}
          <span className={`badge badge-${item.source_type}`}>
            {item.source_type}
          </span>
        </div>
        {item.sender && (
          <p className="text-xs text-[#8892a4] mt-0.5 truncate">
            From: {item.sender}
          </p>
        )}
        {item.body && (
          <p className="text-xs text-[#4b5563] mt-1 line-clamp-1">{item.body}</p>
        )}
      </div>

      {/* Score + Snooze */}
      <div className="flex items-center gap-3 sm:flex-shrink-0">
        {/* Relevance bar */}
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-bold ${getScoreClass(score)}`}>{score}%</span>
          <div className="relevance-bar-bg">
            <div
              className="relevance-bar-fill"
              style={{
                width: `${score}%`,
                background: getBarColor(score),
              }}
            />
          </div>
        </div>

        {/* Snooze button */}
        <button
          onClick={() => onSnooze(item.id)}
          disabled={isSnoozingThis}
          aria-label={`Snooze ${item.title}`}
          className="btn-ghost text-xs px-3 py-1.5 whitespace-nowrap disabled:opacity-40"
        >
          {isSnoozingThis ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full" />
              Snoozing
            </span>
          ) : (
            '💤 Snooze'
          )}
        </button>
      </div>
    </motion.li>
  );
}
