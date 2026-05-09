import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function computeCalmScore(criticalCount: number, totalItems: number, intentionLength: number): number {
  const clarity = Math.min(1, intentionLength / 30);
  const baseLoad = criticalCount * 10 + totalItems * 2;
  const score = Math.max(5, 100 - baseLoad * (1 - clarity * 0.5));
  return Math.round(score);
}

export async function POST(request: Request) {
  const { intention } = await request.json();
  if (!intention) {
    return NextResponse.json({ error: 'Intention required' }, { status: 400 });
  }

  // Fetch active (not snoozed or snooze expired) items
  const now = new Date().toISOString();
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', 'demo-user')
    .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
    .order('created_at', { ascending: false })
    .limit(60);

  if (!items || items.length === 0) {
    return NextResponse.json({
      narrative: 'Your information stream is clear. Nothing to act on.',
      futureSelf: 'A clear inbox today means a focused tomorrow.',
      calmScore: 100,
      scores: [],
      items: [],
    });
  }

  const itemSummary = items
    .map(
      (item: any, idx: number) =>
        `[${idx}] ${item.source_type.toUpperCase()}: ${item.title} | ${item.body?.slice(0, 120) || ''}${item.sender ? ' | from ' + item.sender : ''}`
    )
    .join('\n');

  const prompt = `You are Nexus, an AI that reduces information overload. The user's intention for today is: "${intention}".

Analyze these ${items.length} information items and return ONLY valid JSON with these exact keys:
- "narrative": A calm, personal 3-5 sentence briefing spoken like a helpful assistant. Lead with critical items relevant to the intention, then dismiss low-priority items in one short sentence.
- "scores": An array of ${items.length} integers (0-100), one per item, indicating relevance to the intention. High score = must act now. Low score = safely ignored.
- "futureSelf": One sentence (max 25 words) about how handling the critical items TODAY will benefit the user TOMORROW. Make it motivational and specific.

Items:
${itemSummary}

Return ONLY the JSON object. No markdown, no code blocks, no explanation.`;

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip any markdown code fences
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}') + 1;
    const jsonString = rawText.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);

    const { narrative, scores, futureSelf } = parsed;
    const safeScores: number[] = Array.isArray(scores)
      ? scores.map((s: any) => Math.max(0, Math.min(100, Number(s) || 0)))
      : items.map(() => 30);

    const criticalCount = safeScores.filter((s) => s >= 75).length;
    const calmScore = computeCalmScore(criticalCount, items.length, intention.length);

    // Persist briefing
    await supabase.from('briefings').insert({
      user_id: 'demo-user',
      intention,
      narrative,
      calm_score: calmScore,
    });

    return NextResponse.json({
      narrative: narrative || '',
      futureSelf: futureSelf || '',
      calmScore,
      scores: safeScores,
      items,
    });
  } catch (err) {
    console.error('Gemini error:', err);
    // Graceful fallback
    const criticalItems = items.filter((i: any) => i.is_critical);
    const narrative = `Good morning. Your focus is "${intention}". You have ${criticalItems.length} critical item${criticalItems.length !== 1 ? 's' : ''}: ${
      criticalItems
        .slice(0, 3)
        .map((i: any) => i.title)
        .join('; ')
    }. All other ${items.length - criticalItems.length} items are safely set aside.`;
    const futureSelf = `Handling these ${criticalItems.length} items today means tomorrow starts with clarity and momentum.`;
    const calmScore = computeCalmScore(criticalItems.length, items.length, intention.length);

    return NextResponse.json({
      narrative,
      futureSelf,
      calmScore,
      scores: items.map((i: any) => (i.is_critical ? 88 : 18)),
      items,
    });
  }
}