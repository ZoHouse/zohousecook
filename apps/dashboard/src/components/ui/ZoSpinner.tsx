import React from 'react';
import { useRouter } from 'next/router';

interface ZoSpinnerProps {
  className?: string;
  size?: number;
}

export function ZoSpinner({ className, size = 32 }: ZoSpinnerProps) {
  const { basePath } = useRouter();
  return (
    <img
      src={`${basePath}/dashboard-assets/zo-spinner.gif`}
      alt="Loading"
      width={size}
      height={size}
      className={className}
    />
  );
}
