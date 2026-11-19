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

test("day 20 and 21 link 38 reviewed images with fast WebP copies", () => {
  const cases = [
    ["nitrostat", "day20-ntg", [5]],
    ["berodual-n", "day20-ntg", [6]],
    ["berotec-n", "day20-ntg", [6]],
    ["home-blood-pressure-kit", "day21-other", [6, 8, 7]]
  ];
  let total = 0;
  for (const [id, day, counts] of cases) {
    const med = byId[id];
    const pages = med.pages || [{ steps: med.steps }];
    assert.equal(pages.length, counts.length, id);
    pages.forEach((page, p) => {
      assert.equal(page.steps.length, counts[p], `${id} page ${p + 1}`);
      page.steps.forEach((step, i) => {
        const key = med.pages ? `page-${p + 1}` : "main";
        const expected = `assets/img/${day}/${id}/${key}/step-${String(i).padStart(2, "0")}.png`;
        assert.equal(step.illustration, expected);
        assert.equal(fs.readFileSync(path.join(root, expected)).subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert.equal(fs.readFileSync(path.join(root, expected.replace(/\.png$/, ".webp"))).subarray(8, 12).toString(), "WEBP");
        total++;
      });
    });
  }
  assert.equal(total, 38);
});

test("emergency timing is correct in every language", () => {
  for (const { code } of context.data.langs) {
    const nitro = byId.nitrostat.steps[3];
    assert.match(nitro.action[code], /5/);
    assert.match(nitro.action[code], /119/);
    assert.match(nitro.note[code], /3/);
    const berotec = byId["berotec-n"].steps[5];
    assert.match(berotec.action[code], /5/);
    assert.doesNotMatch(berotec.action[code], /30/);
  }
});

test("four new QR routes cover seven languages and gaps are explicit", () => {
  const ids = ["nitrostat", "berodual-n", "berotec-n", "home-blood-pressure-kit"];
  const langs = context.data.langs.map(lang => lang.code);
  for (const id of ids) {
    assert.deepEqual(Object.keys(videos[id]).sort(), [...langs].sort());
    for (const lang of langs) {
      const url = new URL(context.data.getSheetQrUrl(byId[id], lang));
      assert.equal(url.searchParams.get("med"), id);
      assert.equal(url.searchParams.get("lang"), lang);
      const entry = videos[id][lang];
      if (entry.status === "no_suitable_video") assert.equal(entry.youtubeId, undefined);
      else assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
    }
  }
  assert.equal(videos.nitrostat.vi.status, "no_suitable_video");
});

test("rescue advice reflects current asthma care and manufacturer phase-out", () => {
  for (const med of context.data.medications) {
    if (med.id === "berotec-n") continue;
    const advice = JSON.stringify([med.preStepsInfo?.text, med.warnings]);
    assert.doesNotMatch(advice, /Berotec-N/, med.id);
  }
  for (const code of context.data.langs.map(lang => lang.code)) {
    const berotecWarnings = byId["berotec-n"].warnings.map(warning => warning[code]);
    const berodualWarnings = byId["berodual-n"].warnings.map(warning => warning[code]);
    assert.ok(berotecWarnings.length >= 5);
    assert.ok(berodualWarnings.length >= 4);
    assert.ok(berotecWarnings.every(Boolean));
    assert.ok(berodualWarnings.every(Boolean));
  }
  assert.match(byId["berotec-n"].warnings[0].en, /ICS-containing/);
  assert.match(byId["berotec-n"].warnings[1].en, /phase-out/);
  assert.match(byId["berodual-n"].warnings[1].en, /phase-out/);
});
