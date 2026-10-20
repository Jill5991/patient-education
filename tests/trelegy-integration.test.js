const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(body => body.includes("const MEDICATIONS"));
assert.ok(script, "medication script exists");

const context = {
  URL,
  URLSearchParams,
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  QRCode: function QRCode() {}
};
vm.createContext(context);
vm.runInContext(`${script}\nglobalThis.testData = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);

const med = context.testData.medications.find(item => item.id === "trelegy-ellipta");
const langs = context.testData.langs.map(item => item.code);
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));

test("Trelegy has eight approved illustrations in step order", () => {
  assert.equal(med.steps.length, 8);
  med.steps.forEach((step, index) => {
    const expected = `assets/img/trelegy-ellipta/step-${String(index).padStart(2, "0")}.png`;
    assert.equal(step.illustration, expected);
    const image = fs.readFileSync(path.join(root, expected));
    assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 896);
  });
});

test("each sheet language has one approved video and its own stable QR target", () => {
  assert.deepEqual(Object.keys(videos[med.id]).sort(), [...langs].sort());
  const ids = new Set();
  for (const lang of langs) {
    const entry = videos[med.id][lang];
    assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
    assert.ok(entry.title && entry.channel);
    ids.add(entry.youtubeId);
    const qr = new URL(context.testData.getSheetQrUrl(med, lang));
    assert.equal(qr.origin, "https://jill5991.github.io");
    assert.equal(qr.pathname, "/patient-education/video.html");
    assert.equal(qr.searchParams.get("med"), med.id);
    assert.equal(qr.searchParams.get("lang"), lang);
    assert.equal([...qr.searchParams.keys()].filter(key => key === "lang").length, 1);
  }
  assert.equal(ids.size, 7);
  assert.match(videos[med.id].tl.notice, /Breo Ellipta/);
});

test("QR URL updates an existing language query without corrupting it", () => {
  const qr = new URL(context.testData.getSheetQrUrl({ qrUrl: "https://youtu.be/example?lang=zh-TW&x=1" }, "en"));
  assert.equal(qr.searchParams.get("lang"), "en");
  assert.equal(qr.searchParams.get("x"), "1");
});
