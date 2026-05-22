/**
 * Mock-badges harness for the 3D suitcase decal placement.
 * Visit localhost:4202/test-badges (no auth required) to iterate on PNG art
 * for the bag's stickers.
 *
 * Two PNG sources, combined at runtime:
 *   1. Uploads — drag-drop / file-pick PNGs into the page. Held as blob:
 *      URLs in component state. Free to add/remove without a rebuild.
 *   2. Folder — anything dropped into ../assets/badges-mock/ is webpack-globbed
 *      and shown as a baseline. Versioned in git; rebuild on file change.
 *
 * The bag itself is always mounted at the top so you can rotate/inspect the
 * empty model too.
 *
 * Why a separate page from /test-bag: /test-bag exercises the real
 * slug → CDN-URL → proxy → texture path. This page skips slug resolution and
 * feeds same-origin / blob: PNGs straight into the bag.
 */
import Head from 'next/head';
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BagModel3D } from '../components/passport-lobby/BagModel3D';

/**
 * Webpack require.context globs every PNG in the mock folder at build time.
 * Each module exports a StaticImageData object with a fingerprinted `src`.
 * Add/remove PNGs in the folder, save, and Next dev hot-reloads.
 */
function loadFolderBadges(): string[] {
  const ctx = (require as any).context(
    '../assets/badges-mock',
    false,
    /\.png$/i,
  );
  return ctx
    .keys()
    .sort()
    .map((key: string) => {
      const mod = ctx(key);
      return (mod?.default?.src ?? mod?.src ?? '') as string;
    })
    .filter((src: string) => !!src);
}

interface UploadedBadge {
  id: string;
  name: string;
  url: string; // blob: URL — revoked on remove
}

export default function TestBadgesPage() {
  const folderUrls = useMemo(() => loadFolderBadges(), []);
  const [uploads, setUploads] = useState<UploadedBadge[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Revoke any outstanding blob: URLs on unmount so they don't leak.
  useEffect(
    () => () => {
      uploads.forEach((u) => URL.revokeObjectURL(u.url));
    },
    // Intentional: cleanup only fires on unmount. Per-item revoke happens in remove handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const allUrls = useMemo(
    () => [...uploads.map((u) => u.url), ...folderUrls],
    [uploads, folderUrls],
  );

  function addFiles(files: FileList | File[]) {
    const next: UploadedBadge[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url: URL.createObjectURL(file),
      });
    });
    if (next.length === 0) return;
    setUploads((prev) => [...prev, ...next]);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    // Reset so re-selecting the same file fires onChange again.
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }

  function removeUpload(id: string) {
    setUploads((prev) => {
      const target = prev.find((u) => u.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((u) => u.id !== id);
    });
  }

  function clearUploads() {
    uploads.forEach((u) => URL.revokeObjectURL(u.url));
    setUploads([]);
  }

  return (
    <>
      <Head>
        <title>Mock badges · Bag decal test · Zo World</title>
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
          Mock badges on the 3D bag
        </h1>
        <p
          style={{
            fontSize: 12,
            color: '#6B5B8E',
            marginBottom: 16,
            textAlign: 'center',
            maxWidth: 520,
          }}
        >
          Drag PNGs onto the dropzone, or commit them to
          {' '}
          <code style={{ background: '#EEE7DD', padding: '1px 5px', borderRadius: 4 }}>
            apps/website/src/assets/badges-mock/
          </code>
          . Up to 16 mount as decals (8 front + 8 back). Uploads first, folder after.
        </p>

        {/* 3D bag — always mounted, even with zero badges. */}
        <div style={{ width: 320, height: 480 }}>
          <BagModel3D urls={allUrls} />
        </div>

        <p style={{ fontSize: 12, color: '#6B5B8E', marginTop: 8, marginBottom: 12 }}>
          Loaded: <strong>{allUrls.length}</strong> badge{allUrls.length === 1 ? '' : 's'}
          {' '}
          ({uploads.length} uploaded · {folderUrls.length} from folder)
        </p>

        {/* Upload dropzone. */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          style={{
            width: '100%',
            maxWidth: 520,
            padding: 20,
            border: `2px dashed ${dragging ? '#E55A1C' : '#C9BFB3'}`,
            borderRadius: 12,
            background: dragging ? '#FFF1E8' : '#FFF',
            textAlign: 'center',
            fontSize: 13,
            color: '#6B5B8E',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <strong style={{ color: '#2A1B3D' }}>Drop PNGs here</strong> or click to select.
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>

        {/* Uploaded thumbnails + remove. */}
        {uploads.length > 0 && (
          <div style={{ marginTop: 16, width: '100%', maxWidth: 520 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Uploaded ({uploads.length})
              </span>
              <button
                type="button"
                onClick={clearUploads}
                style={{
                  fontSize: 11,
                  color: '#E55A1C',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Clear all
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
                gap: 8,
              }}
            >
              {uploads.map((u) => (
                <div
                  key={u.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    background: '#FFF',
                    border: '1px solid #EEE7DD',
                    borderRadius: 8,
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={u.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.url}
                    alt={u.name}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeUpload(u.id)}
                    aria-label={`remove ${u.name}`}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: 'none',
                      background: '#2A1B3D',
                      color: '#FFF',
                      fontSize: 11,
                      lineHeight: '18px',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folder thumbnails for reference. */}
        {folderUrls.length > 0 && (
          <div style={{ marginTop: 16, width: '100%', maxWidth: 520 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              From folder ({folderUrls.length})
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                gap: 8,
              }}
            >
              {folderUrls.map((src, i) => (
                <div
                  key={`${i}-${src}`}
                  style={{
                    aspectRatio: '1 / 1',
                    background: '#FFF',
                    border: '1px solid #EEE7DD',
                    borderRadius: 8,
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`folder-${i}`}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
