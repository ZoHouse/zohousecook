import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Same-origin proxy for stamp images. The badges-page 3D bag uploads stamp
 * art to a WebGL texture, which requires CORS-clean pixel data. The old
 * Zostel CDN (cdn.zostel.com) doesn't set CORS, so direct fetch/canvas-tainting
 * blocks the upload. Routing through this Next API endpoint makes the request
 * same-origin from the browser's perspective, and the upstream fetch happens
 * server-side where CORS doesn't apply.
 *
 * Hostname allowlist keeps this from being a generic open proxy.
 */
const ALLOWED_HOSTS = ['cdn.zostel.com', 'cdn.zo.xyz', 'static.cdn.zo.xyz'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = req.query.url;
  const url = typeof raw === 'string' ? raw : '';
  if (!url) {
    res.status(400).end();
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).end();
    return;
  }
  if (!ALLOWED_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    res.status(403).end();
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'image/svg+xml,image/png,image/jpeg,image/*' },
    });
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/octet-stream',
    );
    res.status(200).send(buf);
  } catch {
    res.status(502).end();
  }
}
