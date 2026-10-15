/**
 * LTA Datamall Serverless Health Endpoint
 * Path: /apit/health.ts
 *
 * Checks service status and validates whether the LTA_ACCOUNT_KEY
 * environment variable has been configured.
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  service: string;
  ltaAccountKeyConfigured: boolean;
  version: string;
  instructions?: string;
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, AccountKey, Authorization',
  'Content-Type': 'application/json',
};

// Edge / Web Standard Request Handler
export async function GET(request?: Request): Promise<Response> {
  const isKeyConfigured = Boolean(
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY
  );

  const payload: HealthResponse = {
    status: isKeyConfigured ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'LTA Datamall Bus Arrival Serverless Proxy',
    ltaAccountKeyConfigured: isKeyConfigured,
    version: '1.0.0',
    instructions: isKeyConfigured
      ? 'LTA Datamall account key is detected and ready.'
      : 'LTA_ACCOUNT_KEY environment variable is not set. Please set LTA_ACCOUNT_KEY in your hosting environment.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// Edge / Web Standard Preflight Handler
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// Node.js / Vercel Serverless Function Default Export
export default async function handler(req: any, res?: any) {
  // If invoked with Web Standard Request (Next.js / Cloudflare / Fetch)
  if (req instanceof Request && !res) {
    if (req.method === 'OPTIONS') return OPTIONS();
    return GET(req);
  }

  // Node.js / Express Serverless pattern
  if (res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const isKeyConfigured = Boolean(
      process.env.LTA_ACCOUNT_KEY ||
      process.env.LTA_DATAMALL_KEY ||
      process.env.ACCOUNT_KEY
    );

    const payload: HealthResponse = {
      status: isKeyConfigured ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'LTA Datamall Bus Arrival Serverless Proxy',
      ltaAccountKeyConfigured: isKeyConfigured,
      version: '1.0.0',
      instructions: isKeyConfigured
        ? 'LTA Datamall account key is detected and ready.'
        : 'LTA_ACCOUNT_KEY environment variable is not set. Please set LTA_ACCOUNT_KEY in your hosting environment.',
    };

    Object.entries(CORS_HEADERS).forEach(([k, v]) => {
      res.setHeader(k, v);
    });

    if (typeof res.status === 'function') {
      res.status(200).json(payload);
    } else {
      res.writeHead(200, CORS_HEADERS);
      res.end(JSON.stringify(payload, null, 2));
    }
  }
}
