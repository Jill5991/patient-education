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
vm.runInContext(`${script}\nglobalThis.testData = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);

const medicationById = Object.fromEntries(context.testData.medications.map(m => [m.id, m]));
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const packs = {
  alyssa: "24+4", diane35: "21", "gynera-meliane": "21", loestrin: "24+4",
  "marvelon-21": "21", "marvelon-28": "21+7", "mercilon-21": "21",
  "mercilon-28": "21+7", "winstop-28": "21+7", "winstop-30": "21+7"
};
const languages = context.testData.langs.map(item => item.code);

test("day-13 ten oral-contraceptive sheets reference 60 valid illustrations", () => {
  let total = 0;
  for (const id of Object.keys(packs)) {
    const med = medicationById[id];
    assert.ok(med, id);
    assert.equal(med.steps.length, 6, id);
    for (let i = 0; i < 6; i++) {
      const expected = `assets/img/${id}/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(med.steps[i].illustration, expected);
      const image = fs.readFileSync(path.join(root, expected));
      assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      assert.equal(image.readUInt32BE(16), 1200);
      assert.equal(image.readUInt32BE(20), 896);
      total++;
    }
  }
  assert.equal(total, 60);
});

test("day-13 videos route all seven languages and respect pack type", () => {
  let available = 0, gaps = 0;
  for (const [id, pack] of Object.entries(packs)) {
    assert.deepEqual(Object.keys(videos[id]).sort(), [...languages].sort());
    for (const lang of languages) {
      const qr = new URL(context.testData.getSheetQrUrl(medicationById[id], lang));
      assert.equal(qr.pathname, "/patient-education/video.html");
      assert.equal(qr.searchParams.get("med"), id);
      assert.equal(qr.searchParams.get("lang"), lang);
      const entry = videos[id][lang];
      if (entry.youtubeId) {
        assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
        assert.ok(entry.notice.includes(pack), `${id} ${lang}`);
        available++;
      } else {
        assert.equal(entry.status, "no_suitable_video");
        gaps++;
      }
    }
  }
  assert.equal(available, 68);
  assert.equal(gaps, 2);
  assert.equal(videos.alyssa.id.status, "no_suitable_video");
  assert.equal(videos.loestrin.id.status, "no_suitable_video");
  assert.equal(videos["marvelon-28"].id.youtubeId, "to-apPsgNsw");
  assert.equal(videos.diane35.id.youtubeId, "bJRRszBMEJQ");
});
