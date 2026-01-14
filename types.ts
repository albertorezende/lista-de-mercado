
export type UnitOfMeasure = 'lt' | 'kg' | 'uni' | 'pct';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitOfMeasure;
  price: number;
  sector: string;
  checked: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  items: ShoppingItem[];
  totalChecked: number;
}

export const SECTORS = [
  'Hortifruti',
  'Proteínas',
  'Frios e Laticínios',
  'Padaria',
  'Limpeza',
  'Higiene Pessoal',
  'Mercearia',
  'Bebidas',
  'Congelados',
  'Outros'
];

export const UNITS: { label: string; value: UnitOfMeasure }[] = [
  { label: 'Unidade', value: 'uni' },
  { label: 'Quilo', value: 'kg' },
  { label: 'Litro', value: 'lt' },
  { label: 'Pacote', value: 'pct' }
];
