export type GalleryMedia = {
  id: string;
  category: string;
  url: string;
  metadata: GeneralObject;
  sort_index: number;
  image: string;
};

export type Metadata = {
  id: string;
  created_at: string;
  updated_at: string;
  url: string;
  data: GeneralObject;
  title: string;
  description: string;
  image: string;
};
