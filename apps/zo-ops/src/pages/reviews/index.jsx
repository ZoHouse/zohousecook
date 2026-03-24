import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

// Dynamically import the ReviewsDashboard component to avoid SSR issues
const ReviewsDashboard = dynamic(
  () => import('../../components/ReviewsDashboard'),
  { ssr: false }
);

export default function ReviewsPage() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication
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
  }, [router]);

  return (
    <Layout>
      <ReviewsDashboard />
    </Layout>
  );
}
