export type Breadcrumb = { text: string; to: string };

export interface Currency {
  id: string;
  code: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  decimals: number;
  symbol: string;
}
