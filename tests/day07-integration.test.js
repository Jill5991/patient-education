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
const imageCounts = {
  "foster-mdi": 6,
  "foster-nexthaler": 7,
  "seretide-50": 6,
  "seretide-250": 6,
  trimbow: 6,
  "relvar-ellipta": 7,
  "symbicort-turbuhaler": 7,
  "symbicort-rapihaler": 6
};

test("day-07 inhaler sheets reference 51 valid illustrations in step order", () => {
  let total = 0;
  for (const [id, count] of Object.entries(imageCounts)) {
    const med = medications.find(item => item.id === id);
    assert.ok(med, id);
    assert.equal(med.steps.length, count, id);
    for (let i = 0; i < count; i++) {
      const expected = `assets/img/${id}/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(med.steps[i].illustration, expected);
      const image = fs.readFileSync(path.join(root, expected));
      assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", expected);
      assert.equal(image.readUInt32BE(16), 1200, expected);
      assert.equal(image.readUInt32BE(20), 896, expected);
      total++;
    }
  }
  assert.equal(total, 51);
});

test("day-07 QR routes retain language and resolve to a video or explicit gap", () => {
  let available = 0;
  let gaps = 0;
  for (const id of Object.keys(imageCounts)) {
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
  assert.equal(available, 52);
  assert.equal(gaps, 4);
  assert.deepEqual(["vi", "th", "tl", "ja"].map(lang => videos["foster-nexthaler"][lang].status),
    ["no_suitable_video", "no_suitable_video", "no_suitable_video", "no_suitable_video"]);
});

test("device and medicine differences are visible before playing a video", () => {
  for (const id of ["foster-mdi", "trimbow"]) {
    for (const lang of ["en", "id", "vi", "th", "tl"]) {
      assert.ok(videos[id][lang].notice, `${id}/${lang}`);
    }
  }
  assert.match(videos["relvar-ellipta"].vi.title, /Trelegy/);
  assert.match(videos["relvar-ellipta"].vi.notice, /Trelegy.*Relvar/);
  assert.ok(videos["symbicort-rapihaler"].id.notice);
  const videoHtml = fs.readFileSync(path.join(root, "video.html"), "utf8");
  assert.ok(videoHtml.indexOf('id="notice"') < videoHtml.indexOf('id="video"'));
});
