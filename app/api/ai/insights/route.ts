import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getModule } from '@/lib/modules';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is missing.' }, { status: 400 });
  }

  const { module: slug, rows } = await request.json();
  const module = getModule(slug);
  if (!module) return NextResponse.json({ error: 'Unknown module.' }, { status: 404 });

  const openai = new OpenAI({ apiKey });
  const sample = Array.isArray(rows) ? rows.slice(0, 40) : [];

  const prompt = `
You are helping the owner of a private personal dashboard.
Module: ${module.label}
Goal: ${module.description}

Look at the data sample below and return:
1. 3 practical observations
2. 3 action recommendations
3. 1 simple short-range prediction or risk warning
4. 1 idea for what to track next

Keep it specific, blunt, and useful. Use short bullets.
Data:
${JSON.stringify(sample, null, 2)}
`;

  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt,
  });

  const text = response.output_text || 'No insight generated.';
  return NextResponse.json({ text });
}
