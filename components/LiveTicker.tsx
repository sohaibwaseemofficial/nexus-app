'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface LiveItem {
  id: number;
  title: string;
  source_type: string;
  sender?: string;
  is_critical: boolean;
  created_at: string;
}

const SOURCE_ICONS: Record<string, string> = {
  email: '✉',
  calendar: '📅',
  rss: '📡',
  slack: '💬',
  phone: '📱',
  phone_notification: '📱',
  pc_notification: '🖥',
  alert: '🚨',
  default: '📌',
};

interface Props {
  onNewItem?: () => void; // called when new items arrive — triggers briefing re-gen if user wants
}

export default function LiveTicker({ onNewItem }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const [latest, setLatest] = useState<LiveItem[]>([]);
  const [flash, setFlash] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const res = await fetch('/api/items/status');
        if (!res.ok) return;
        const data = await res.json();

        if (!mounted) return;

        const newCount: number = data.count;
        const prev = prevCountRef.current;

        // If count increased — new item arrived!
        if (prev !== null && newCount > prev) {
          setFlash(true);
          setTimeout(() => setFlash(false), 1500);
          onNewItem?.();
        }

        prevCountRef.current = newCount;
        setCount(newCount);
        setLatest(data.latest ?? []);
      } catch {
        // silent fail — don't crash the UI if polling fails
      }
    }

    poll(); // immediate first poll
    const interval = setInterval(poll, 5000); // poll every 5s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [onNewItem]);

  if (count === null) return null; // not loaded yet

  const icon = SOURCE_ICONS[latest[0]?.source_type] ?? '📌';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 mb-5 ${
        flash
          ? 'border-[rgba(99,102,241,0.6)] bg-[rgba(99,102,241,0.12)]'
          : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      {/* Live dot */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`w-2 h-2 rounded-full ${flash ? 'bg-[#6366f1]' : 'bg-[#10b981]'} animate-pulse`}
        />
        <span className="text-xs font-semibold text-[#8892a4] uppercase tracking-wider">
          Live
        </span>
      </div>

      <div className="h-3 w-px bg-[rgba(255,255,255,0.08)]" />

      {/* Item count */}
      <span className="text-xs text-[#8892a4]">
        <span className="text-[#f0f4ff] font-bold">{count}</span> items in inbox
      </span>

      {/* Latest item ticker */}
      {latest.length > 0 && (
        <>
          <div className="h-3 w-px bg-[rgba(255,255,255,0.08)] hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 overflow-hidden flex-1 min-w-0">
            <span className="text-sm flex-shrink-0">{icon}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={latest[0]?.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-[#8892a4] truncate"
              >
                Latest: <span className="text-[#c8d2e8]">{latest[0]?.title}</span>
                {latest[0]?.sender && (
                  <span className="text-[#6366f1]"> · {latest[0].sender}</span>
                )}
              </motion.span>
            </AnimatePresence>
          </div>
        </>
      )}

      {/* New badge */}
      <AnimatePresence>
        {flash && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6366f1] text-white uppercase tracking-wider"
          >
            New!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
