'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntegrationsModal({ isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const webhookUrl = "https://nexus-app.vercel.app/api/webhook/user-123";

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[#0d1424] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Connect Data Sources</h2>
            <p className="text-sm text-gray-400 mb-6">
              Nexus filters your notifications. Connect your apps or use the mobile shortcut workaround.
            </p>

            <div className="space-y-3 mb-6">
              {/* Mock OAuth Integrations */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✉️</span>
                  <span className="text-sm font-medium text-white">Google Workspace</span>
                </div>
                <button className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                  Connected
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <span className="text-sm font-medium text-white">Slack</span>
                </div>
                <button className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition">
                  Connect
                </button>
              </div>
            </div>

            {/* The "Hackathon Winning" feature explanation */}
            <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/30">
              <h3 className="text-sm font-bold text-indigo-300 mb-2">📱 Phone Notification Sync</h3>
              <p className="text-xs text-indigo-200/70 mb-3 leading-relaxed">
                Since web apps cannot natively read iOS/Android system notifications, use our custom Webhook to sync them.
                Create an Apple Shortcut or Tasker profile that POSTs incoming notifications to this unique URL.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-indigo-500 transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button 
                onClick={async () => {
                  if ('Notification' in window) {
                    await Notification.requestPermission();
                    new Notification("Nexus Web Notifications", { 
                      body: "You'll now receive desktop alerts for critical items.",
                      icon: "/icon-192x192.png" 
                    });
                  }
                }}
                className="text-xs text-gray-400 underline hover:text-white"
              >
                Enable Desktop Notifications
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
