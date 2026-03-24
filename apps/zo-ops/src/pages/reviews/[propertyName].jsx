import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

// Dynamically import the ReviewsDashboard component to avoid SSR issues
const ReviewsDashboard = dynamic(
  () => import('../../components/ReviewsDashboard'),
  { ssr: false }
);

export default function PropertyReviewsPage() {
  const router = useRouter();
  const isRouterReady = router.isReady;

  // const isSharedView = router.query.view === 'shared';
  const isSharedView = isRouterReady && router.query.view === 'shared';

  useEffect(() => {
   // Skip if router not ready or skip authentication check for shared view
   if (!isRouterReady || isSharedView) return;

    // Check authentication for normal admin view
    const authData = localStorage.getItem('auth_data');
    if (!authData) {
      router.push('/Login');
      return;
    }

    try {
      const parsedAuth = JSON.parse(authData);
      if (!parsedAuth.isAdmin) {
        router.push('/Login');
        return;
      }
    } catch (error) {
      router.push('/Login');
      return;
    }
  }, [isRouterReady, isSharedView, router]); // Add proper dependencies

  // Show loading state while router is initializing
  if (!isRouterReady) {
    return <div>Loading...</div>;
  }

  // For shared view, render without Layout (no sidebar) for iframe embedding
  if (isSharedView) {
    return <ReviewsDashboard />;
  }

  // For normal admin view, render with Layout
  return (
    <Layout>
      <ReviewsDashboard />
    </Layout>
  );
}
