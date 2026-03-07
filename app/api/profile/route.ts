import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const ROW_ID = 1; // single-user app — always row 1

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ name: '', bio: '', image_url: '' });

  const { data } = await supabase
    .from('profiles')
    .select('name, bio, image_url')
    .eq('id', ROW_ID)
    .single();

  return NextResponse.json(data ?? { name: '', bio: '', image_url: '' });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured.' }, { status: 400 });

  const body = await req.json();
  const payload = {
    id: ROW_ID,
    name: body.name ?? '',
    bio: body.bio ?? '',
    image_url: body.image_url ?? '',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}