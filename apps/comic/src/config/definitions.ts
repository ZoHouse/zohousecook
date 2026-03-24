import { GeneralObject } from "@zo/definitions/general";

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