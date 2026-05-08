import { createClient } from '@supabase/supabase-js';
import { mockEmails, mockCalendar } from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function seedIfEmpty() {
  // Check if we already have items
  const { data, error } = await supabase
    .from('items')
    .select('id', { count: 'exact' });
    
  if (error) {
    console.error('Error checking items:', error);
    return;
  }

  // If the table has items, don't seed
  if (data && data.length > 0) {
    console.log('Database already seeded.');
    return;
  }

  // Combine mock data into items
  const items = [
    ...mockEmails.map(e => ({
      user_id: 'demo-user',
      source_type: 'email',
      title: e.title,
      body: e.body,
      sender: e.sender,
      is_critical: e.isCritical,
      snoozed_until: null,
      snooze_condition: null
    })),
    ...mockCalendar.map(c => ({
      user_id: 'demo-user',
      source_type: 'calendar',
      title: c.title,
      body: c.body,
      sender: null,
      is_critical: c.isCritical,
      snoozed_until: null,
      snooze_condition: null
    }))
  ];

  const { error: insertError } = await supabase.from('items').insert(items);
  if (insertError) {
    console.error('Error seeding data:', insertError);
  } else {
    console.log('Database seeded successfully!');
  }
}