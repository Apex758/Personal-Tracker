import { config } from 'dotenv';
config({ path: '.env.local' });  
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { modules } from '@/lib/modules';

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizeValue(value: unknown): string | number | null {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}

function findHeaderRow(rows: unknown[][]) {
  let bestIndex = 0;
  let bestScore = -1;
  rows.slice(0, 12).forEach((row, index) => {
    const score = row.filter((cell) => typeof cell === 'string' && String(cell).trim()).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars.');

  const workbookPath = path.resolve(process.cwd(), 'public/Trackers_completed.xlsx');
  if (!fs.existsSync(workbookPath)) throw new Error('Workbook file missing.');

  const workbook = XLSX.readFile(workbookPath, { cellDates: true });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const module of modules) {
    const sheet = workbook.Sheets[module.workbookSheet];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const headerIndex = findHeaderRow(rows);
    const headers = (rows[headerIndex] || []).map((value) => normalizeKey(String(value ?? '')));
    const payload = rows.slice(headerIndex + 1)
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, normalizeValue(row[index])])))
      .filter((row) => Object.values(row).some((value) => value !== null))
      .map((row) => {
        const cleaned: Record<string, string | number | null> = {};
        for (const column of module.columns) cleaned[column.key] = (row[column.key] ?? null) as string | number | null;
        return cleaned;
      });

    if (!payload.length) continue;

    await supabase.from(module.table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from(module.table).insert(payload);
    if (error) throw error;
    console.log(`Imported ${payload.length} rows into ${module.table}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
