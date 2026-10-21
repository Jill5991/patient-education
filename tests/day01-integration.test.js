const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const medicationScript = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
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
vm.runInContext(`${medicationScript}\nglobalThis.testData = { medications: MEDICATIONS, langs: LANGS, getSheetQrUrl };`, context);

const medications = context.testData.medications;
const languages = context.testData.langs.map(item => item.code);
const videos = JSON.parse(fs.readFileSync(path.join(root, "approved-videos.json"), "utf8"));
const expectedPages = {
  "anoro-ellipta": { main: 7 },
  "spiriva-respimat": { "page-1": 6, "page-2": 6 },
  "spiolto-respimat": { "page-1": 6, "page-2": 6 },
  "onbrez-breezhaler": { main: 8 },
  "ultibro-breezhaler": { main: 8 },
  "seebri-inhalation-powder": { main: 8 },
  relenza: { "page-1": 4, "page-2": 7 },
  "duasma-hfa-200": { main: 6 },
  "flixotide-evohaler-50": { main: 6 }
};

test("day-01 sheets reference all 78 images in the correct page and step order", () => {
  let total = 0;
  for (const [id, pages] of Object.entries(expectedPages)) {
    const med = medications.find(item => item.id === id);
    assert.ok(med, id);
    for (const [pageKey, count] of Object.entries(pages)) {
      const page = pageKey === "main" ? med : med.pages[Number(pageKey.slice(5)) - 1];
      assert.equal(page.steps.length, count, `${id}/${pageKey}`);
      for (let i = 0; i < count; i++) {
        const expected = `assets/img/${id}/${pageKey === "main" ? "" : `${pageKey}/`}step-${String(i).padStart(2, "0")}.png`;
        assert.equal(page.steps[i].illustration, expected);
        const image = fs.readFileSync(path.join(root, expected));
        assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", expected);
        assert.equal(image.readUInt32BE(16), 1200, expected);
        assert.equal(image.readUInt32BE(20), 896, expected);
        total++;
      }
    }
  }
  assert.equal(total, 78);
});

test("every language QR routes to its own medication, including both sides of two-page sheets", () => {
  for (const [id, pages] of Object.entries(expectedPages)) {
    const med = medications.find(item => item.id === id);
    assert.deepEqual(Object.keys(videos[id]).sort(), [...languages].sort());
    for (const pageKey of Object.keys(pages)) {
      const page = pageKey === "main" ? med : med.pages[Number(pageKey.slice(5)) - 1];
      for (const lang of languages) {
        const qr = new URL(context.testData.getSheetQrUrl(page, lang));
        assert.equal(qr.pathname, "/patient-education/video.html");
        assert.equal(qr.searchParams.get("med"), id);
        assert.equal(qr.searchParams.get("lang"), lang);
        const entry = videos[id][lang];
        if (entry.status === "no_suitable_video") assert.equal(id, "relenza");
        else assert.match(entry.youtubeId, /^[A-Za-z0-9_-]{11}$/);
      }
    }
  }
  assert.deepEqual(
    Array.from(languages).filter(lang => videos.relenza[lang].status === "no_suitable_video").sort(),
    ["id", "th", "tl", "vi"]
  );
  assert.equal(videos.relenza.ja.startSeconds, 542);
  assert.equal(videos["duasma-hfa-200"].tl.startSeconds, 109);
});

test("Breezhaler steps distinguish piercing from inhaling", () => {
  for (const id of ["onbrez-breezhaler", "ultibro-breezhaler", "seebri-inhalation-powder"]) {
    const steps = medications.find(item => item.id === id).steps;
    assert.match(steps[3].note.en, /then release immediately/i);
    assert.match(steps[5].note.en, /do not press the side buttons while inhaling/i);
    assert.match(steps[5].action.en, /quickly and deeply/i);
    assert.match(steps[6].action.en, /up to 5 seconds/i);
  }
  assert.match(medications.find(item => item.id === "anoro-ellipta").steps[4].action.en, /3-4 seconds/);
  assert.match(medications.find(item => item.id === "relenza").pages[1].steps[4].action.en, /few seconds/);
});

async function renderVideoRoute(med, lang) {
  const source = fs.readFileSync(path.join(root, "video.html"), "utf8");
  const script = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]
    .replace(/showApprovedVideo\(\);\s*$/, "globalThis.renderPromise = showApprovedVideo();");
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { hidden: true, append(child) { this.child = child; } });
    return elements.get(id);
  };
  const page = {
    URLSearchParams,
    location: { search: `?med=${med}&lang=${lang}` },
    document: {
      documentElement: {},
      getElementById: element,
      createElement() { return {}; }
    },
    fetch: async () => ({ ok: true, json: async () => videos })
  };
  vm.createContext(page);
  vm.runInContext(script, page);
  await page.renderPromise;
  return { element, document: page.document };
}

test("video page starts the Japanese Relenza segment and explains absent videos", async () => {
  const japanese = await renderVideoRoute("relenza", "ja");
  assert.match(japanese.element("video").child.src, /\/embed\/jNMrSFGcn-I\?start=542$/);
  assert.match(japanese.element("youtube").href, /&t=542s$/);
  const indonesian = await renderVideoRoute("relenza", "id");
  assert.equal(indonesian.element("error").hidden, false);
  assert.match(indonesian.element("error").textContent, /Belum ada video/);
  assert.equal(indonesian.element("video").child, undefined);
});
