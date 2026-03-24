import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to reviews page as the default
    router.replace('/reviews');
  }, [router]);

  return null;
}
