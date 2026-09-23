const PORT = parseInt(process.env.PORT ?? "6737", 10);
const BIND = process.env.BIND ?? "0.0.0.0";
const UPSTREAM = (process.env.UPSTREAM ?? "http://127.0.0.1:6736").replace(
  /\/$/,
  "",
);
const DASH_TOKEN = process.env.DASH_TOKEN;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function log(method: string, path: string, status: number) {
  console.log(`${method} ${path} ${status}`);
}

function jsonResponse(
  body: unknown,
  status: number,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

function checkAuth(req: Request, url: URL): boolean {
  if (!DASH_TOKEN) return true;
  const auth = req.headers.get("Authorization");
  if (auth === `Bearer ${DASH_TOKEN}`) return true;
  if (url.searchParams.get("token") === DASH_TOKEN) return true;
  return false;
}

async function proxyUpstream(
  path: string,
  search: string,
): Promise<Response> {
  const target = `${UPSTREAM}${path}${search}`;
  try {
    const upstream = await fetch(target);
    const headers = new Headers(upstream.headers);
    headers.set("Content-Type", "application/json");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { error: "upstream unreachable", detail },
      502,
    );
  }
}

const indexPath = `${import.meta.dir}/index.html`;
const indexFile = Bun.file(indexPath);

Bun.serve({
  hostname: BIND,
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { method } = req;
    const { pathname, search } = url;

    if (method === "OPTIONS") {
      log(method, pathname, 204);
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!checkAuth(req, url)) {
      log(method, pathname, 401);
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      log(method, pathname, 200);
      return new Response(indexFile, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (
      method === "GET" &&
      (pathname === "/v1/usage" || pathname.startsWith("/v1/usage/"))
    ) {
      const resp = await proxyUpstream(pathname, search);
      log(method, pathname, resp.status);
      return resp;
    }

    log(method, pathname, 404);
    return jsonResponse({ error: "not_found" }, 404);
  },
});

const listenUrl = `http://${BIND === "0.0.0.0" ? "localhost" : BIND}:${PORT}`;
console.log(`listening on ${listenUrl}`);
console.log(`token auth: ${DASH_TOKEN ? "enabled" : "disabled"}`);
console.log(`upstream: ${UPSTREAM}`);