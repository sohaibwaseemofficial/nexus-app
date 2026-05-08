import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'; // <-- new import
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // free tier

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function computeCalmScore(criticalCount: number, totalItems: number, intentionLength: number): number {
  const clarity = Math.min(1, intentionLength / 30);
  const baseLoad = criticalCount * 10 + totalItems * 2;
  const score = Math.max(0, 100 - baseLoad * (1 - clarity * 0.5));
  return Math.round(score);
}

export async function POST(request: Request) {
  const { intention } = await request.json();
  if (!intention) {
    return NextResponse.json({ error: 'Intention required' }, { status: 400 });
  }

  // Fetch items (demo-user, not snoozed)
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', 'demo-user')
    .is('snoozed_until', null)
    .order('created_at', { ascending: false });

  if (!items || items.length === 0) {
    return NextResponse.json({ narrative: 'No items to process.', calmScore: 100 });
  }

  // Prepare item list for the AI
  const itemSummary = items.map((item: any, idx: number) =>
    `[${idx}] ${item.source_type.toUpperCase()}: ${item.title} | ${item.body?.slice(0,150) || ''}${item.sender ? ' | from ' + item.sender : ''}`
  ).join('\n');

  // Prompt (same structure, just removing "Claude" references)
  const prompt = `User Intention: "${intention}"
You are an AI that reduces information overload. Analyze these items and produce:
- A calm, personal briefing (like a helpful assistant speaking directly to the user). Group critical items first, then mention low-priority items only in one short dismissive sentence.
- A relevance score for each item (0–100) based on how well it serves the user's intention.
- A "future-self" nudge: one sentence about how handling these items will benefit the user tomorrow.

Return ONLY valid JSON with keys "narrative", "scores" (array of numbers in same order as items), and "futureSelf". No other text.

Items:
${itemSummary}`;

  try {
    // Call Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();

    // Gemini might wrap the JSON in a code block, so clean it up
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}') + 1;
    const jsonString = rawText.slice(jsonStart, jsonEnd);

    const parsed = JSON.parse(jsonString);
    const { narrative, scores, futureSelf } = parsed;

    const criticalThreshold = 80;
    const criticalCount = (scores as number[]).filter((s: number) => s >= criticalThreshold).length;
    const calmScore = computeCalmScore(criticalCount, items.length, intention.length);

    // Store briefing
    await supabase.from('briefings').insert({
      user_id: 'demo-user',
      intention,
      narrative: narrative + '\n\n' + futureSelf,
      calm_score: calmScore,
    });

    return NextResponse.json({
      narrative: narrative + '\n\n' + futureSelf,
      calmScore,
      scores,
      items,
    });
  } catch (err) {
    console.error('Gemini error:', err);
    // Fallback if AI fails
    const criticalItems = items.filter((i: any) => i.is_critical);
    const narrative = `Good morning. For "${intention}", you have ${criticalItems.length} important items: ${
      criticalItems.map((i: any) => i.title).join('; ')
    }. Everything else can wait.`;
    const calmScore = computeCalmScore(criticalItems.length, items.length, intention.length);
    return NextResponse.json({
      narrative,
      calmScore,
      scores: items.map((i: any) => (i.is_critical ? 90 : 20)),
      items,
    });
  }
}