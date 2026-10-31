const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(body => body.includes("const MEDICATIONS"));
const context = {
  URL, URLSearchParams, console,
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  QRCode: function QRCode() {}
};
vm.createContext(context);
vm.runInContext(`${script}\nglobalThis.data = { medications: MEDICATIONS, langs: LANGS };`, context);
const { medications, langs } = context.data;
const languages = langs.map(lang => lang.code);
const ssd = medications.find(item => item.id === "silver-sulfadiazine-cream");
const gi = medications.find(item => item.id === "acute-gi-care-kit");
const oral = medications.find(item => item.id === "pediatric-oral-admin");

test("silver sulfadiazine directions are complete in every language", () => {
  assert.equal(ssd.steps.length, 6);
  for (const lang of languages) {
    assert.ok(ssd.usage[lang]);
    assert.ok(ssd.preStepsInfo.text[lang]);
    assert.ok(ssd.storage.text[lang]);
    for (const step of ssd.steps) {
      assert.ok(step.action[lang]);
      if (step.note) assert.ok(step.note[lang]);
    }
    const content = [ssd.usage[lang], ssd.preStepsInfo.text[lang],
      ...ssd.steps.flatMap(step => [step.action[lang], step.note?.[lang] || ""]),
      ssd.storage.text[lang]].join(" ");
    assert.doesNotMatch(content, /1[.,]5\s*(?:mm|毫米|มม)/i, lang);
    assert.doesNotMatch(content, /20[–-]25\s*°C|hydrotherapy|hidroterapi|thủy trị liệu|ハイドロセラピー/i, lang);
    assert.ok(ssd.usage[lang].length > 10, lang);
  }
  assert.match(ssd.steps[0].action["zh-TW"], /依指示戴/);
  assert.match(ssd.steps[2].note["zh-TW"], /依藥袋或燒傷團隊指示/);
  assert.match(ssd.steps[3].action["zh-TW"], /按醫囑使用敷料/);
});

test("prior oral swallowing and GI revisions remain translated", () => {
  const swallow = oral.steps.find(step => step.action["zh-TW"].includes("會吞錠的孩子"));
  for (const lang of languages) {
    assert.ok(swallow.note[lang], lang);
    assert.match(swallow.note[lang], /水|water|air|nước|น้ำ|tubig/i, lang);
    assert.match(gi.pages[2].steps[1].action[lang], /1[.,]000/, lang);
    assert.match(gi.pages[2].steps[2].action[lang], /6/, lang);
    assert.match(gi.pages[2].steps[3].action[lang], /2[.,]5/, lang);
    assert.match(gi.pages[3].steps[1].action[lang], /loperamide/i, lang);
    assert.match(gi.pages[4].steps[3].note[lang], /5[.,]000.*30.*1[.,]000/s, lang);
    assert.match(gi.pages[4].storage.text[lang], /20.*1[.,]000.*100.*1[.,]000/s, lang);
  }
  assert.doesNotMatch(html, /洛哌丁胺|โลเพอราไมด์|ロペラミド/);
  assert.match(swallow.note["zh-TW"], /自然正中.*微微前傾或稍微後仰.*不要把頭大幅往後仰/);
});
