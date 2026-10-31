import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import type { Store } from "./store.js";
import { Generations } from "./generations.js";
import { ApiError } from "./errors.js";
import { uuid, parse } from "./validation.js";
import { courses } from "../src/content/courses.js";
export interface IdentityVerifier {
  verify(token: string): Promise<{ id: string }>;
}
export function createApi({
  store,
  verifier,
  origin,
  generations = store ? new Generations(store) : undefined,
  root = path.resolve("dist"),
}: {
  store?: Store;
  verifier: IdentityVerifier;
  origin: string;
  generations?: Generations;
  root?: string;
}) {
  const windows = new Map<string, { count: number; time: number }>();
  return http.createServer(async (req, res) => {
    const requestId = crypto.randomUUID();
    res.setHeader("X-Request-ID", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    const send = (status: number, body: unknown) => {
      res.writeHead(status, {
        "Content-Type": "application/json;charset=utf-8",
      });
      res.end(JSON.stringify(body));
    };
    try {
      if (req.headers.origin && req.headers.origin !== origin)
        throw new ApiError("origin-denied", 403);
      if (req.headers.origin === origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Authorization,Content-Type,Idempotency-Key",
        );
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      }
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      const url = new URL(req.url || "/", origin);
      if (url.pathname === "/api/health") {
        send(store && (await store.database.health()) ? 200 : 503, {
          status:
            store && (await store.database.health())
              ? "ready"
              : "configuration-required",
        });
        return;
      }
      if (url.pathname === "/api/catalog" && req.method === "GET") {
        send(200, {
          version: "catalog-1",
          ruleVersion: "simulation-1",
          courses,
        });
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        const key = req.socket.remoteAddress || "unknown",
          now = Date.now(),
          bucket = windows.get(key);
        if (!bucket || now - bucket.time > 60000) {
          windows.set(key, { count: 1, time: now });
          if (windows.size > 10000) windows.clear();
        } else if (++bucket.count > 600) throw new ApiError("rate-limit", 429);
        const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/);
        if (!match) throw new ApiError("authentication-required", 401);
        let user: { id: string };
        try {
          user = await verifier.verify(match[1]);
        } catch {
          throw new ApiError("session-expired", 401);
        }
        parse(uuid, user.id);
        if (!store) throw new ApiError("service-unconfigured", 503);
        if (url.pathname === "/api/state" && req.method === "GET") {
          send(200, await store.read(user.id));
          return;
        }
        if (req.method !== "POST") throw new ApiError("not-found", 404);
        if (!String(req.headers["content-type"]).startsWith("application/json"))
          throw new ApiError("json-required", 415);
        let length = 0;
        const chunks: Buffer[] = [];
        const platformBody = (req as typeof req & {body?:unknown}).body;
        if (platformBody !== undefined) {
          const raw = Buffer.isBuffer(platformBody) ? platformBody : Buffer.from(typeof platformBody==='string' ? platformBody : JSON.stringify(platformBody));
          if (raw.length > 524288) throw new ApiError('request-too-large',413);
          chunks.push(raw);
        } else for await (const chunk of req) {
            length += chunk.length;
            if (length > 524288) throw new ApiError("request-too-large", 413);
            chunks.push(chunk);
          }
        let body: any;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          throw new ApiError("invalid-json");
        }
        if (url.pathname === "/api/mutations") {
          const id = parse(uuid, req.headers["idempotency-key"]);
          send(200, await store.mutate(user.id, id, body));
          return;
        }
        if (
          url.pathname === "/api/import/preview" ||
          url.pathname === "/api/import"
        ) {
          const id = parse(uuid, req.headers["idempotency-key"]);
          send(
            200,
            await store.importGuest(
              user.id,
              id,
              body,
              url.pathname.endsWith("/preview"),
            ),
          );
          return;
        }
        if (url.pathname === "/api/plans") {
          send(200, await generations!.generate(user.id, body));
          return;
        }
        throw new ApiError("not-found", 404);
      }
      if (req.method !== "GET" && req.method !== "HEAD")
        throw new ApiError("not-found", 404);
      const requested = path.resolve(
        root,
        "." + decodeURIComponent(url.pathname),
      );
      if (!requested.startsWith(root + path.sep) && requested !== root)
        throw new ApiError("not-found", 404);
      let file = requested;
      try {
        if (!(await fs.stat(file)).isFile())
          file = path.join(root, "index.html");
      } catch {
        file = path.join(root, "index.html");
      }
      const ext = path.extname(file),
        types: Record<string, string> = {
          ".html": "text/html;charset=utf-8",
          ".js": "text/javascript;charset=utf-8",
          ".css": "text/css",
          ".woff2": "font/woff2",
          ".svg": "image/svg+xml",
        };
      const data = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": types[ext] || "application/octet-stream",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch (e) {
      const error =
        e instanceof ApiError ? e : new ApiError("service-unavailable", 503);
      send(error.status, {
        requestId,
        error: {
          code: error.code,
          retryable: [429, 502, 503, 504].includes(error.status),
        },
      });
      if (error.status >= 500)
        console.error(
          JSON.stringify({ requestId, status: error.status, code: error.code }),
        );
    }
  });
}
