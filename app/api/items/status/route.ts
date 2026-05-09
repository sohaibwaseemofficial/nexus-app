import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Returns raw item count and latest items so the UI can show live updates
export async function GET() {
  const now = new Date().toISOString();

  const { data: items, error } = await supabase
    .from('items')
    .select('id, title, source_type, sender, is_critical, created_at')
    .eq('user_id', 'demo-user')
    .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
    .order('created_at', { ascending: false })
    .limit(5); // just the 5 newest for the live ticker

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: items?.length ?? 0,
    latest: items ?? [],
  });
}
