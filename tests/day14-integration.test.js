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

const byId = Object.fromEntries(context.testData.medications.map(med => [med.id, med]));
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const ids = ["winstop-t28", "xin-wu-ren", "yasmin", "yaz"];
const languages = context.testData.langs.map(item => item.code);

test("day-14 sheets reference 24 valid illustrations in step order", () => {
  let count = 0;
  for (const id of ids) {
    const med = byId[id];
    assert.ok(med, id);
    assert.equal(med.steps.length, 6, id);
    for (let i = 0; i < 6; i++) {
      const expected = `assets/img/${id}/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(med.steps[i].illustration, expected);
      const bytes = fs.readFileSync(path.join(root, expected));
      assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      assert.equal(bytes.readUInt32BE(16), 1200);
      assert.equal(bytes.readUInt32BE(20), 896);
      count++;
    }
  }
  assert.equal(count, 24);
});

test("day-14 QR codes route to the correct language and package guidance", () => {
  let playable = 0, gaps = 0;
  for (const id of ids) {
    assert.deepEqual(Object.keys(videos[id]).sort(), [...languages].sort());
    for (const lang of languages) {
      const qr = new URL(context.testData.getSheetQrUrl(byId[id], lang));
      assert.equal(qr.pathname, "/patient-education/video.html");
      assert.equal(qr.searchParams.get("med"), id);
      assert.equal(qr.searchParams.get("lang"), lang);
      const video = videos[id][lang];
      if (video.youtubeId) {
        assert.match(video.youtubeId, /^[A-Za-z0-9_-]{11}$/);
        playable++;
      } else {
        assert.equal(video.status, "no_suitable_video");
        gaps++;
      }
    }
  }
  assert.equal(playable, 27);
  assert.equal(gaps, 1);
  assert.equal(videos.yaz.id.status, "no_suitable_video");
  assert.match(videos["winstop-t28"]["zh-TW"].notice, /6 顆棕色.*5 顆.*10 顆黃色.*7 顆/);
});
