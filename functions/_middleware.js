const encoder = new TextEncoder();
const SESSION_SECONDS = 12 * 60 * 60;
const STATE_SECONDS = 10 * 60;
const SESSION_COOKIE = "__Host-pharmacy_session";
const STATE_COOKIE = "__Host-pharmacy_oauth";

function base64url(bytes) {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function unbase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url");
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, character => character.charCodeAt(0));
}

function randomToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

function cookies(request) {
  return Object.fromEntries((request.headers.get("Cookie") || "").split(";")
    .map(part => part.trim().split(/=(.*)/s)).filter(parts => parts.length >= 2));
}

function cookie(name, value, age) {
  return `${name}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`;
}

function plain(message, status = 403) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}

function redirect(location, headers = []) {
  const response = new Response(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
  for (const value of headers) response.headers.append("Set-Cookie", value);
  return response;
}

function safeReturn(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return "/";
  return value;
}

function config(env) {
  const origin = new URL(env.APP_ORIGIN || "");
  if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("Invalid origin");
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error("Missing auth secrets");
  const allowed = new Set((env.ALLOWED_EMAILS || "").split(/[\s,;]+/).map(email => email.toLowerCase()).filter(Boolean));
  if (!allowed.size) throw new Error("Missing allowlist");
  return { origin: origin.origin, clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, sessionSecret: env.SESSION_SECRET, allowed };
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signSession(payload, secret) {
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${base64url(new Uint8Array(signature))}`;
}

async function readSession(value, settings) {
  try {
    const [body, signature, extra] = (value || "").split(".");
    if (!body || !signature || extra) return null;
    if (!await crypto.subtle.verify("HMAC", await hmacKey(settings.sessionSecret), unbase64url(signature), encoder.encode(body))) return null;
    const payload = JSON.parse(new TextDecoder().decode(unbase64url(body)));
    if (typeof payload.sub !== "string" || !payload.sub || typeof payload.email !== "string" || !Number.isSafeInteger(payload.exp)) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000) || !settings.allowed.has(payload.email.toLowerCase())) return null;
    return payload;
  } catch { return null; }
}

let keyCache = null;
let keyCacheExpiry = 0;
async function googleKeys() {
  if (keyCache && Date.now() < keyCacheExpiry) return keyCache;
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw new Error("Google keys unavailable");
  const keys = (await response.json()).keys;
  if (!Array.isArray(keys)) throw new Error("Google keys invalid");
  const maxAge = Number(response.headers.get("Cache-Control")?.match(/max-age=(\d+)/)?.[1] || 300);
  keyCache = keys;
  keyCacheExpiry = Date.now() + Math.min(maxAge, 3600) * 1000;
  return keys;
}

async function verifyGoogleIdToken(token, settings, nonce) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid ID token");
  const header = JSON.parse(new TextDecoder().decode(unbase64url(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(unbase64url(parts[1])));
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("Invalid signing algorithm");
  const jwk = (await googleKeys()).find(key => key.kid === header.kid && key.kty === "RSA" && (!key.alg || key.alg === "RS256"));
  if (!jwk) throw new Error("Signing key unavailable");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, unbase64url(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`))) throw new Error("Invalid ID token signature");
  const now = Math.floor(Date.now() / 1000);
  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) || claims.aud !== settings.clientId || claims.nonce !== nonce || !Number.isSafeInteger(claims.exp) || claims.exp <= now || !Number.isSafeInteger(claims.iat) || claims.iat > now + 60 || typeof claims.sub !== "string" || !claims.sub || typeof claims.email !== "string" || claims.email_verified !== true) throw new Error("Invalid ID token claims");
  return claims;
}

async function beginLogin(settings, returnTo) {
  const state = randomToken();
  const verifier = randomToken();
  const nonce = randomToken();
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
  const params = new URLSearchParams({ client_id: settings.clientId, redirect_uri: `${settings.origin}/auth/callback`, response_type: "code", scope: "openid email", prompt: "select_account", state, nonce, code_challenge: challenge, code_challenge_method: "S256" });
  const data = base64url(encoder.encode(JSON.stringify({ state, verifier, nonce, returnTo: safeReturn(returnTo), exp: Date.now() + STATE_SECONDS * 1000 })));
  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, [cookie(STATE_COOKIE, data, STATE_SECONDS)]);
}

async function finishLogin(request, settings) {
  const url = new URL(request.url);
  const clearState = cookie(STATE_COOKIE, "", 0);
  try {
    const raw = cookies(request)[STATE_COOKIE];
    const state = JSON.parse(new TextDecoder().decode(unbase64url(raw || "")));
    if (!state || Date.now() > state.exp || !url.searchParams.get("state") || url.searchParams.get("state") !== state.state || !url.searchParams.get("code")) throw new Error("Invalid OAuth state");
    const body = new URLSearchParams({ code: url.searchParams.get("code"), client_id: settings.clientId, client_secret: settings.clientSecret, redirect_uri: `${settings.origin}/auth/callback`, grant_type: "authorization_code", code_verifier: state.verifier });
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!tokenResponse.ok) throw new Error("Token exchange failed");
    const tokens = await tokenResponse.json();
    if (typeof tokens.id_token !== "string") throw new Error("Missing ID token");
    const claims = await verifyGoogleIdToken(tokens.id_token, settings, state.nonce);
    if (!settings.allowed.has(claims.email.toLowerCase())) return plain("這個 Google 帳號尚未獲准使用單張。", 403);
    const session = await signSession({ sub: claims.sub, email: claims.email.toLowerCase(), exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }, settings.sessionSecret);
    return redirect(`${settings.origin}${safeReturn(state.returnTo)}`, [clearState, cookie(SESSION_COOKIE, session, SESSION_SECONDS)]);
  } catch {
    return new Response("登入未完成，請返回單張網址重試。", { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Set-Cookie": clearState } });
  }
}

function finishLogout() {
  const html = `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>已登出用藥指導單張</title><style>body{font:16px/1.6 system-ui,-apple-system,sans-serif;background:#f5f7f5;color:#17342c;margin:0}main{max-width:560px;margin:12vh auto;padding:24px}a{color:#096849}</style></head><body><main><h1>已登出用藥指導單張</h1><p>本站登入工作階段已清除。若使用共用裝置，請同時登出 Google 帳號，或使用無痕視窗。</p><p><a href="/auth/login">使用 Google 帳號重新登入</a></p></main></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Set-Cookie": cookie(SESSION_COOKIE, "", 0), "X-Content-Type-Options": "nosniff" } });
}

export async function onRequest(context) {
  let settings;
  try { settings = config(context.env); } catch { return plain("登入設定尚未完成。", 503); }
  const request = context.request;
  const url = new URL(request.url);
  if (url.origin !== settings.origin) return plain("此網址尚未啟用。", 403);
  if (request.method !== "GET" && request.method !== "HEAD") return plain("Method not allowed", 405);
  if (url.pathname === "/auth/callback") return finishLogin(request, settings);
  if (url.pathname === "/auth/login") return beginLogin(settings, url.searchParams.get("return"));
  if (url.pathname === "/auth/logout") return finishLogout();
  const session = await readSession(cookies(request)[SESSION_COOKIE], settings);
  if (url.pathname === "/auth/me") return session
    ? new Response(JSON.stringify({ email: session.email }), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
    : plain("請先登入。", 401);
  if (!session) {
    const wantsPage = url.pathname === "/" || url.pathname.endsWith(".html");
    return wantsPage ? redirect(`${settings.origin}/auth/login?return=${encodeURIComponent(url.pathname + url.search)}`) : plain("請先登入。", 401);
  }
  const response = await context.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
