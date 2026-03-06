import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getModule } from '@/lib/modules';
import { getRows } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const config = getModule(module);
  if (!config) return NextResponse.json({ error: 'Unknown module.' }, { status: 404 });
  const rows = await getRows(config.slug);
  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const config = getModule(module);
  if (!config) return NextResponse.json({ error: 'Unknown module.' }, { status: 404 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured yet. Demo mode is read-only. Add Supabase env keys to enable saving on Vercel.' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const shape = z.record(z.union([z.string(), z.number(), z.null()]));
  const parsed = shape.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });

  const cleaned = Object.fromEntries(
    config.columns.map((column) => [column.key, parsed.data[column.key] ?? null]),
  );

  const { error } = await supabase.from(config.table).insert(cleaned);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const config = getModule(module);
  if (!config) return NextResponse.json({ error: 'Unknown module.' }, { status: 404 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured yet. Demo mode is read-only.' },
      { status: 400 },
    );
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const { error } = await supabase.from(config.table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
