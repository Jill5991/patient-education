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
vm.runInContext(`${script}\nglobalThis.data = { meds: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);

const meds = context.data.meds;
const langs = context.data.langs.map(item => item.code);
const bow = meds.find(item => item.id === "bowklean-powder");
const gi = meds.find(item => item.id === "gi-klean-powder");

test("both bowel preparation sheets have localized actionable content and working images", () => {
  for (const med of [bow, gi]) {
    assert.ok(med.steps.length >= 6 && med.steps.length <= 8);
    assert.equal(med.pages.length, 2);
    assert.equal(med.pages[0].steps.length, 4);
    assert.equal(med.pages[1].steps.length, 3);
    assert.equal(JSON.stringify([...med.pages[0].steps, ...med.pages[1].steps]), JSON.stringify(med.steps));
    assert.ok(med.preStepsInfo);
    assert.equal(med.warnings.length, 3);
    for (const lang of langs) {
      assert.ok(med.name[lang]);
      assert.ok(med.subtitle[lang]);
      assert.ok(med.usage[lang]);
      assert.ok(med.preStepsInfo.text[lang]);
      assert.ok(med.storage.text[lang]);
      med.steps.forEach(step => {
        assert.ok(step.action[lang]);
        assert.ok(step.note[lang]);
      });
      med.warnings.forEach(warning => assert.ok(warning[lang]));
      const url = new URL(context.data.getSheetQrUrl(med, lang));
      assert.equal(url.searchParams.get("med"), med.id);
      assert.equal(url.searchParams.get("lang"), lang);
    }
    med.steps.forEach(step => {
      const file = path.join(root, step.illustration);
      assert.ok(fs.existsSync(file), file);
      assert.match(fs.readFileSync(file, "utf8"), /^<svg\b/);
    });
  }
});

test("product-specific mixing and hydration amounts cannot be swapped", () => {
  const bowText = [bow.preStepsInfo.text["zh-TW"], ...bow.steps.flatMap(step => [
    step.action["zh-TW"], step.note["zh-TW"]
  ])].join(" ");
  const giText = [gi.preStepsInfo.text["zh-TW"], ...gi.steps.flatMap(step => [
    step.action["zh-TW"], step.note["zh-TW"]
  ])].join(" ");
  assert.match(bowText, /150 mL/);
  assert.match(bowText, /至少 5 分鐘/);
  assert.match(bowText, /5 杯/);
  assert.match(bowText, /1,250 mL/);
  assert.match(bowText, /3 杯/);
  assert.match(bowText, /750 mL/);
  assert.match(giText, /1,000 mL/);
  assert.match(giText, /每 10–15 分鐘喝 250 mL/);
  assert.match(giText, /前一晚喝完前 2 包/);
  assert.match(giText, /當天早上泡剩下 2 包/);
  assert.match(giText, /檢查前至少 1 小時喝完腸見淨/);
  assert.match(giText, /鎮靜團隊要求更早禁水/);
  assert.match(gi.storage.text["zh-TW"], /2–8°C.*24 小時/);
});
