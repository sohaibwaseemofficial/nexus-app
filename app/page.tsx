'use client';

import { useEffect, useState } from 'react';
import { seedIfEmpty } from '../lib/seedData';
import CalmScore from '../components/CalmScore';

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
  calmScore: number;
  scores: number[];
  items: Item[];
}

export default function Home() {
  const [intention, setIntention] = useState('');
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Seed mock data on first load
  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true));
  }, []);

  const generateBriefing = async () => {
    if (!intention.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intention }),
      });
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error('Failed to fetch briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  const highestCriticalItem = briefing?.items.find((item: any, idx: number) => {
    return briefing.scores?.[idx] >= 80 || item.is_critical;
  });

  const [rssLoading, setRssLoading] = useState(false);

  const refreshRSS = async () => {
    setRssLoading(true);
    try {
      await fetch('/api/rss-refresh');
      // After adding items, re‑generate the briefing with the current intention
      if (intention.trim()) {
        await generateBriefing(); // we already have this function
      }
    } catch (err) {
      console.error('RSS refresh failed:', err);
    } finally {
      setRssLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-2">Nexus</h1>
        <div className="text-center mb-4">
          <button
            onClick={refreshRSS}
            disabled={rssLoading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition"
          >
            {rssLoading ? 'Fetching...' : '🔄 Pull Live News'}
          </button>
        </div>
        <p className="text-center text-gray-500 mb-10">Your information streams. One question. Zero noise.</p>

        {/* Intention Input Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 transition hover:shadow-lg">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            What matters to you today?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateBriefing()}
              placeholder="e.g. Finalize Q3 budget report"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
            <button
              onClick={generateBriefing}
              disabled={loading || !intention.trim()}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Thinking...' : 'Generate Briefing'}
            </button>
          </div>
        </div>

        {/* Main Dashboard Area (appears after briefing) */}
        {briefing && (
          <>
            {/* Calm Score */}
            <div className="bg-white rounded-2xl shadow-md p-8 mb-6 flex justify-center">
              <CalmScore score={briefing.calmScore} />
            </div>

            {/* Narrative & Future‑Self Nudge */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              {focusMode ? (
                <div className="text-center p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">🔍 Focus Mode</h3>
                  {highestCriticalItem ? (
                    <div>
                      <p className="text-lg font-semibold text-gray-800">{highestCriticalItem.title}</p>
                      <p className="text-gray-600 mt-2">{highestCriticalItem.body?.slice(0, 200)}</p>
                      <p className="text-xs text-gray-400 mt-2">From: {highestCriticalItem.sender || 'Unknown'}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No critical items to focus on. Enjoy the calm!</p>
                  )}
                  <button
                    onClick={() => setFocusMode(false)}
                    className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Exit Focus Mode
                  </button>
                </div>
              ) : (
                <>
                  {/* Narrative */}
                  <div className="prose max-w-none">
                    {briefing.narrative.split('\n').map((line, i) => (
                      <p key={i} className="text-gray-700 leading-relaxed mb-3">
                        {line}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => setFocusMode(true)}
                    className="mt-4 text-indigo-600 font-medium underline hover:no-underline"
                  >
                    Enter Focus Mode
                  </button>
                </>
              )}
            </div>

            {/* Item List with Relevance Scores */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">All Items</h2>
              <ul className="space-y-3">
                {briefing.items.map((item, idx) => {
                  const score = briefing.scores?.[idx] ?? 0;
                  const isUrgent = score >= 80;
                  return (
                    <li
                      key={item.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{item.title}</span>
                          {isUrgent && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{item.source_type} {item.sender && `· ${item.sender}`}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <div className="flex items-center gap-1 text-sm">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-gray-600 w-8 text-right">{score}%</span>
                        </div>
                        <button
                          onClick={async () => {
                            await fetch('/api/snooze', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ itemId: item.id }),
                            });
                            // Re‑pull the briefing so the item disappears instantly
                            generateBriefing();
                          }}
                          className="text-xs bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 transition"
                        >
                          Snooze
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {/* Empty state if not yet generated */}
        {!briefing && !loading && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg">Type your intention above and click “Generate Briefing” to see the magic.</p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
          </div>
        )}
      </div>
    </main>
  );
}