/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "*.svg" {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare module "*.png" {
  const content: { src: string; height: number; width: number };
  export default content;
}

declare module "*.jpg" {
  const content: { src: string; height: number; width: number };
  export default content;
}

declare module "*.webp" {
  const content: { src: string; height: number; width: number };
  export default content;
}

declare module "*.gif" {
  const content: { src: string; height: number; width: number };
  export default content;
}

declare module "*.mp4" {
  const src: string;
  export default src;
}

declare module "*.webm" {
  const src: string;
  export default src;
}

declare module "@mapbox/mapbox-sdk/services/directions";
