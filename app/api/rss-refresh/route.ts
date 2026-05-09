import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Technology' },
  { url: 'https://hnrss.org/frontpage', name: 'Hacker News' },
  { url: 'https://css-tricks.com/feed/', name: 'CSS-Tricks' },
];

export async function GET() {
  let addedCount = 0;

  // Fetch existing RSS titles to avoid duplicates
  const { data: existing } = await supabase
    .from('items')
    .select('title')
    .eq('user_id', 'demo-user')
    .eq('source_type', 'rss');

  const existingTitles = new Set((existing || []).map((e: any) => e.title));

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const newItems = parsed.items
        .filter((item) => item.title && !existingTitles.has(item.title))
        .slice(0, 10) // Max 10 per feed
        .map((item) => ({
          user_id: 'demo-user',
          source_type: 'rss',
          title: item.title || 'No title',
          body: item.contentSnippet?.slice(0, 300) || item.summary?.slice(0, 300) || '',
          sender: feed.name,
          is_critical: false,
          snoozed_until: null,
          snooze_condition: null,
        }));

      if (newItems.length > 0) {
        const { error } = await supabase.from('items').insert(newItems);
        if (!error) {
          addedCount += newItems.length;
          newItems.forEach((i) => existingTitles.add(i.title));
        } else {
          console.error('RSS insert error:', error);
        }
      }
    } catch (err) {
      console.error('Failed to fetch RSS feed:', feed.url, err);
    }
  }

  return NextResponse.json({ success: true, added: addedCount });
}