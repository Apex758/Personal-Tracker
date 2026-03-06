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
      <div className="card-header">
        <div>
          <p className="eyebrow">AI Monitor</p>
          <p className="section-title">Patterns, suggestions & predictions</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ background: loading ? 'var(--surface-3)' : '#7c6ef7', borderColor: '#7c6ef7', color: loading ? 'var(--text-2)' : '#fff' }}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? 'Thinking…' : 'Generate Insight'}
        </button>
      </div>
      <p className="muted small" style={{ marginBottom: 12 }}>
        Spot spending patterns, prioritize tasks, identify shortfalls, and get data-backed recommendations.
      </p>
      <div className="ai-output">
        {loading ? (
          <span style={{ color: 'var(--text-3)' }}>Analysing {rows.length} records…</span>
        ) : response || (
          <span style={{ color: 'var(--text-3)' }}>Nothing generated yet. Hit the button to analyse this module with AI.</span>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}