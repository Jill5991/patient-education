const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { webcrypto } = require("node:crypto");

globalThis.crypto ||= webcrypto;
const source = fs.readFileSync(path.join(__dirname, "../functions/_middleware.js"), "utf8");
const middleware = import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const origin = "https://patient-education-bil.pages.dev";
const env = {
  APP_ORIGIN: origin,
  GOOGLE_CLIENT_ID: "test-client.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "test-client-secret",
  SESSION_SECRET: "test-secret-with-more-than-32-random-characters",
  ALLOWED_EMAILS: "owner@gmail.com"
};
const context = (url, cookie) => ({
  env,
  request: new Request(url, { headers: cookie ? { Cookie: cookie } : {} }),
  next: async () => new Response("protected content")
});
const b64 = value => Buffer.from(Buffer.isBuffer(value) || value instanceof Uint8Array ? value : typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");

test("missing configuration, preview host, and unauthenticated assets fail closed", async () => {
  const { onRequest } = await middleware;
  assert.equal((await onRequest({ ...context(`${origin}/`), env: {} })).status, 503);
  assert.equal((await onRequest(context(`https://abc.patient-education-bil.pages.dev/`))).status, 403);
  const page = await onRequest(context(`${origin}/?pharmacy=jiahe`));
  assert.equal(page.status, 302);
  assert.match(page.headers.get("Location"), /\/auth\/login\?return=/);
  assert.equal((await onRequest(context(`${origin}/assets/img/test.webp`))).status, 401);
});

test("Google authorization validates state, signature, allowlist, and every asset request", async () => {
  const { onRequest } = await middleware;
  const login = await onRequest(context(`${origin}/auth/login?return=%2F%3Fpharmacy%3Djiahe`));
  assert.equal(login.status, 302);
  const authorization = new URL(login.headers.get("Location"));
  assert.equal(authorization.origin, "https://accounts.google.com");
  assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
  const stateCookie = login.headers.get("Set-Cookie").split(";")[0];
  const badState = await onRequest(context(`${origin}/auth/callback?code=abc&state=wrong`, stateCookie));
  assert.equal(badState.status, 401);

  const oauthData = JSON.parse(Buffer.from(stateCookie.split("=")[1], "base64url").toString());
  const keys = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const publicKey = { ...await crypto.subtle.exportKey("jwk", keys.publicKey), kid: "test-key", alg: "RS256" };
  let email = "owner@gmail.com";
  let audience = env.GOOGLE_CLIENT_ID;
  let corruptSignature = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    if (String(url).endsWith("/certs")) return new Response(JSON.stringify({ keys: [publicKey] }), { headers: { "Cache-Control": "max-age=300" } });
    if (String(url).endsWith("/token")) {
      const now = Math.floor(Date.now() / 1000);
      const input = `${b64({ alg: "RS256", kid: "test-key" })}.${b64({ iss: "https://accounts.google.com", aud: audience, sub: "google-user-123", email, email_verified: true, nonce: oauthData.nonce, iat: now, exp: now + 3600 })}`;
      const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keys.privateKey, new TextEncoder().encode(input));
      const signed = Buffer.from(signature);
      if (corruptSignature) signed[0] ^= 1;
      return new Response(JSON.stringify({ id_token: `${input}.${b64(signed)}` }));
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    const callback = `${origin}/auth/callback?code=abc&state=${oauthData.state}`;
    const accepted = await onRequest(context(callback, stateCookie));
    assert.equal(accepted.status, 302);
    assert.equal(accepted.headers.get("Location"), `${origin}/?pharmacy=jiahe`);
    const sessionCookie = accepted.headers.get("Set-Cookie").split(/, (?=__Host-pharmacy_session=)/)[1]?.split(";")[0];
    assert.ok(sessionCookie, "signed session cookie exists");
    const asset = await onRequest(context(`${origin}/assets/img/test.webp`, sessionCookie));
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("Cache-Control"), "private, no-store");
    assert.equal((await onRequest(context(`${origin}/assets/img/test.webp`, `${sessionCookie}x`))).status, 401);
    env.ALLOWED_EMAILS = "someone-else@gmail.com";
    assert.equal((await onRequest(context(`${origin}/assets/img/test.webp`, sessionCookie))).status, 401);
    email = "unlisted@gmail.com";
    assert.equal((await onRequest(context(callback, stateCookie))).status, 403);
    email = "owner@gmail.com";
    audience = "another-client.apps.googleusercontent.com";
    assert.equal((await onRequest(context(callback, stateCookie))).status, 401);
    audience = env.GOOGLE_CLIENT_ID;
    corruptSignature = true;
    assert.equal((await onRequest(context(callback, stateCookie))).status, 401);
  } finally {
    globalThis.fetch = originalFetch;
    env.ALLOWED_EMAILS = "owner@gmail.com";
  }
});

test("build output routes every file through authentication", () => {
  const build = fs.readFileSync(path.join(__dirname, "../scripts/build-pharmacy-site.js"), "utf8");
  assert.match(build, /include:\s*\["\/\*"\]/);
  assert.match(build, /exclude:\s*\[\]/);
});
