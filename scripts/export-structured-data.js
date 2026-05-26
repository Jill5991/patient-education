#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "index.html");
const OUT_DIR = path.join(ROOT, "exports");
const FULL_JSON = path.join(OUT_DIR, "medication-sheets-structured.json");
const STEP_JSONL = path.join(OUT_DIR, "gemini-illustration-briefs.jsonl");

const LANGUAGE_CODES = ["zh-TW", "en", "id", "vi", "th", "tl", "ja"];

function extractInlineScript(html) {
  const matches = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  const script = matches.map((m) => m[1]).find((body) => body.includes("const MEDICATIONS"));
  if (!script) throw new Error("Could not find inline script containing MEDICATIONS.");
  return script;
}

function evaluateMedicationData(script) {
  const context = {
    console,
    Date,
    JSON,
    Math,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    window: { addEventListener() {} },
    document: {
      getElementById() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; }
    },
    QRCode: function QRCode() {}
  };
  context.globalThis = context;
  vm.createContext(context);
  const exportScript = `${script}

MEDICATIONS.forEach((m) => { m.category = inferCategory(m); });
globalThis.__MED_EXPORT__ = {
  medications: MEDICATIONS,
  languages: LANGS,
  categories: CATEGORY_META
};`;
  vm.runInContext(exportScript, context, { filename: SOURCE });
  return context.__MED_EXPORT__;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function pick(value, lang = "zh-TW") {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value[lang] || value.en || value["zh-TW"] || "";
  return String(value);
}

function normalizeLocalized(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    return Object.fromEntries(LANGUAGE_CODES.map((code) => [code, code === "zh-TW" ? value : ""]));
  }
  if (typeof value !== "object") return value;
  const out = {};
  LANGUAGE_CODES.forEach((code) => {
    out[code] = value[code] || value.en || value["zh-TW"] || "";
  });
  return out;
}

function normalizeIllustration(illustration) {
  if (!illustration) return { src: "", alt: null };
  if (typeof illustration === "string") return { src: illustration, alt: null };
  return {
    src: illustration.src || "",
    alt: normalizeLocalized(illustration.alt)
  };
}

function normalizeInfoBox(box) {
  if (!box) return null;
  return {
    title: normalizeLocalized(box.title),
    text: normalizeLocalized(box.text),
    html: normalizeLocalized(box.html),
    tone: clone(box.tone || null)
  };
}

function normalizeWarning(warning, index) {
  return {
    index,
    text: normalizeLocalized(warning),
    highlight: !!(warning && typeof warning === "object" && warning.highlight)
  };
}

function normalizeStep(step, index) {
  return {
    index,
    section: normalizeLocalized(step.section),
    action: normalizeLocalized(step.action),
    note: normalizeLocalized(step.note),
    highlight: !!step.highlight,
    illustration: normalizeIllustration(step.illustration),
    afterBox: normalizeInfoBox(step.afterBox)
  };
}

function renderPages(med) {
  if (!Array.isArray(med.pages) || !med.pages.length) {
    return [{
      pageIndex: 0,
      pageKey: "main",
      data: med
    }];
  }
  return med.pages.map((page, pageIndex) => ({
    pageIndex,
    pageKey: `page-${pageIndex + 1}`,
    data: {
      ...med,
      ...page,
      id: med.id,
      name: med.name,
      subtitle: med.subtitle,
      headerBadge: page.headerBadge || med.headerBadge,
      color: med.color,
      category: med.category,
      pages: undefined
    }
  }));
}

function normalizeMedication(med, categoryMeta) {
  const pages = renderPages(med).map(({ pageIndex, pageKey, data }) => ({
    pageIndex,
    pageKey,
    pageLabel: normalizeLocalized(data.pageLabel),
    headerBadge: normalizeLocalized(data.headerBadge),
    badge: normalizeLocalized(data.badge),
    usage: normalizeLocalized(data.usage),
    preStepsInfo: normalizeInfoBox(data.preStepsInfo),
    steps: (data.steps || []).map(normalizeStep),
    infoBoxes: (data.infoBoxes || []).map(normalizeInfoBox),
    storage: normalizeInfoBox(data.storage),
    warnings: (data.warnings || []).map(normalizeWarning),
    qrUrl: data.qrUrl || ""
  }));

  return {
    id: med.id,
    category: med.category || "",
    categoryLabel: normalizeLocalized(categoryMeta[med.category] && categoryMeta[med.category].label),
    emergency: !!med.emergency,
    emergencyLabel: normalizeLocalized(med.emergencyLabel),
    name: normalizeLocalized(med.name),
    subtitle: normalizeLocalized(med.subtitle),
    headerBadge: normalizeLocalized(med.headerBadge),
    badge: normalizeLocalized(med.badge),
    usage: normalizeLocalized(med.usage),
    color: clone(med.color || null),
    qrUrl: med.qrUrl || "",
    pages
  };
}

function makePromptSeed(med, page, step) {
  const sheetName = pick(med.name);
  const pageLabel = pick(page.pageLabel);
  const action = pick(step.action);
  const note = pick(step.note);
  const category = pick(med.categoryLabel);
  return [
    "建立一張病人衛教用插圖。",
    `單張：${sheetName}`,
    pageLabel ? `頁面：${pageLabel}` : "",
    category ? `分類：${category}` : "",
    `主要動作：${action}`,
    note ? `補充重點：${note}` : "",
    "風格：簡潔、扁平向量、白底、無品牌 logo、不要在圖片內放文字。",
    "目標：讓健康識能低的病人只看圖也能理解主要動作。",
    "避免：不要畫出與步驟相反或危險的操作。"
  ].filter(Boolean).join("\n");
}

function buildStepBriefs(medications) {
  const rows = [];
  medications.forEach((med) => {
    med.pages.forEach((page) => {
      page.steps.forEach((step) => {
        rows.push({
          sheetId: med.id,
          sheetName: med.name,
          category: med.category,
          categoryLabel: med.categoryLabel,
          pageIndex: page.pageIndex,
          pageKey: page.pageKey,
          pageLabel: page.pageLabel,
          stepIndex: step.index,
          section: step.section,
          action: step.action,
          note: step.note,
          highlight: step.highlight,
          currentIllustration: step.illustration,
          afterBox: step.afterBox,
          geminiPromptSeedZh: makePromptSeed(med, page, step)
        });
      });
    });
  });
  return rows;
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "uncategorized";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const html = fs.readFileSync(SOURCE, "utf8");
  const script = extractInlineScript(html);
  const exported = evaluateMedicationData(script);

  const medications = exported.medications.map((med) => normalizeMedication(med, exported.categories));
  const stepBriefs = buildStepBriefs(medications);
  const pageCount = medications.reduce((sum, med) => sum + med.pages.length, 0);
  const warningCount = medications.reduce(
    (sum, med) => sum + med.pages.reduce((pageSum, page) => pageSum + page.warnings.length, 0),
    0
  );
  const illustrationRefs = new Set(stepBriefs.map((row) => row.currentIllustration.src).filter(Boolean));

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.relative(ROOT, SOURCE),
    languages: exported.languages,
    totals: {
      medications: medications.length,
      pages: pageCount,
      steps: stepBriefs.length,
      warnings: warningCount,
      uniqueIllustrationRefs: illustrationRefs.size,
      categories: countBy(medications, (med) => med.category)
    },
    medications
  };

  fs.writeFileSync(FULL_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(STEP_JSONL, stepBriefs.map((row) => JSON.stringify(row)).join("\n") + "\n");

  console.log(`Wrote ${path.relative(ROOT, FULL_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, STEP_JSONL)}`);
  console.log(JSON.stringify(payload.totals, null, 2));
}

main();
