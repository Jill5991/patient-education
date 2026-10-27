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
  eyedrops: 5,
  "eye-drops-special": 8,
  "eye-ointment": 8,
  "ear-drops-special": 8
};

test("day-06 eye and ear sheets reference 29 valid illustrations in step order", () => {
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
  assert.equal(total, 29);
});

test("day-06 seven-language QR routes lead to vetted video entries or explicit gaps", () => {
  let available = 0;
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
      }
    }
  }
  assert.equal(available, 16);
  assert.equal(videos["eyedrops"]["zh-TW"].youtubeId, videos["eye-ointment"]["zh-TW"].youtubeId);
  assert.equal(videos["ear-drops-special"].tl.status, "no_suitable_video");
});

test("ear-drop step 5 text matches pressing the tragus in every language", () => {
  const step = medications.find(item => item.id === "ear-drops-special").steps[4];
  for (const lang of languages) assert.ok(step.note[lang]);
  assert.match(step.note["zh-TW"], /輕按耳珠/);
  assert.match(step.note.en, /press the tragus/);
  assert.doesNotMatch(step.note["zh-TW"], /輕拉耳垂/);
});
