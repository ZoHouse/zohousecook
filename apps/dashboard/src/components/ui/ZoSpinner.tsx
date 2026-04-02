import React from 'react';
import { zoSpinner } from '../../assets';

interface ZoSpinnerProps {
  className?: string;
  size?: number;
}

export function ZoSpinner({ className, size = 32 }: ZoSpinnerProps) {
  return (
    <img
      src={zoSpinner}
      alt="Loading"
      width={size}
      height={size}
      className={className}
    />
  );
}
