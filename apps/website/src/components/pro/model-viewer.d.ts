import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          'auto-rotate'?: boolean | '';
          'rotation-per-second'?: string;
          'camera-controls'?: boolean | '';
          'disable-zoom'?: boolean | '';
          'camera-orbit'?: string;
          'shadow-intensity'?: string;
          exposure?: string;
          autoplay?: boolean | '';
          'animation-name'?: string;
          loading?: 'auto' | 'lazy' | 'eager';
          reveal?: 'auto' | 'manual';
        },
        HTMLElement
      >;
    }
  }
}

export {};
