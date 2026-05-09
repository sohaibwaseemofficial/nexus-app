import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    // The webhook expects basic notification data
    const title = body.title || body.subject || 'New Notification';
    const content = body.body || body.text || body.content || '';
    const sender = body.sender || body.app || 'System';
    const source_type = body.source_type || 'phone_notification';

    // Insert the live notification directly into the database
    const { data, error } = await supabase.from('items').insert({
      user_id: userId === 'user-123' ? 'demo-user' : userId, // Route to our demo user for the hackathon
      source_type: source_type,
      title: title,
      body: content,
      sender: sender,
      is_critical: false, // Let Gemini decide if it's critical later
      snoozed_until: null,
      snooze_condition: null,
    });

    if (error) {
      console.error('Webhook insert error:', error);
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Notification captured successfully.' });
  } catch (err) {
    console.error('Webhook payload error:', err);
    return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
  }
}
