const URL = process.argv[2] || 'http://localhost:3000/api/webhook/user-123';

const fakeNotifications = [
  { title: "Mom", body: "Are you coming over for dinner?", app: "iMessage", source_type: "phone" },
  { title: "Uber Eats", body: "Your driver is arriving soon.", app: "Uber", source_type: "phone" },
  { title: "Slack", body: "@here The production server is down! We need all hands.", app: "Slack", source_type: "slack" },
  { title: "John Doe", body: "Hey, did you see the game last night?", app: "WhatsApp", source_type: "phone" },
  { title: "Google Calendar", body: "Meeting starts in 10 minutes: Project Sync", app: "Calendar", source_type: "calendar" },
  { title: "Twitter", body: "Elon Musk just tweeted.", app: "Twitter", source_type: "social" },
  { title: "LinkedIn", body: "You appeared in 12 searches this week.", app: "LinkedIn", source_type: "social" },
  { title: "Amazon", body: "Your package has been delivered.", app: "Amazon", source_type: "shopping" },
  { title: "Security Alert", body: "New login from unrecognized device.", app: "System", source_type: "alert" },
  { title: "Spotify", body: "Your Release Radar has been updated.", app: "Spotify", source_type: "entertainment" }
];

console.log(`\n🚀 Bombarding Nexus Webhook at: ${URL}\n`);

async function bombard() {
  let successCount = 0;
  
  for (let i = 0; i < fakeNotifications.length; i++) {
    const notif = fakeNotifications[i];
    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif)
      });
      
      if (response.ok) {
        console.log(`✅ Sent: [${notif.app}] ${notif.title}`);
        successCount++;
      } else {
        console.log(`❌ Failed: [${notif.app}] ${notif.title} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: Could not reach ${URL}`);
    }
    
    // Tiny delay so we don't crash the local server
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n🎉 Done! Successfully sent ${successCount} notifications.`);
  console.log(`Go to your Nexus app and click 'Generate Briefing' to see them!`);
}

bombard();
