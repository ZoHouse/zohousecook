import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: false } };

const ZO_WORLD_APP_ID = 'Ne0HsSgWroMJkV9JQBpWd7ZdGIqARRnKeSYhRdVU';
const UPLOAD_URL = 'https://api.zostel.com/profile/api/v1/me/assets/1/upload/';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'No auth token' });
  }

  try {
    // Stream the request body directly to the upstream API
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks);

    // Forward all client-* headers from the request
    const upstreamHeaders: Record<string, string> = {
      'Authorization': auth,
      'Client-App-Id': ZO_WORLD_APP_ID,
      'Content-Type': req.headers['content-type'] || 'multipart/form-data',
    };
    if (req.headers['x-client-user-id']) upstreamHeaders['Client-User-Id'] = req.headers['x-client-user-id'] as string;
    if (req.headers['x-client-device-id']) upstreamHeaders['Client-Device-Id'] = req.headers['x-client-device-id'] as string;
    if (req.headers['x-client-device-secret']) upstreamHeaders['Client-Device-Secret'] = req.headers['x-client-device-secret'] as string;

    const upstream = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: upstreamHeaders,
      body,
    });

    const data = await upstream.text();
    res.status(upstream.status).send(data);
  } catch (err) {
    res.status(500).json({ error: 'Upload proxy failed' });
  }
}
