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
vm.runInContext(`${script}\nglobalThis.testData = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl, buildInjectionRotationPage };`, context);
const byId = Object.fromEntries(context.testData.medications.map(med => [med.id, med]));
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const counts = { novorapid: 7, apidra: 7, "novomix-30": 8, "humalog-mix50": 8, ryzodeg: 8 };
const languages = context.testData.langs.map(item => item.code);

test("day-15 five insulin pens use reviewed art in all 38 steps", () => {
  let total = 0;
  for (const [id, count] of Object.entries(counts)) {
    const med = byId[id];
    assert.equal(med.steps.length, count);
    for (let i = 0; i < count; i++) {
      const expected = `assets/img/day15-insulin/${id}/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(med.steps[i].illustration, expected);
      assert.equal(med.pages[0].steps[i].illustration, expected);
      const png = fs.readFileSync(path.join(root, expected));
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      assert.ok(png.readUInt32BE(16) >= 800);
      assert.ok(png.readUInt32BE(20) >= 800);
      total++;
    }
  }
  assert.equal(total, 38);
});

test("day-15 side B keeps correct anatomical rotation diagrams", () => {
  for (const id of Object.keys(counts)) {
    const page = byId[id].pages[1];
    assert.equal(page.steps.length, 6);
    for (let i = 0; i < 6; i++) {
      const expected = `assets/img/day15-insulin/rotation/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(page.steps[i].illustration, expected);
      const png = fs.readFileSync(path.join(root, expected));
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    }
  }
});

test("day-15 QR routes preserve all seven languages and general-video notice", () => {
  for (const id of Object.keys(counts)) {
    assert.deepEqual(Object.keys(videos[id]).sort(), [...languages].sort());
    for (const lang of languages) {
      const qr = new URL(context.testData.getSheetQrUrl(byId[id], lang));
      assert.equal(qr.pathname, "/patient-education/video.html");
      assert.equal(qr.searchParams.get("med"), id);
      assert.equal(qr.searchParams.get("lang"), lang);
      assert.equal(new URL(context.testData.getSheetQrUrl(byId[id].pages[0], lang)).searchParams.get("med"), id);
      assert.equal(new URL(context.testData.getSheetQrUrl(byId[id].pages[1], lang)).searchParams.get("med"), id);
      assert.match(videos[id][lang].youtubeId, /^[A-Za-z0-9_-]{11}$/);
      assert.ok(videos[id][lang].notice.length > 20);
    }
  }
});

test("day-15 needle attachment and rotation directions match Taiwan guidance in seven languages", () => {
  for (const [id, count] of Object.entries(counts)) {
    const med = byId[id];
    const needleIndex = count === 7 ? 1 : 2;
    for (const lang of languages) {
      assert.ok(med.steps[needleIndex].note[lang].length > 20);
      assert.equal(med.steps[needleIndex].note[lang], med.pages[0].steps[needleIndex].note[lang]);
      for (const i of [1, 2, 3]) {
        assert.ok(med.pages[1].steps[i].note[lang].length > 15);
      }
      assert.ok(med.pages[1].steps[3].action[lang].length > 8);
    }
    assert.match(med.steps[needleIndex].note["zh-TW"], /對正藥匣端，旋轉裝緊/);
    assert.match(med.pages[1].steps[1].note["zh-TW"], /約 7 天後換下一區塊/);
    assert.match(med.pages[1].steps[2].note["zh-TW"], /前外側上 1\/3/);
    assert.match(med.pages[1].steps[3].action["zh-TW"], /約隔 1 指寬/);
    assert.match(med.pages[1].steps[3].note["zh-TW"], /1\.5–2 公分/);
  }
});
