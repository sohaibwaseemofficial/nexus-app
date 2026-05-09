import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mockEmails, mockCalendar } from '../../../lib/mockData';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Check if already seeded
  const { data, error } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('user_id', 'demo-user')
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data && data.length > 0) {
    return NextResponse.json({ seeded: false, message: 'Already seeded' });
  }

  const items = [
    ...mockEmails.map((e) => ({
      user_id: 'demo-user',
      source_type: 'email',
      title: e.title,
      body: e.body,
      sender: e.sender,
      is_critical: e.isCritical,
      snoozed_until: null,
      snooze_condition: null,
    })),
    ...mockCalendar.map((c) => ({
      user_id: 'demo-user',
      source_type: 'calendar',
      title: c.title,
      body: c.body,
      sender: null,
      is_critical: c.isCritical,
      snoozed_until: null,
      snooze_condition: null,
    })),
  ];

  const { error: insertError } = await supabase.from('items').insert(items);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ seeded: true, count: items.length });
}
