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
vm.runInContext(`${script}\nglobalThis.day16 = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);
const byId = Object.fromEntries(context.day16.medications.map(med => [med.id, med]));
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const counts = { levemir: [7, 6], toujeo: [8, 6], tresiba: [8, 6], victoza: [8, 4], trulicity: [8, 4] };
const languages = context.day16.langs.map(lang => lang.code);

test("day-16 images match both pages and all local PNGs are readable", () => {
  let total = 0;
  for (const [id, pageCounts] of Object.entries(counts)) {
    const med = byId[id];
    assert.equal(med.pages.length, 2);
    med.pages.forEach((page, pageIndex) => {
      assert.equal(page.steps.length, pageCounts[pageIndex]);
      page.steps.forEach((step, i) => {
        const expected = `assets/img/day16-injections/${id}/page-${pageIndex + 1}/step-${String(i).padStart(2, "0")}.png`;
        assert.equal(step.illustration, expected);
        if (pageIndex === 0) assert.equal(med.steps[i].illustration, expected);
        const png = fs.readFileSync(path.join(root, expected));
        assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert.ok(png.readUInt32BE(16) >= 800);
        assert.ok(png.readUInt32BE(20) >= 800);
        total++;
      });
    });
  }
  assert.equal(total, 65);
});

test("needle and rotation instructions retain reviewed directions", () => {
  for (const id of ["levemir", "toujeo", "tresiba", "victoza"]) {
    assert.match(byId[id].pages[0].steps[1].note["zh-TW"], /對正藥匣端，旋轉裝緊/);
  }
  for (const id of ["levemir", "toujeo", "tresiba"]) {
    assert.match(byId[id].pages[1].steps[1].note["zh-TW"], /約 7 天後換下一區塊/);
    assert.match(byId[id].pages[1].steps[3].note["zh-TW"], /1\.5–2 公分/);
  }
  for (const id of ["victoza", "trulicity"]) {
    assert.match(byId[id].pages[1].steps[1].note["zh-TW"], /1\.5–2 公分/);
  }
  assert.doesNotMatch(byId.trulicity.pages[0].steps.map(step => step.action["zh-TW"]).join(" "), /裝.*針頭/);
});

test("seven-language QR video routing has explicit unavailable entries", () => {
  for (const id of Object.keys(counts)) {
    assert.deepEqual(Object.keys(videos[id]).sort(), [...languages].sort());
    for (const lang of languages) {
      for (const page of byId[id].pages) {
        const qr = new URL(context.day16.getSheetQrUrl(page, lang));
        assert.equal(qr.searchParams.get("med"), id);
        assert.equal(qr.searchParams.get("lang"), lang);
      }
      const entry = videos[id][lang];
      if (entry.status === "no_suitable_video") assert.equal(entry.youtubeId, undefined);
      else assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
    }
  }
});
