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
vm.runInContext(`${script}\nglobalThis.testData = { medications: MEDICATIONS, langs: LANGS };`, context);

const { medications, langs } = context.testData;
const sheet = medications.find(item => item.id === "acute-gi-care-kit");

test("acute GI care keeps five complete translated sides", () => {
  assert.equal(sheet.pages.length, 5);
  const languages = langs.map(item => item.code);
  for (const page of sheet.pages) {
    assert.ok(page.steps.length > 0 && page.steps.length <= 8);
    for (const lang of languages) {
      assert.ok(page.pageLabel[lang]);
      assert.ok(page.usage[lang]);
      for (const step of page.steps) {
        assert.ok(step.action[lang]);
        assert.ok(step.note[lang]);
      }
      assert.ok(page.storage.text[lang]);
      for (const warning of page.warnings) assert.ok(warning[lang]);
    }
  }
});

test("homemade sugar-salt drink uses one measurable recipe", () => {
  const page = sheet.pages[2];
  assert.match(page.steps[1].action["zh-TW"], /1,000 mL/);
  assert.match(page.steps[2].action["zh-TW"], /6 平匙（5 mL 量匙）/);
  assert.match(page.steps[3].action["zh-TW"], /1 平匙（2\.5 mL 量匙）/);
  for (const step of page.steps) {
    for (const lang of langs.map(item => item.code)) {
      assert.doesNotMatch(step.action[lang], /25 g|2\.5 g/);
      assert.doesNotMatch(step.note[lang], /25 g|2\.5 g/);
    }
  }
  assert.doesNotMatch(page.steps[4].note["zh-TW"], /眼淚/);
  assert.match(page.storage.text["zh-TW"], /明顯脫水.*請立即就醫/);
});

test("urgent triage, medicine limits, and disinfection times stay visible", () => {
  assert.match(sheet.pages[0].steps[0].note["zh-TW"], /暈厥.*立即急診/);
  assert.match(sheet.pages[1].steps[2].note["zh-TW"], /已有脫水徵象者須就醫評估/);
  assert.match(sheet.pages[3].steps[1].note["zh-TW"], /未滿 18 歲.*不要用loperamide/);
  assert.match(sheet.pages[4].steps[3].note["zh-TW"], /5,000 ppm.*30 分鐘/);
  assert.match(sheet.pages[4].storage.text["zh-TW"], /20 mL.*1,000 mL.*100 mL.*1,000 mL/);
});
