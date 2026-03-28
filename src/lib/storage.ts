import { AuditJob } from '@/types/audit';

// In-memory storage for development. In production, replace with Vercel KV.
const store = new Map<string, string>();

export async function getJob(id: string): Promise<AuditJob | null> {
  // Try Vercel KV first
  if (process.env.KV_REST_API_URL) {
    try {
      const res = await fetch(`${process.env.KV_REST_API_URL}/get/audit:${id}`, {
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.result ? JSON.parse(data.result) : null;
      }
    } catch {
      // Fall through to in-memory
    }
  }
  const raw = store.get(`audit:${id}`);
  return raw ? JSON.parse(raw) : null;
}

export async function setJob(id: string, job: AuditJob): Promise<void> {
  const value = JSON.stringify(job);
  if (process.env.KV_REST_API_URL) {
    try {
      await fetch(`${process.env.KV_REST_API_URL}/set/audit:${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value, ex: 86400 }), // 24h TTL
      });
      return;
    } catch {
      // Fall through to in-memory
    }
  }
  store.set(`audit:${id}`, value);
}

export async function storePdf(id: string, buffer: Buffer): Promise<string> {
  // Try Vercel Blob first
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const res = await fetch(`https://blob.vercel-storage.com/superfan-audit-${id}.pdf`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          'x-content-type': 'application/pdf',
          'x-cache-control-max-age': '86400',
        },
        body: new Uint8Array(buffer),
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch {
      // Fall through to local storage
    }
  }

  // Local fallback: store in memory and serve via API
  store.set(`pdf:${id}`, buffer.toString('base64'));
  return `/api/audit/report/${id}`;
}

export async function getPdf(id: string): Promise<Buffer | null> {
  const raw = store.get(`pdf:${id}`);
  return raw ? Buffer.from(raw, 'base64') : null;
}
