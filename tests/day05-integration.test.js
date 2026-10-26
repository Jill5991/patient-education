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
  "permethrin-5": 6,
  "adapalene-0-1-gel": 6,
  "benzoyl-peroxide-5": 4,
  "benovate-solution": 6,
  "amorolfine-nail-lacquer": 6,
  "fusidic-acid-cream": 6,
  "minoxidil-topical": 6
};
const clinicalReviewIds = [
  "wound-ointment",
  "chlorpheniramine-lidocaine-menthol-camphor-ointment",
  "zno-diphenhydramine-dibucaine-camphor-benzalkonium-silicone-oil"
];

test("day-05 topical sheets reference 40 valid illustrations in step order", () => {
  let total = 0;
  for (const [id, count] of Object.entries(imageCounts)) {
    const med = medications.find(item => item.id === id);
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
  assert.equal(total, 40);
});

test("unfinished topical sheets remain in clinical review", () => {
  for (const id of clinicalReviewIds) {
    const med = medications.find(item => item.id === id);
    assert.equal(med.steps[0].action["zh-TW"], "內容待填寫");
    assert.equal(med.steps[0].illustration, undefined);
    for (const lang of languages) assert.equal(videos[id][lang].status, "clinical_review");
  }
});

test("day-05 QR routes keep the selected language and only vetted videos play", () => {
  let available = 0;
  for (const id of [...Object.keys(imageCounts), ...clinicalReviewIds]) {
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
        assert.ok(["no_suitable_video", "clinical_review"].includes(entry.status));
      }
    }
  }
  assert.equal(available, 9);
  assert.equal(videos["permethrin-5"]["zh-TW"].status, "no_suitable_video");
  assert.equal(videos["adapalene-0-1-gel"]["zh-TW"].status, "no_suitable_video");
  assert.equal(videos["minoxidil-topical"]["zh-TW"].youtubeId, "S5D-E2J3Zeg");
  assert.match(videos["minoxidil-topical"]["zh-TW"].notice, /1 mL/);
});
