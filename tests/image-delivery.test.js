const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(body => body.includes("const MEDICATIONS"));
const context = {
  URL, URLSearchParams, console,
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  QRCode: function QRCode() {}
};
vm.createContext(context);
vm.runInContext(script, context);

function* pngs(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* pngs(full);
    else if (entry.name.endsWith(".png")) yield full;
  }
}

test("all illustration PNGs have small WebP delivery copies", () => {
  let sourceBytes = 0;
  let webpBytes = 0;
  let count = 0;
  for (const png of pngs(path.join(root, "assets"))) {
    const webp = png.replace(/\.png$/, ".webp");
    assert.ok(fs.existsSync(webp), `Missing ${webp}`);
    assert.equal(fs.readFileSync(webp).subarray(0, 4).toString(), "RIFF");
    sourceBytes += fs.statSync(png).size;
    webpBytes += fs.statSync(webp).size;
    count++;
  }
  assert.ok(count >= 773);
  assert.ok(webpBytes < sourceBytes / 10, `WebP ${webpBytes} / PNG ${sourceBytes}`);
});

test("PNG sheets select WebP and request visible images immediately", () => {
  const markup = vm.runInContext('renderIllustrationImage("assets/img/day16-injections/levemir/page-1/step-01.png", "裝針", true)', context);
  assert.match(markup, /<picture>/);
  assert.match(markup, /step-01\.webp/);
  assert.match(markup, /step-01\.png/);
  assert.match(markup, /loading="eager"/);
  assert.match(markup, /fetchpriority="high"/);
  assert.doesNotMatch(html, /loading="lazy"/);
});

test("revised nasal art uses a fresh URL for both WebP and PNG", () => {
  const markup = vm.runInContext('renderIllustrationImage("assets/img/day18-nasal/avamys/main/step-03.png", "朝同側耳朵", false)', context);
  assert.match(markup, /step-03\.webp\?v=20261109-3/);
  assert.match(markup, /step-03\.png\?v=20261109-3/);
});
