'use client';

import { useState } from 'react';
import type { ModuleSlug, RecordShape } from '@/lib/types';

export function AiInsights({ slug, rows }: { slug: ModuleSlug; rows: RecordShape[] }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  async function handleClick() {
    setLoading(true);
    setResponse('');
    try {
      const result = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: slug, rows }),
      });
      const data = await result.json();
      setResponse(data.text || data.error || 'No response received.');
    } catch {
      setResponse('AI insight failed. Check your OpenAI key and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <p className="eyebrow">AI monitor</p>
          <h3>Suggestions, patterns, and predictions</h3>
        </div>
        <button className="button primary" onClick={handleClick} disabled={loading}>
          {loading ? 'Thinking…' : 'Generate insight'}
        </button>
      </div>
      <p className="muted">
        Use this to spot spending issues, prioritise purchases, estimate shortfalls, or suggest next steps.
      </p>
      <div className="ai-output">
        {response || 'Nothing generated yet. Tap the button to get analysis for this module.'}
      </div>
    </div>
  );
}
