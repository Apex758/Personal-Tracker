import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const ROW_ID = 1;

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ available: {}, bank: {} });
  }

  const { data, error } = await supabase
    .from('pantry')
    .select('available, bank')
    .eq('id', ROW_ID)
    .single();

  if (error) {
    return NextResponse.json({ available: {}, bank: {} });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured.' },
      { status: 400 },
    );
  }

  let body: { available?: Record<string, string[]>; bank?: Record<string, string[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('pantry')
    .upsert(
      { id: ROW_ID, available: body.available ?? {}, bank: body.bank ?? {}, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}