/**
 * Standalone harness for the 3D suitcase decal placement.
 * Visit localhost:4202/test-bag (no auth required) to inspect sticker
 * orientation after editing BagModel3D. Hardcoded stamp slugs hit the
 * production CDN — no backend dependency.
 *
 * Remove or gate before shipping if it ever feels like prod-surface clutter.
 */
import Head from 'next/head';
import { BagModel3D } from '../components/passport-lobby/BagModel3D';

// Intentionally > 8 so we exercise overflow onto the back face.
const SAMPLE_STAMPS = [
  'bundi',
  'jaipur',
  'pushkar',
  'manali',
  'rishikesh',
  'jaisalmer',
  'gokarna',
  'mussoorie',
  'wayanad',
  'kasol',
  'pokhara',
  'bir',
];

export default function TestBagPage() {
  return (
    <>
      <Head>
        <title>Bag decal test · Zo World</title>
      </Head>
      <main
        style={{
          minHeight: '100vh',
          background: '#FBF8F4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 24,
          color: '#2A1B3D',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Bag decal test harness
        </h1>
        <p style={{ fontSize: 12, color: '#6B5B8E', marginBottom: 16 }}>
          Hardcoded stamps · no auth. Inspect sticker orientation after edits.
        </p>
        <div style={{ width: 320, height: 480 }}>
          <BagModel3D stamps={SAMPLE_STAMPS} />
        </div>
      </main>
    </>
  );
}
