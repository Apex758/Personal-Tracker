import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ module: string; id: string }> }
) {
  const { module: table, id } = await params;
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured.' }, { status: 400 });

  const body = await req.json();
  const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath('/');
  revalidatePath(`/module/${table}`);
  return NextResponse.json({ data });
}