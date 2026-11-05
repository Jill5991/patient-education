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
      const expected = `assets/svg/day15-insulin/${id}/step-${String(i).padStart(2, "0")}.svg`;
      assert.equal(med.steps[i].illustration, expected);
      assert.equal(med.pages[0].steps[i].illustration, expected);
      const svg = fs.readFileSync(path.join(root, expected), "utf8");
      assert.match(svg, /<svg[^>]+viewBox="0 0 1200 900"/);
      assert.match(svg, /<title>[^<]+<\/title>/);
      total++;
    }
  }
  assert.equal(total, 38);
});

test("day-15 side B keeps correct anatomical rotation diagrams", () => {
  for (const id of Object.keys(counts)) {
    const page = context.testData.buildInjectionRotationPage(byId[id]);
    assert.equal(page.steps.length, 6);
    for (const step of page.steps) {
      assert.ok(step.illustration.startsWith("assets/img/novorapid-b/"));
      assert.ok(fs.existsSync(path.join(root, step.illustration)));
    }
    assert.match(page.steps[2].illustration, /arm_thigh_regions/);
    assert.match(page.steps[3].illustration, /one_finger_spacing/);
    assert.match(page.steps[4].illustration, /inspect_skin/);
    assert.match(page.steps[5].illustration, /palpate_skin/);
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
