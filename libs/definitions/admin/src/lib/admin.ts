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

export interface Media {
  media_relation_id: string;
  status: string;
  id: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  metadata: {
    alt?: string;
    title?: string;
    description?: string;
    priority?: number;
  };
}
