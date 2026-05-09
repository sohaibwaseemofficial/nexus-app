'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CalmScore from '../components/CalmScore';
import ItemCard from '../components/ItemCard';
import FocusMode from '../components/FocusMode';
import ToastContainer, { ToastMessage } from '../components/Toast';

/* ─── Types ─────────────────────────────────────────────── */
interface Item {
  id: number;
  title: string;
  body: string;
  source_type: string;
  sender?: string;
  is_critical: boolean;
}

interface Briefing {
  narrative: string;
  futureSelf: string;
  calmScore: number;
  scores: number[];
  items: Item[];
}

type FilterType = 'all' | 'email' | 'calendar' | 'rss' | 'critical';

/* ─── Helpers ────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2);
}

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All',
  email: '✉ Email',
  calendar: '📅 Calendar',
  rss: '📡 News',
  critical: '⚡ Critical',
};

/* ─── Skeleton loader ────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="glass-sm p-4 flex items-center gap-3">
      <div className="skeleton w-9 h-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-2 w-1/2 rounded" />
      </div>
      <div className="skeleton w-16 h-6 rounded-full flex-shrink-0" />
    </div>
  );
}

/* ─── Hero empty state ───────────────────────────────────── */
function EmptyHero({ onExample }: { onExample: (v: string) => void }) {
  const examples = [
    'Finalize Q3 budget report',
    'Ship the product launch today',
    'Prepare for the client pitch',
    'Clear my backlog before vacation',
  ];
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="w-20 h-20 rounded-2xl glass glow-indigo flex items-center justify-center text-4xl mb-6">
        🧠
      </div>
      <h2 className="text-xl font-semibold text-[#f0f4ff] mb-2">
        Start with your intention
      </h2>
      <p className="text-sm text-[#8892a4] max-w-sm mb-8">
        Tell Nexus what matters today. It will scan your information streams
        and surface only what's truly relevant.
      </p>
      <p className="section-label mb-4">Try an example</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onExample(ex)}
            className="text-xs px-4 py-2 rounded-full border border-[rgba(99,102,241,0.3)] text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.1)] transition-all-300"
          >
            {ex}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function Home() {
  const [intention, setIntention] = useState('');
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [prevScore, setPrevScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rssLoading, setRssLoading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [snoozingId, setSnoozingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [seeded, setSeeded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Seed on first load via API route */
  useEffect(() => {
    fetch('/api/seed').finally(() => setSeeded(true));
  }, []);

  /* Toast helpers */
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = uid();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* Generate briefing */
  const generateBriefing = useCallback(async (intentionOverride?: string) => {
    const val = intentionOverride ?? intention;
    if (!val.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intention: val }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setPrevScore(briefing?.calmScore ?? 0);
      setBriefing(data);
      setFilter('all');
    } catch {
      addToast('Failed to generate briefing. Check your API keys.', 'error');
    } finally {
      setLoading(false);
    }
  }, [intention, briefing, addToast]);

  /* Pull live RSS */
  const refreshRSS = useCallback(async () => {
    setRssLoading(true);
    try {
      const res = await fetch('/api/rss-refresh');
      const data = await res.json();
      addToast(`✓ Added ${data.added ?? 0} live news items`, 'success');
      if (intention.trim()) await generateBriefing();
    } catch {
      addToast('RSS fetch failed', 'error');
    } finally {
      setRssLoading(false);
    }
  }, [intention, generateBriefing, addToast]);

  /* Snooze item */
  const handleSnooze = useCallback(async (itemId: number) => {
    setSnoozingId(itemId);
    try {
      await fetch('/api/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      addToast('Item snoozed for 3 hours 💤', 'success');
      await generateBriefing();
    } catch {
      addToast('Snooze failed', 'error');
    } finally {
      setSnoozingId(null);
    }
  }, [generateBriefing, addToast]);

  /* Derive filtered items */
  const filteredItems = briefing
    ? briefing.items.filter((item, idx) => {
        if (filter === 'critical') return (briefing.scores[idx] ?? 0) >= 75 || item.is_critical;
        if (filter === 'all') return true;
        return item.source_type === filter;
      })
    : [];

  /* Focus mode item */
  const focusItem = briefing
    ? briefing.items.reduce<{ item: Item; score: number; idx: number } | null>((best, item, idx) => {
        const score = briefing.scores[idx] ?? 0;
        if (!best || score > best.score) return { item, score, idx };
        return best;
      }, null)
    : null;

  /* Filter counts */
  const getCounts = () => {
    if (!briefing) return {} as Record<FilterType, number>;
    return {
      all: briefing.items.length,
      email: briefing.items.filter((i) => i.source_type === 'email').length,
      calendar: briefing.items.filter((i) => i.source_type === 'calendar').length,
      rss: briefing.items.filter((i) => i.source_type === 'rss').length,
      critical: briefing.items.filter((_, idx) => (briefing.scores[idx] ?? 0) >= 75).length,
    };
  };

  const counts = getCounts();

  return (
    <>
      {/* Focus Mode overlay */}
      <AnimatePresence>
        {focusMode && focusItem && (
          <FocusMode
            item={focusItem.item}
            score={focusItem.score}
            onExit={() => setFocusMode(false)}
          />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="min-h-screen hero-bg pb-24 sm:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">

          {/* ── Header ── */}
          <motion.header
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-sm text-xs text-[#8892a4] mb-4 border border-[rgba(99,102,241,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              AI-Powered · Zero Noise · Free Tier
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight gradient-text mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              NEXUS
            </h1>
            <p className="text-[#8892a4] text-sm sm:text-base">
              Your information streams. <span className="text-[#a5b4fc]">One question.</span> Zero noise.
            </p>
          </motion.header>

          {/* ── Intention Input ── */}
          <motion.div
            className="glass glow-indigo p-5 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label
              htmlFor="intention-input"
              className="block text-sm font-semibold text-[#f0f4ff] mb-3"
            >
              🎯 What matters to you today?
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="intention-input"
                ref={inputRef}
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateBriefing()}
                placeholder="e.g. Finalize Q3 budget report…"
                className="nexus-input flex-1 px-4 py-3 text-sm"
                disabled={loading}
                autoComplete="off"
              />
              <button
                id="generate-briefing-btn"
                onClick={() => generateBriefing()}
                disabled={loading || !intention.trim()}
                className="btn-primary px-6 py-3 text-sm whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Thinking…
                  </span>
                ) : (
                  '✨ Generate Briefing'
                )}
              </button>
            </div>

            {/* Action row */}
            <div className="flex flex-wrap gap-2 mt-4 items-center justify-between">
              <button
                id="rss-refresh-btn"
                onClick={refreshRSS}
                disabled={rssLoading}
                className="btn-emerald text-xs px-4 py-2"
              >
                {rssLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                    Fetching…
                  </span>
                ) : (
                  '📡 Pull Live News'
                )}
              </button>

              {briefing && (
                <button
                  id="focus-mode-btn"
                  onClick={() => setFocusMode(true)}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  🔍 Enter Focus Mode
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Loading skeletons ── */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 mb-6"
              >
                <div className="glass p-6 mb-6 flex flex-col items-center gap-4">
                  <div className="skeleton w-40 h-40 rounded-full" />
                  <div className="skeleton w-24 h-4 rounded" />
                </div>
                <div className="glass p-5 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="skeleton h-3 w-full rounded" />
                      <div className="skeleton h-3 w-4/5 rounded" />
                    </div>
                  ))}
                </div>
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Empty state ── */}
          {!briefing && !loading && (
            <EmptyHero onExample={(v) => { setIntention(v); }} />
          )}

          {/* ── Dashboard ── */}
          <AnimatePresence>
            {briefing && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                {/* ── Calm Score + Stats Row ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Calm score card */}
                  <div className="glass p-6 flex items-center justify-center sm:col-span-1">
                    <CalmScore score={briefing.calmScore} previousScore={prevScore} />
                  </div>

                  {/* Stats */}
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    {[
                      {
                        label: 'Total Items',
                        value: briefing.items.length,
                        icon: '📬',
                        color: '#a5b4fc',
                      },
                      {
                        label: 'Critical',
                        value: briefing.scores.filter((s) => s >= 75).length,
                        icon: '⚡',
                        color: '#fb7185',
                      },
                      {
                        label: 'Snoozed Noise',
                        value: Math.max(0, briefing.items.length - briefing.scores.filter((s) => s >= 30).length),
                        icon: '💤',
                        color: '#6b7280',
                      },
                      {
                        label: 'Avg Relevance',
                        value: `${Math.round(briefing.scores.reduce((a, b) => a + b, 0) / (briefing.scores.length || 1))}%`,
                        icon: '🎯',
                        color: '#34d399',
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="glass-sm p-4 flex flex-col gap-1">
                        <span className="text-xl">{stat.icon}</span>
                        <span
                          className="text-2xl font-bold"
                          style={{ color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {stat.value}
                        </span>
                        <span className="text-xs text-[#8892a4]">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── AI Briefing narrative ── */}
                <motion.div
                  className="glass p-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🤖</span>
                    <h2 className="font-semibold text-[#f0f4ff] text-sm">AI Briefing</h2>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                      Gemini 1.5 Flash
                    </span>
                  </div>

                  <div className="space-y-3">
                    {briefing.narrative
                      .split('\n')
                      .filter(Boolean)
                      .map((line, i) => (
                        <p key={i} className="text-sm text-[#c8d2e8] leading-relaxed">
                          {line}
                        </p>
                      ))}
                  </div>

                  {/* Future self nudge */}
                  {briefing.futureSelf && (
                    <div className="mt-5 p-4 rounded-xl"
                      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <p className="text-xs font-semibold text-[#818cf8] uppercase tracking-wider mb-1">
                        🌅 Future-Self Nudge
                      </p>
                      <p className="text-sm text-[#a5b4fc] italic leading-relaxed">
                        {briefing.futureSelf}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* ── Item list ── */}
                <motion.div
                  className="glass p-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {/* Filter tabs */}
                  <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                    {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => {
                      const cnt = counts[f] ?? 0;
                      if (cnt === 0 && f !== 'all') return null;
                      return (
                        <button
                          key={f}
                          id={`filter-${f}`}
                          onClick={() => setFilter(f)}
                          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all-300 border ${
                            filter === f
                              ? 'bg-[#6366f1] text-white border-[#6366f1]'
                              : 'bg-transparent text-[#8892a4] border-[rgba(255,255,255,0.08)] hover:border-[rgba(99,102,241,0.3)]'
                          }`}
                        >
                          {FILTER_LABELS[f]}
                          {cnt > 0 && (
                            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20' : 'bg-[rgba(255,255,255,0.07)]'}`}>
                              {cnt}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Items */}
                  <AnimatePresence mode="popLayout">
                    {filteredItems.length === 0 ? (
                      <motion.p
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-[#8892a4] text-center py-8"
                      >
                        No items in this category.
                      </motion.p>
                    ) : (
                      <ul className="space-y-2">
                        {filteredItems.map((item) => {
                          const idx = briefing.items.findIndex((i) => i.id === item.id);
                          const score = briefing.scores[idx] ?? 0;
                          return (
                            <ItemCard
                              key={item.id}
                              item={item}
                              score={score}
                              onSnooze={handleSnooze}
                              snoozingId={snoozingId}
                            />
                          );
                        })}
                      </ul>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mobile bottom bar ── */}
        {briefing && (
          <div className="fixed bottom-0 left-0 right-0 sm:hidden glass-sm border-t border-[rgba(255,255,255,0.07)] px-4 py-3 flex items-center gap-3 mobile-safe-bottom">
            <button
              onClick={() => setFocusMode(true)}
              className="flex-1 btn-primary py-2.5 text-sm"
            >
              🔍 Focus Mode
            </button>
            <button
              onClick={refreshRSS}
              disabled={rssLoading}
              className="flex-1 btn-ghost py-2.5 text-sm"
            >
              {rssLoading ? '…' : '📡 Live News'}
            </button>
          </div>
        )}
      </main>
    </>
  );
}