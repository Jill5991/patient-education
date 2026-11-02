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

const medications = context.testData.medications;
const languages = context.testData.langs.map(item => item.code);
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const counts = {
  "exelon-patch": 7,
  "flurbiprofen-patch": 5,
  "lidopat-patch": 6,
  "neupro-patch": 7,
  "granisetron-patch": 6,
  "sovenor-patch": 7
};

test("day-12 six patch sheets reference 38 valid illustrations", () => {
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
      assert.equal(image.readUInt32BE(16), 1200, expected);
      assert.equal(image.readUInt32BE(20), 896, expected);
      total++;
    }
  }
  assert.equal(total, 38);
});

test("day-12 seven-language QR routes include 13 videos and explicit gaps", () => {
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
  assert.equal(available, 13);
  assert.equal(gaps, 29);
  assert.equal(videos["neupro-patch"].en.status, "no_suitable_video");
  assert.match(videos["flurbiprofen-patch"]["zh-TW"].notice, /菲比/);
  assert.match(videos["lidopat-patch"]["zh-TW"].notice, /遠疼/);
});

test("patch timing and removal directions remain distinct", () => {
  const find = id => medications.find(item => item.id === id);
  assert.match(find("exelon-patch").steps[5].action["zh-TW"], /24 小時/);
  assert.match(find("lidopat-patch").steps[4].action["zh-TW"], /12 小時/);
  assert.match(find("neupro-patch").steps[5].action["zh-TW"], /每天同一時間/);
  assert.match(find("granisetron-patch").steps[5].note["zh-TW"], /7 天/);
  assert.match(find("sovenor-patch").steps[5].action["zh-TW"], /7 天/);
});
