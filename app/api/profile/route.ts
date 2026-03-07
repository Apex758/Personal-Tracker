import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Raise body limit so base64 photos (up to ~3 MB source) don't get rejected
export const maxDuration = 10;

// Next.js App Router: increase body size via custom request reading
// (App Router does NOT use the Pages `config.api.bodyParser` pattern)

const ROW_ID = 1;

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { name: '', bio: '', image_url: '' },
      { status: 200 },
    );
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('name, bio, image_url')
    .eq('id', ROW_ID)
    .single();

  if (error) {
    // If the row just doesn't exist yet, return empty rather than 500
    return NextResponse.json({ name: '', bio: '', image_url: '' });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment.' },
      { status: 400 },
    );
  }

  let body: { name?: string; bio?: string; image_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const payload = {
    id:         ROW_ID,
    name:       (body.name       ?? '').trim(),
    bio:        (body.bio        ?? '').trim(),
    image_url:  (body.image_url  ?? ''),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('[profile PATCH]', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}