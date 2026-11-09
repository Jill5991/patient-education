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
vm.runInContext(`${script}\nglobalThis.data = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);
const byId = Object.fromEntries(context.data.medications.map(med => [med.id, med]));
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const counts = {
  ozempic: [8, 4], mounjaro: [8, 4], soliqua: [8, 6],
  avamys: [7], azetin: [6], besonin: [6], minirin: [5],
  natesto: [4, 8], "saline-nasal-rinse-kit": [6, 6, 8],
  nasonex: [6], sindecon: [6], trisonin: [6]
};

test("day 17 and 18 map 112 readable illustrations and WebP delivery copies", () => {
  let total = 0;
  for (const [id, pageCounts] of Object.entries(counts)) {
    const med = byId[id];
    const pages = med.pages || [{ steps: med.steps }];
    assert.equal(pages.length, pageCounts.length, id);
    pages.forEach((page, pi) => {
      assert.equal(page.steps.length, pageCounts[pi], id);
      page.steps.forEach((step, i) => {
        const day = ["ozempic", "mounjaro", "soliqua"].includes(id) ? "day17-injections" : "day18-nasal";
        const pageKey = med.pages ? `page-${pi + 1}` : "main";
        const expected = `assets/img/${day}/${id}/${pageKey}/step-${String(i).padStart(2, "0")}.png`;
        assert.equal(step.illustration, expected);
        if (pi === 0 && med.steps) assert.equal(med.steps[i].illustration, expected);
        const png = fs.readFileSync(path.join(root, expected));
        assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        const webp = fs.readFileSync(path.join(root, expected.replace(/\.png$/, ".webp")));
        assert.equal(webp.subarray(8, 12).toString(), "WEBP");
        total++;
      });
    });
  }
  assert.equal(total, 112);
});

test("corrected needle and spacing guidance survives in seven languages", () => {
  for (const id of ["ozempic", "mounjaro", "soliqua"]) {
    const med = byId[id];
    for (const { code } of context.data.langs) {
      assert.ok(med.pages[0].steps[1].note[code].length > 30, `${id} ${code}`);
    }
    assert.match(med.pages[0].steps[1].note["zh-TW"], /對正藥匣端，旋轉裝緊/);
    const spacingIndex = id === "soliqua" ? 3 : 1;
    assert.match(med.pages[1].steps[spacingIndex].note["zh-TW"], /1\.5–2 公分/);
    const corrected = fs.readFileSync(path.join(root, med.pages[1].steps[spacingIndex].illustration));
    const source = fs.readFileSync(path.join(root, "assets/img/day15-insulin/rotation/step-03.png"));
    assert.ok(corrected.equals(source), id);
  }
});

test("all language QR links resolve to selected videos or explicit gaps", () => {
  const langs = context.data.langs.map(lang => lang.code);
  for (const id of Object.keys(counts)) {
    assert.deepEqual(Object.keys(videos[id]).sort(), [...langs].sort());
    const med = byId[id];
    for (const lang of langs) {
      for (const page of med.pages || [med]) {
        const qr = new URL(context.data.getSheetQrUrl(page, lang));
        assert.equal(qr.searchParams.get("med"), id);
        assert.equal(qr.searchParams.get("lang"), lang);
      }
      const entry = videos[id][lang];
      if (entry.status === "no_suitable_video") assert.equal(entry.youtubeId, undefined);
      else assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
    }
  }
  assert.equal(videos.soliqua["zh-TW"].status, "no_suitable_video");
  assert.equal(videos.azetin["zh-TW"].status, "no_suitable_video");
  assert.equal(videos.sindecon["zh-TW"].status, "no_suitable_video");
});
