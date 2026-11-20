const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const configScript = fs.readFileSync(path.join(root, "pharmacy-config.js"), "utf8");
const appScript = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(body => body.includes("const MEDICATIONS"));

const context = {
  URL,
  URLSearchParams,
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  QRCode: function QRCode() {}
};
vm.createContext(context);
vm.runInContext(configScript, context);
vm.runInContext(appScript, context);

test("footer branding comes from the registered pharmacy", () => {
  const pharmacy = vm.runInContext('resolvePharmacy("", window.PHARMACY_CONFIG)', context);
  assert.equal(pharmacy.name, "佳禾藥局");
  assert.equal(pharmacy.phone, "03-482-7805");
  vm.runInContext('selectedPharmacy = resolvePharmacy("", window.PHARMACY_CONFIG)', context);
  const footer = vm.runInContext(`renderReferenceSheet(
    { steps: [], warnings: [], name: { "zh-TW": "測試藥品" } },
    { main: "#000", light: "#fff", dark: "#000" },
    key => key === "name" ? "測試藥品" : "",
    key => key,
    value => typeof value === "string" ? value : ""
  )`, context);
  assert.match(footer, /佳禾藥局.*03-482-7805/);
  assert.doesNotMatch(html, /ref-ntg-footer-top">佳禾藥局/);
});

test("only registered pharmacy IDs can supply printed branding", () => {
  const registered = vm.runInContext(`resolvePharmacy("?pharmacy=trusted", {
    defaultId: "jiahe", pharmacies: {
      jiahe: { name: "佳禾藥局", phone: "03-482-7805" },
      trusted: { name: "合作藥局", phone: "02-1234-5678" }
    }
  })`, context);
  assert.equal(registered.name, "合作藥局");
  assert.equal(vm.runInContext('resolvePharmacy("?pharmacy=missing", window.PHARMACY_CONFIG)', context), null);
  assert.equal(vm.runInContext('resolvePharmacy("?pharmacy=../jiahe", window.PHARMACY_CONFIG)', context), null);
  assert.equal(vm.runInContext('resolvePharmacy("?pharmacy=jiahe&name=偽造藥局", window.PHARMACY_CONFIG).name', context), "佳禾藥局");
});

test("video QR and return link retain the pharmacy ID", () => {
  vm.runInContext('selectedPharmacy = resolvePharmacy("?pharmacy=jiahe", window.PHARMACY_CONFIG)', context);
  const url = vm.runInContext('getSheetQrUrl({ qrUrl: "https://jill5991.github.io/patient-education/video.html?med=trelegy-ellipta" }, "en")', context);
  assert.equal(new URL(url).searchParams.get("pharmacy"), "jiahe");
  assert.match(fs.readFileSync(path.join(root, "video.html"), "utf8"), /backParams\.set\("pharmacy", pharmacy\)/);
});
