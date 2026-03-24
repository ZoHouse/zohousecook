import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

// Dynamically import the AppNotifications component to avoid SSR issues
const AppNotifications = dynamic(
  () => import('../components/AppNotifications'),
  { ssr: false }
);

export default function AppNotificationsPage() {
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
      <AppNotifications />
    </Layout>
  );
}
