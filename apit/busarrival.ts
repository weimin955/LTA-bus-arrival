/**
 * LTA Datamall Bus Arrival Serverless Proxy
 * Path: /apit/busarrival.ts
 *
 * Proxies live bus arrival predictions from Singapore LTA Datamall v3 API:
 * GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=<BusStopCode>
 * Headers:
 *   AccountKey: <LTA_ACCOUNT_KEY>
 *   accept: application/json
 */

const LTA_DATAMALL_BUS_ARRIVAL_V3_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, AccountKey, Authorization',
  'Content-Type': 'application/json',
};

// Extracts query parameters and headers from either Node req or Web Request
function parseIncomingRequest(req: any) {
  let busStopCode = '';
  let serviceNo = '';
  let headerAccountKey = '';

  if (req instanceof Request) {
    const url = new URL(req.url);
    busStopCode =
      url.searchParams.get('BusStopCode') ||
      url.searchParams.get('busStopCode') ||
      url.searchParams.get('bus_stop_code') ||
      '';
    serviceNo =
      url.searchParams.get('ServiceNo') ||
      url.searchParams.get('serviceNo') ||
      '';
    headerAccountKey =
      req.headers.get('AccountKey') ||
      req.headers.get('accountkey') ||
      req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ||
      '';
  } else {
    // Node.js / Express request
    const query = req.query || {};
    let urlParams: URLSearchParams | null = null;
    if (req.url) {
      try {
        urlParams = new URL(req.url, 'http://localhost').searchParams;
      } catch {}
    }

    busStopCode =
      query.BusStopCode ||
      query.busStopCode ||
      query.bus_stop_code ||
      urlParams?.get('BusStopCode') ||
      urlParams?.get('busStopCode') ||
      urlParams?.get('bus_stop_code') ||
      '';
    serviceNo =
      query.ServiceNo ||
      query.serviceNo ||
      urlParams?.get('ServiceNo') ||
      urlParams?.get('serviceNo') ||
      '';
    const headers = req.headers || {};
    headerAccountKey =
      headers['accountkey'] ||
      headers['AccountKey'] ||
      headers['authorization']?.replace(/^Bearer\s+/i, '') ||
      '';
  }

  return { busStopCode: busStopCode.trim(), serviceNo: serviceNo.trim(), headerAccountKey: headerAccountKey.trim() };
}

// Core executor that fetches from LTA Datamall v3
async function fetchLtaBusArrival(busStopCode: string, serviceNo: string, clientAccountKey: string) {
  // Resolve AccountKey from process.env first, or fallback to client provided header
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    clientAccountKey;

  if (!busStopCode) {
    return {
      status: 400,
      data: {
        error: 'MISSING_BUS_STOP_CODE',
        message: 'BusStopCode query parameter is required. Example: /apit/busarrival?BusStopCode=83139',
      },
    };
  }

  if (!accountKey) {
    return {
      status: 401,
      data: {
        error: 'LTA_ACCOUNT_KEY_NOT_CONFIGURED',
        message:
          'LTA Datamall AccountKey is not configured. Set the LTA_ACCOUNT_KEY environment variable in your hosting dashboard or pass an AccountKey header.',
        busStopCode,
        datamallPortal: 'https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
      },
    };
  }

  // Build target URL
  const targetUrl = new URL(LTA_DATAMALL_BUS_ARRIVAL_V3_URL);
  targetUrl.searchParams.set('BusStopCode', busStopCode);
  if (serviceNo) {
    targetUrl.searchParams.set('ServiceNo', serviceNo);
  }

  try {
    const ltaResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!ltaResponse.ok) {
      const errorText = await ltaResponse.text();
      return {
        status: ltaResponse.status,
        data: {
          error: 'LTA_UPSTREAM_ERROR',
          status: ltaResponse.status,
          statusText: ltaResponse.statusText,
          details: errorText,
          busStopCode,
        },
      };
    }

    const json = await ltaResponse.json();
    return {
      status: 200,
      data: json,
    };
  } catch (error: any) {
    return {
      status: 502,
      data: {
        error: 'LTA_GATEWAY_ERROR',
        message: error.message || 'Failed to reach LTA Datamall gateway',
        busStopCode,
      },
    };
  }
}

// Edge / Web Standard Handler
export async function GET(request: Request): Promise<Response> {
  const { busStopCode, serviceNo, headerAccountKey } = parseIncomingRequest(request);
  const result = await fetchLtaBusArrival(busStopCode, serviceNo, headerAccountKey);

  return new Response(JSON.stringify(result.data, null, 2), {
    status: result.status,
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
  // If invoked in standard Fetch environment
  if (req instanceof Request && !res) {
    if (req.method === 'OPTIONS') return OPTIONS();
    return GET(req);
  }

  // Node.js / Express environment
  if (res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const { busStopCode, serviceNo, headerAccountKey } = parseIncomingRequest(req);
    const result = await fetchLtaBusArrival(busStopCode, serviceNo, headerAccountKey);

    Object.entries(CORS_HEADERS).forEach(([k, v]) => {
      res.setHeader(k, v);
    });

    if (typeof res.status === 'function') {
      res.status(result.status).json(result.data);
    } else {
      res.writeHead(result.status, CORS_HEADERS);
      res.end(JSON.stringify(result.data, null, 2));
    }
  }
}
