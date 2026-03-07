export type ModuleSlug =
  | 'finance'
  | 'grocery'
  | 'lifestyle'
  | 'skills'
  | 'work'
  | 'travel'
  | 'wishlist';

export type ModuleConfig = {
  slug: ModuleSlug;
  label: string;
  description: string;
  table: string;
  workbookSheet: string;
  primaryField: string;
  accent: string;
  columns: Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'select' | 'textarea'; options?: string[] }>;
};

export type RecordShape = Record<string, string | number | null> & { id?: string };
export type ChartPoint = { label: string; value: number };