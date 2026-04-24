import crypto from 'crypto';

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export async function indexNowSubmit({ host, key, keyLocation, urlList }: IndexNowPayload): Promise<{ ok: boolean; status: number; body: string }>{
  const body = JSON.stringify({ host, key, keyLocation, urlList });
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

export function generateIndexNowKey(): string {
  return crypto.randomBytes(16).toString('hex');
}
