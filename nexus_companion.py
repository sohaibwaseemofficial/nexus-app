"""
Nexus Companion — Background Notification Bridge
Runs silently on your Windows PC, reads notifications, sends them to Nexus.

NO external dependencies needed for simulation mode — uses Python built-ins only.
For real Windows notifications: pip install winsdk

Usage:
    python nexus_companion.py                          # auto-detects mode
    python nexus_companion.py --simulate               # force simulation
    python nexus_companion.py --url https://YOUR.vercel.app/api/webhook/user-123
    python nexus_companion.py --install-startup        # run on Windows startup
"""

import asyncio
import argparse
import json
import time
import sys
import os
import random
import urllib.request
import urllib.error
from datetime import datetime

# Try importing the Windows SDK for real notifications
try:
    from winsdk.windows.ui.notifications.management import (
        UserNotificationListener,
        UserNotificationListenerAccessStatus,
    )
    from winsdk.windows.ui.notifications import NotificationKinds
    WINSDK_AVAILABLE = True
except ImportError:
    WINSDK_AVAILABLE = False

DEFAULT_WEBHOOK = "http://localhost:3000/api/webhook/user-123"
seen_notification_ids = set()

# Force UTF-8 output on Windows terminals
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


# ── Helpers ────────────────────────────────────────────────────────────

def send_to_nexus(title: str, body: str, app_name: str, url: str):
    """POST a captured notification to the Nexus web app (no pip install needed)."""
    payload = json.dumps({
        "title":      title,
        "body":       body,
        "sender":     app_name,
        "app":        app_name,
        "source_type": "pc_notification",
        "timestamp":  datetime.now().isoformat(),
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                ts = datetime.now().strftime("%H:%M:%S")
                print(f"  [{ts}] ✅  [{app_name}] {title[:60]}")
            else:
                print(f"  ❌  Nexus returned {resp.status}")
    except urllib.error.URLError as e:
        print(f"  ❌  Cannot reach Nexus ({e.reason}). Is the app running?")


def install_startup():
    """Add this script to Windows startup via the Startup folder."""
    startup_dir = os.path.join(
        os.environ.get("APPDATA", ""),
        r"Microsoft\Windows\Start Menu\Programs\Startup",
    )
    script_path = os.path.abspath(__file__)
    python_exe  = sys.executable
    shortcut_path = os.path.join(startup_dir, "NexusCompanion.bat")

    bat_content = f'@echo off\nstart /B pythonw "{script_path}"\n'
    with open(shortcut_path, "w") as f:
        f.write(bat_content)

    print(f"✅  Startup shortcut created:\n    {shortcut_path}")
    print("   Nexus Companion will now launch automatically when Windows starts.")


# ── Real Windows notification reader ──────────────────────────────────

async def read_windows_notifications(url: str):
    listener = UserNotificationListener.current
    access   = await listener.request_access_async()

    if access != UserNotificationListenerAccessStatus.ALLOWED:
        print("❌  Windows denied notification access.")
        print("    Go to: Settings → Privacy → Notifications → Allow apps to access notifications")
        print("    Falling back to simulation mode...\n")
        simulate_mode(url)
        return

    print("✅  Windows notification access granted!")
    print(f"🔗  Forwarding to Nexus at: {url}")
    print("─" * 56)
    print("Listening for live notifications... (Ctrl+C to stop)\n")

    while True:
        try:
            notifications = await listener.get_notifications_async(NotificationKinds.TOAST)
            for notif in notifications:
                nid = notif.id
                if nid in seen_notification_ids:
                    continue
                seen_notification_ids.add(nid)

                app_info = notif.app_info
                app_name = (
                    app_info.display_info.display_name if app_info else "Unknown App"
                )

                try:
                    binding = notif.notification.visual.get_binding("ToastGeneric")
                    texts   = [t.text for t in binding.get_text_elements()]
                    title   = texts[0] if texts else "Notification"
                    body    = texts[1] if len(texts) > 1 else ""
                except Exception:
                    title, body = "Notification", ""

                send_to_nexus(title, body, app_name, url)

        except Exception as e:
            print(f"  ⚠️   Error reading Windows notifications: {e}")

        await asyncio.sleep(3)


# ── Simulation mode ───────────────────────────────────────────────────

FAKE_NOTIFICATIONS = [
    ("WhatsApp",  "Aarav",        "Hey are you free tonight for the project review?"),
    ("Slack",     "#engineering", "🚨 Deploy pipeline failed on main branch!"),
    ("Gmail",     "Your Boss",    "Can we talk about the Q3 numbers before EOD?"),
    ("Outlook",   "HR Team",      "Reminder: Submit performance review by Friday"),
    ("WhatsApp",  "Mom",          "Dinner at 7. Don't forget!"),
    ("Slack",     "Alex DM",      "Did you finish the deck for the pitch tomorrow?"),
    ("Teams",     "Sarah",        "Client wants to reschedule the demo to today."),
    ("Gmail",     "GitHub",       "Build failed: nexus-app workflow run #47 failed"),
    ("Chrome",    "BBC News",     "Breaking: Major tech layoffs announced."),
    ("Outlook",   "Finance",      "ACTION REQUIRED: Approve travel expense by noon"),
    ("WhatsApp",  "Team Group",   "Meeting pushed to 3 PM – everyone confirm?"),
    ("Gmail",     "Priya",        "The Q3 spreadsheet has been updated. Please review."),
]

def simulate_mode(url: str):
    print(f"🧪  SIMULATION MODE — pretending to read Windows notifications")
    print(f"🔗  Forwarding to: {url}")
    print("─" * 56)
    print("Sending a fake notification every 6 seconds... (Ctrl+C to stop)\n")

    while True:
        app, sender, body = random.choice(FAKE_NOTIFICATIONS)
        print(f"📲  New notification: [{app}] {sender}")
        send_to_nexus(sender, body, app, url)
        time.sleep(6)


# ── Entry point ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Nexus Companion — PC Notification Bridge")
    parser.add_argument("--url",             default=DEFAULT_WEBHOOK,
                        help="Nexus webhook URL (default: localhost:3000)")
    parser.add_argument("--simulate",        action="store_true",
                        help="Force simulation mode (no winsdk needed)")
    parser.add_argument("--install-startup", action="store_true",
                        help="Auto-run this script every time Windows starts")
    args = parser.parse_args()

    print("\n" + "=" * 56)
    print("   NEXUS COMPANION -- PC Notification Bridge")
    print("   Runs forever. Close this window to stop.")
    print("=" * 56 + "\n")

    if args.install_startup:
        install_startup()
        return

    if args.simulate or not WINSDK_AVAILABLE:
        if not WINSDK_AVAILABLE and not args.simulate:
            print("⚠️   'winsdk' not installed → using simulation mode.")
            print("    Install real mode: pip install winsdk\n")
        simulate_mode(args.url)
    else:
        asyncio.run(read_windows_notifications(args.url))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋  Nexus Companion stopped. Goodbye.")
