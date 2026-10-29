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
vm.runInContext(`${script}\nglobalThis.testData = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);

const medications = context.testData.medications;
const languages = context.testData.langs.map(item => item.code);
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const pages = {
  kocel: { main: 5 },
  "chalian-kalimate": { main: 5 },
  "acute-gi-care-kit": { "page-1": 6, "page-2": 6, "page-3": 6, "page-4": 6, "page-5": 6 },
  "pediatric-oral-admin": { main: 8 },
  "no-crush-evidence": { main: 7 }
};

test("day-08 nine pages reference 55 valid illustrations in step order", () => {
  let total = 0;
  for (const [id, pageCounts] of Object.entries(pages)) {
    const med = medications.find(item => item.id === id);
    assert.ok(med, id);
    for (const [pageKey, count] of Object.entries(pageCounts)) {
      const page = pageKey === "main" ? med : med.pages[Number(pageKey.slice(5)) - 1];
      assert.equal(page.steps.length, count, `${id}/${pageKey}`);
      for (let i = 0; i < count; i++) {
        const expected = `assets/img/${id}/${pageKey === "main" ? "" : `${pageKey}/`}step-${String(i).padStart(2, "0")}.png`;
        assert.equal(page.steps[i].illustration, expected);
        const image = fs.readFileSync(path.join(root, expected));
        assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", expected);
        const dimensions = id === "acute-gi-care-kit" && pageKey === "page-3" && i === 4
          ? [1448, 1086] : [1200, 896];
        assert.equal(image.readUInt32BE(16), dimensions[0], expected);
        assert.equal(image.readUInt32BE(20), dimensions[1], expected);
        total++;
      }
    }
  }
  assert.equal(total, 55);
});

test("day-08 QR routes keep all seven languages and video gaps are explicit", () => {
  let available = 0;
  let gaps = 0;
  for (const [id, pageCounts] of Object.entries(pages)) {
    const med = medications.find(item => item.id === id);
    assert.deepEqual(Object.keys(videos[id]).sort(), [...languages].sort());
    for (const pageKey of Object.keys(pageCounts)) {
      const page = pageKey === "main" ? med : med.pages[Number(pageKey.slice(5)) - 1];
      for (const lang of languages) {
        const qr = new URL(context.testData.getSheetQrUrl(page, lang));
        assert.equal(qr.pathname, "/patient-education/video.html");
        assert.equal(qr.searchParams.get("med"), id);
        assert.equal(qr.searchParams.get("lang"), lang);
      }
    }
    for (const lang of languages) {
      const entry = videos[id][lang];
      if (entry.youtubeId) {
        assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
        available++;
      } else {
        assert.equal(entry.status, "no_suitable_video");
        gaps++;
      }
    }
  }
  assert.equal(available, 27);
  assert.equal(gaps, 8);
  assert.equal(videos["chalian-kalimate"].en.status, "no_suitable_video");
  const videoHtml = fs.readFileSync(path.join(root, "video.html"), "utf8");
  assert.match(videoHtml, /沒有適合這份單張與語言的衛教影片/);
});

test("homemade rehydration steps use measured quantities without taste checking", () => {
  const steps = medications.find(item => item.id === "acute-gi-care-kit").pages[2].steps;
  assert.match(steps[2].action["zh-TW"], /6 平匙/);
  assert.match(steps[3].action["zh-TW"], /2\.5 mL 量匙/);
  assert.match(steps[4].note["zh-TW"], /不要靠味道判斷/);
  assert.doesNotMatch(steps[4].note["zh-TW"], /像眼淚/);
});
