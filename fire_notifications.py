"""
Nexus Notification Bomber
Fires REAL Windows toast notifications to your screen AND forwards them to Nexus.

This is the correct testing flow:
  1. Script fires a real toast notification (pops up on your screen like WhatsApp/Slack)
  2. Simultaneously POSTs it to Nexus webhook
  3. Nexus Gemini AI reads and filters it

No pip installs needed — uses PowerShell for toast, urllib for webhook.

Usage:
  python fire_notifications.py                           # fires all, localhost
  python fire_notifications.py --url https://YOUR.vercel.app/api/webhook/user-123
  python fire_notifications.py --count 5                 # fire only 5
  python fire_notifications.py --delay 3                 # 3 seconds between each
"""

import subprocess
import urllib.request
import urllib.error
import json
import time
import argparse
import random
import sys
from datetime import datetime

DEFAULT_WEBHOOK = "http://localhost:3000/api/webhook/user-123"

# Force UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Fake notifications ────────────────────────────────────────────────
NOTIFICATIONS = [
    {
        "app":    "WhatsApp",
        "title":  "Mom",
        "body":   "Are you coming over for dinner tonight?",
        "source": "phone",
    },
    {
        "app":    "Slack",
        "title":  "#engineering channel",
        "body":   "URGENT: Production server is down! Payment gateway not responding.",
        "source": "slack",
    },
    {
        "app":    "Gmail",
        "title":  "Your Boss",
        "body":   "Can we talk about the Q3 numbers before end of day?",
        "source": "email",
    },
    {
        "app":    "Google Calendar",
        "title":  "Meeting in 10 minutes",
        "body":   "Budget Review with CEO — prepare slides.",
        "source": "calendar",
    },
    {
        "app":    "WhatsApp",
        "title":  "Team Group",
        "body":   "Meeting pushed to 3 PM — everyone confirm?",
        "source": "phone",
    },
    {
        "app":    "Outlook",
        "title":  "HR Team",
        "body":   "ACTION REQUIRED: Submit performance review by Friday.",
        "source": "email",
    },
    {
        "app":    "Slack",
        "title":  "Alex (Direct Message)",
        "body":   "Did you finish the pitch deck for tomorrow?",
        "source": "slack",
    },
    {
        "app":    "Twitter",
        "title":  "Trending now",
        "body":   "Tech layoffs: 500 companies announced cuts this week.",
        "source": "social",
    },
    {
        "app":    "Gmail",
        "title":  "Priya (Finance)",
        "body":   "The Q3 spreadsheet is updated. Please review the missing line items.",
        "source": "email",
    },
    {
        "app":    "System",
        "title":  "Security Alert",
        "body":   "New login from unrecognized device. Verify your account.",
        "source": "alert",
    },
]


def fire_toast(app: str, title: str, body: str):
    """
    Fire a real Windows toast notification using PowerShell.
    This makes it actually POP UP on the screen like a real notification.
    No pip install needed.
    """
    # Escape single quotes for PowerShell
    title_safe = title.replace("'", "''")
    body_safe  = body.replace("'", "''")
    app_safe   = app.replace("'", "''")

    ps_script = f"""
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$xml = @'
<toast duration="short">
  <visual>
    <binding template="ToastGeneric">
      <text>{app_safe}</text>
      <text>{title_safe}</text>
      <text>{body_safe}</text>
    </binding>
  </visual>
</toast>
'@

$doc = New-Object Windows.Data.Xml.Dom.XmlDocument
$doc.LoadXml($xml)
$toast = [Windows.UI.Notifications.ToastNotification]::new($doc)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Nexus.Demo').Show($toast)
"""
    try:
        subprocess.run(
            ["powershell", "-WindowStyle", "Hidden", "-Command", ps_script],
            capture_output=True,
            timeout=5,
        )
        return True
    except Exception as e:
        print(f"  [toast error] {e}")
        return False


def forward_to_nexus(app: str, title: str, body: str, source: str, url: str):
    """POST the notification to the Nexus webhook."""
    payload = json.dumps({
        "title":       title,
        "body":        body,
        "sender":      app,
        "app":         app,
        "source_type": source,
        "timestamp":   datetime.now().isoformat(),
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            return resp.status == 200
    except urllib.error.URLError as e:
        print(f"  Cannot reach Nexus: {e.reason}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Nexus Notification Bomber")
    parser.add_argument("--url",   default=DEFAULT_WEBHOOK, help="Nexus webhook URL")
    parser.add_argument("--count", type=int, default=len(NOTIFICATIONS),
                        help=f"How many to fire (max {len(NOTIFICATIONS)})")
    parser.add_argument("--delay", type=float, default=2.0,
                        help="Seconds between each notification (default: 2)")
    parser.add_argument("--random", action="store_true",
                        help="Randomize the order")
    args = parser.parse_args()

    pool = NOTIFICATIONS.copy()
    if args.random:
        random.shuffle(pool)
    pool = pool[:args.count]

    print("\n" + "=" * 58)
    print("  NEXUS NOTIFICATION BOMBER")
    print("  Watch your screen — real toast popups will appear!")
    print("=" * 58)
    print(f"  Firing {len(pool)} notifications with {args.delay}s delay")
    print(f"  Target: {args.url}")
    print("=" * 58 + "\n")

    success = 0
    for i, notif in enumerate(pool, 1):
        app    = notif["app"]
        title  = notif["title"]
        body   = notif["body"]
        source = notif["source"]

        print(f"[{i}/{len(pool)}] Firing: [{app}] {title}")

        # 1. Pop up on screen
        toast_ok = fire_toast(app, title, body)

        # 2. Forward to Nexus
        nexus_ok = forward_to_nexus(app, title, body, source, args.url)

        status = []
        if toast_ok: status.append("toast shown on screen")
        if nexus_ok: status.append("sent to Nexus")
        print(f"       -> {' + '.join(status) if status else 'both failed'}")

        if nexus_ok:
            success += 1

        if i < len(pool):
            time.sleep(args.delay)

    print(f"\n{'='*58}")
    print(f"  Done! {success}/{len(pool)} notifications sent to Nexus.")
    print(f"  Now open your Nexus app and click 'Generate Briefing'!")
    print(f"{'='*58}\n")


if __name__ == "__main__":
    main()
