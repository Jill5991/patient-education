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
  URL,
  URLSearchParams,
  console,
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  QRCode: function QRCode() {}
};
vm.createContext(context);
vm.runInContext(`${script}\nglobalThis.testData = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);

const medications = context.testData.medications;
const languages = context.testData.langs.map(item => item.code);
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const ids = [
  "topical-steroids", "vimax-foaming-solution", "acyclovir-cream",
  "azelaic-acid", "brimonidine-gel", "calcipotriol-ointment",
  "calcitriol-ointment", "clindamycin-topical",
  "clotrimazole-topical-cream", "doxepin-cream"
];

test("day-09 ten sheets reference 50 valid topical illustrations in step order", () => {
  let count = 0;
  for (const id of ids) {
    const med = medications.find(item => item.id === id);
    assert.ok(med, id);
    assert.equal(med.steps.length, 5, id);
    for (let i = 0; i < 5; i++) {
      const expected = `assets/img/${id}/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(med.steps[i].illustration, expected);
      const image = fs.readFileSync(path.join(root, expected));
      assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", expected);
      assert.equal(image.readUInt32BE(16), 1200, expected);
      assert.equal(image.readUInt32BE(20), 896, expected);
      count++;
    }
  }
  assert.equal(count, 50);
});

test("day-09 QR routes preserve seven languages and missing videos are explicit", () => {
  let available = 0;
  let gaps = 0;
  for (const id of ids) {
    const med = medications.find(item => item.id === id);
    assert.deepEqual(Object.keys(videos[id]).sort(), [...languages].sort());
    for (const lang of languages) {
      const qr = new URL(context.testData.getSheetQrUrl(med, lang));
      assert.equal(qr.pathname, "/patient-education/video.html");
      assert.equal(qr.searchParams.get("med"), id);
      assert.equal(qr.searchParams.get("lang"), lang);
      const entry = videos[id][lang];
      if (entry.youtubeId) {
        assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
        available++;
      } else {
        assert.equal(entry.status, "no_suitable_video");
        gaps++;
      }
    }
  }
  assert.equal(available, 27);
  assert.equal(gaps, 43);
  assert.match(videos["brimonidine-gel"].en.notice, /five pea-sized amounts/);
  assert.equal(videos["vimax-foaming-solution"].en.status, "no_suitable_video");
});
