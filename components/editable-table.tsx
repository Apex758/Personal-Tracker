'use client';

import { useState } from 'react';

type Column = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: string[];
};

type EditableTableProps = {
  table: string;
  rows: Record<string, any>[];
  columns: Column[];
  onUpdated?: (row: Record<string, any>) => void;
};

export function EditableTable({
  table,
  rows,
  columns,
  onUpdated,
}: EditableTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (row: Record<string, any>) => {
    setEditingId(row.id);
    setDraft(row);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    setSaving(true);

    try {
      const payload = { ...draft };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      const res = await fetch(`/api/records/${table}/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || 'Failed to save changes');
        return;
      }

      onUpdated?.(json.data);
      setEditingId(null);
      setDraft({});
    } catch (error) {
      alert('Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (col: Column) => {
    const value = draft[col.key] ?? '';

    if (col.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, [col.key]: e.target.value }))
          }
        />
      );
    }

    if (col.type === 'select' && col.options) {
      return (
        <select
          value={value}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, [col.key]: e.target.value }))
          }
        >
          <option value="">Select</option>
          {col.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={col.type || 'text'}
        value={value}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, [col.key]: e.target.value }))
        }
      />
    );
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const isEditing = editingId === row.id;

            return (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {isEditing ? renderInput(col) : String(row[col.key] ?? '')}
                  </td>
                ))}

                <td>
                  {isEditing ? (
                    <div className="actions">
                      <button
                        className="button primary"
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="button secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="button secondary"
                      onClick={() => startEdit(row)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}