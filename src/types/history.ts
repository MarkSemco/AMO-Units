export type HistoryCategory = 'optical' | 'zeeman' | 'laser-beam' | 'rf' | 'error-prop';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  category: HistoryCategory;
  title: string;
  sourceField: string;
  sourceValue: string;
  sourceUnit: string;
  details: Record<string, string>;
}
