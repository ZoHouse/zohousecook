import Head from 'next/head';
import Link from 'next/link';

export default function ProPlaceholderPage() {
  return (
    <>
      <Head><title>Zo Pro · Coming Soon</title></Head>
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-semibold mb-3">Zo Pro is coming soon</h1>
          <p className="text-neutral-400 mb-8">
            3D Zobu, Daily Quests, Badges, and full access to Zo Passes. We're putting the final
            touches on it. Sit tight — your Passport will light up when it's live.
          </p>
          <Link href="/" className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold">
            Back to Zo World
          </Link>
        </div>
      </main>
    </>
  );
}
