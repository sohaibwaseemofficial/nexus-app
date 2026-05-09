import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    const { itemId } = await request.json();
    if (!itemId) {
        return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
    }

    // Snooze for 3 hours from now
    const snoozeUntil = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
        .from('items')
        .update({ snoozed_until: snoozeUntil })
        .eq('id', itemId)
        .eq('user_id', 'demo-user');

    if (error) {
        console.error('Snooze error:', error);
        return NextResponse.json({ error: 'Failed to snooze' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}