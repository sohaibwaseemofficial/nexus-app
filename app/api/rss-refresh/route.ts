import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser();
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// A few reliable RSS feeds (you can change these)
const FEEDS = [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://hnrss.org/frontpage',
    'https://css-tricks.com/feed/',
];

export async function GET() {
    let addedCount = 0;

    for (const url of FEEDS) {
        try {
            const feed = await parser.parseURL(url);
            const items = feed.items.map(item => ({
                user_id: 'demo-user',
                source_type: 'rss',
                title: item.title || 'No title',
                body: item.contentSnippet?.slice(0, 200) || '',
                sender: feed.title || 'RSS',
                is_critical: false,
            }));

            // Insert, ignoring duplicates could be done but simple insert is fine
            const { error } = await supabase.from('items').insert(items);
            if (!error) addedCount += items.length;
            else console.error('Insert error:', error);
        } catch (err) {
            console.error('Failed to fetch RSS:', url, err);
        }
    }

    return NextResponse.json({ success: true, added: addedCount });
}