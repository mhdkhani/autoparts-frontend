// Server-side only (route handlers, server components) — used by both the admin and the front module.
//
// THE way to call the NestJS API from Next.js. A request carries only what it needs:
//   Authorization: Bearer <token>   when there is a token
//   Content-Type + Content-Length   when there is a body
//   X-Forwarded-For                 only where the API rate-limits per client IP (login / register)
// plus Host / Connection, which HTTP itself requires. No cookies, no browser headers, and none of the
// defaults fetch() would add (user-agent, accept, accept-language, sec-fetch-mode, cache-control, …) —
// that's why this uses node:http instead of fetch().
import http from 'node:http';
import https from 'node:https';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name} (set it in infra/.env)`);
  return value;
}

export type BackendRequest = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  /** raw body (JSON text, multipart bytes, …) together with its content type */
  body?: string | ArrayBuffer | Uint8Array;
  contentType?: string;
  forwardedFor?: string;
};

const TIMEOUT_MS = 30_000;

/** `${API_INTERNAL_URL}/api${path}` over the Docker network; answers a standard Response. */
export function backendFetch(path: string, req: BackendRequest = {}): Promise<Response> {
  const url = new URL(`${requireEnv('API_INTERNAL_URL')}/api${path}`);
  const raw =
    req.body === undefined
      ? undefined
      : typeof req.body === 'string'
        ? Buffer.from(req.body)
        : Buffer.from(req.body instanceof ArrayBuffer ? new Uint8Array(req.body) : req.body);
  const body = raw?.length ? raw : undefined; // an empty body is no body (no Content-Length: 0)

  const headers: Record<string, string> = {};
  if (req.token) headers.Authorization = `Bearer ${req.token}`;
  if (body) {
    if (req.contentType) headers['Content-Type'] = req.contentType;
    headers['Content-Length'] = String(body.length);
  }
  if (req.forwardedFor) headers['X-Forwarded-For'] = req.forwardedFor;

  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const outgoing = client.request(url, { method: req.method ?? 'GET', headers }, (incoming) => {
      const chunks: Buffer[] = [];
      incoming.on('data', (c: Buffer) => chunks.push(c));
      incoming.on('error', reject);
      incoming.on('end', () => {
        const status = incoming.statusCode ?? 502;
        const resHeaders = new Headers();
        for (const [k, v] of Object.entries(incoming.headers)) {
          if (v !== undefined) for (const x of Array.isArray(v) ? v : [v]) resHeaders.append(k, x);
        }
        const payload = status === 204 || status === 304 ? null : new Uint8Array(Buffer.concat(chunks));
        resolve(new Response(payload, { status, headers: resHeaders }));
      });
    });
    outgoing.on('error', reject);
    outgoing.setTimeout(TIMEOUT_MS, () => outgoing.destroy(new Error(`API ${req.method ?? 'GET'} ${path}: timeout`)));
    if (body) outgoing.write(body);
    outgoing.end();
  });
}
