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
  "crotamiton-hydrocortisone": 5,
  "benzyl-benzoate-25-lotion": 6,
  "lindane-scabi": 5,
  "duofilm-solution": 5,
  "zinc-oxide-ointment": 5,
  "ivermectin-cream": 5,
  "cb-ointment": 6,
  "sinbaby-lotion": 6,
  "exelderm-solution": 6,
  "fentanyl-patch": 7
};

test("day-11 sheets reference 56 valid step illustrations", () => {
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
  assert.equal(total, 56);
});

test("day-11 seven-language QR routes include 12 videos and explicit gaps", () => {
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
  assert.equal(available, 12);
  assert.equal(gaps, 58);
  assert.equal(videos["fentanyl-patch"].ja.status, "no_suitable_video");
  assert.equal(videos["benzyl-benzoate-25-lotion"]["zh-TW"].status, "no_suitable_video");
  assert.match(videos["duofilm-solution"].tl.notice, /isang beses araw-araw/);
});

test("fentanyl and lindane directions retain their safety critical timing", () => {
  const fentanyl = medications.find(item => item.id === "fentanyl-patch");
  assert.match(fentanyl.steps[6].action["zh-TW"], /72 小時/);
  assert.match(fentanyl.steps[0].note["zh-TW"], /兒童和寵物/);
  const lindane = medications.find(item => item.id === "lindane-scabi");
  assert.match(lindane.steps[2].action["zh-TW"], /8–12 小時/);
  assert.match(lindane.steps[2].note["zh-TW"], /不要超過 12 小時/);
});
