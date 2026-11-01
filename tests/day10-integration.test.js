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
const counts = {
  "silver-sulfadiazine-cream": 6,
  "undecenoate-powder": 5,
  "undecenoate-cream": 5,
  "tretinoin-gel": 5,
  "tacrolimus-ointment": 5,
  "metronidazole-topical": 5,
  "ketoconazole-shampoo": 5,
  "imiquimod-warts": 5,
  "imiquimod-ak": 5,
  "econazole-cream": 5
};

test("day-10 ten sheets reference 51 valid illustrations in step order", () => {
  let total = 0;
  for (const [id, count] of Object.entries(counts)) {
    const med = medications.find(item => item.id === id);
    assert.ok(med, id);
    assert.equal(med.steps.length, count, id);
    for (let i = 0; i < count; i++) {
      const expected = `assets/img/${id}/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(med.steps[i].illustration, expected);
      const image = fs.readFileSync(path.join(root, expected));
      assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", expected);
      const redrawn = id === "silver-sulfadiazine-cream" && i >= 2 && i <= 4;
      assert.equal(image.readUInt32BE(16), redrawn ? 1448 : 1200, expected);
      assert.equal(image.readUInt32BE(20), redrawn ? 1086 : 896, expected);
      total++;
    }
  }
  assert.equal(total, 51);
});

test("day-10 seven-language QR routes reach selected videos or explicit gaps", () => {
  let available = 0;
  let gaps = 0;
  for (const id of Object.keys(counts)) {
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
  assert.equal(available, 29);
  assert.equal(gaps, 41);
  assert.equal(videos["imiquimod-warts"].vi.startSeconds, 418);
  assert.equal(videos["imiquimod-warts"].th.startSeconds, 178);
  assert.equal(videos["econazole-cream"].en.youtubeId, "NZtxtyO5C30");
  assert.equal(videos["tretinoin-gel"].ja.status, "no_suitable_video");
  assert.equal(videos["econazole-cream"].vi.status, "no_suitable_video");
});

test("imiquimod indications keep distinct directions and burn care stays individualized", () => {
  const warts = medications.find(item => item.id === "imiquimod-warts");
  const ak = medications.find(item => item.id === "imiquimod-ak");
  assert.match(warts.steps[4].action["zh-TW"], /每週固定 3 晚/);
  assert.match(ak.steps[4].note["zh-TW"], /尖銳濕疣不同/);
  const burn = medications.find(item => item.id === "silver-sulfadiazine-cream");
  assert.match(burn.steps[2].note["zh-TW"], /燒傷團隊指示/);
  assert.match(videos["silver-sulfadiazine-cream"].en.notice, /burn team/);
});
