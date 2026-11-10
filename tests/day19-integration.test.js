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
  "nicorette-freshmint-gum": 5, "nicotinell-tts-patch": 5,
  "nicotine-inhaler": 5, "niquitin-mint-lozenge": 5,
  "nicorette-quickmist": 7, "bupropion-sr": 5,
  "varenicline-champix": 5
};

test("day 19 sheets use 37 reviewed illustrations and compact delivery copies", () => {
  let total = 0;
  for (const [id, count] of Object.entries(counts)) {
    const med = byId[id];
    assert.equal(med.steps.length, count, id);
    med.steps.forEach((step, i) => {
      const expected = `assets/img/day19-smoking/${id}/main/step-${String(i).padStart(2, "0")}.png`;
      assert.equal(step.illustration, expected);
      const png = fs.readFileSync(path.join(root, expected));
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      const webp = fs.readFileSync(path.join(root, expected.replace(/\.png$/, ".webp")));
      assert.equal(webp.subarray(8, 12).toString(), "WEBP");
      total++;
    });
  }
  assert.equal(total, 37);
});

test("bupropion, patch, and lozenge directions agree with reviewed product guidance", () => {
  for (const { code } of context.data.langs) {
    const b = byId["bupropion-sr"].steps;
    assert.match(b[0].action[code], /3|๓/);
    assert.match(b[1].action[code], /4|๔/);
    const p = byId["nicotinell-tts-patch"].steps;
    assert.match(p[2].action[code], /10/);
    assert.match(p[2].action[code], /20/);
  }
  const lozenge = byId["niquitin-mint-lozenge"].steps[4];
  assert.match(lozenge.action["zh-TW"], /完全溶解/);
  assert.doesNotMatch(lozenge.action.en, /Swallow/);
});

test("day 19 video routing covers seven languages with explicit gaps", () => {
  const langs = context.data.langs.map(lang => lang.code);
  let selected = 0;
  for (const id of Object.keys(counts)) {
    assert.deepEqual(Object.keys(videos[id]).sort(), [...langs].sort());
    for (const lang of langs) {
      const qr = new URL(context.data.getSheetQrUrl(byId[id], lang));
      assert.equal(qr.searchParams.get("med"), id);
      assert.equal(qr.searchParams.get("lang"), lang);
      const entry = videos[id][lang];
      if (entry.status === "no_suitable_video") assert.equal(entry.youtubeId, undefined);
      else { assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/); selected++; }
    }
  }
  assert.equal(selected, 22);
});
