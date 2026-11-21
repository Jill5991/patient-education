const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "docs");

test("public Pages source contains only the video QR files", () => {
  assert.deepEqual(fs.readdirSync(publicRoot).sort(), ["approved-videos.json", "index.html", "video.html"]);
  for (const name of ["video.html", "approved-videos.json"]) {
    assert.equal(fs.readFileSync(path.join(publicRoot, name), "utf8"), fs.readFileSync(path.join(root, name), "utf8"));
  }
  const landing = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
  assert.doesNotMatch(landing, /const MEDICATIONS|assets\/img|pharmacy-config\.js/);
  assert.match(landing, /https:\/\/patient-education-bil\.pages\.dev\//);
});

test("public video QR page hides the staff-only return link", () => {
  const html = fs.readFileSync(path.join(publicRoot, "video.html"), "utf8");
  assert.match(html, /location\.hostname === "jill5991\.github\.io".*\.hidden = true/);
  assert.match(html, /fetch\("approved-videos\.json"\)/);
  const registry = JSON.parse(fs.readFileSync(path.join(publicRoot, "approved-videos.json"), "utf8"));
  assert.ok(registry["trelegy-ellipta"].en.youtubeId);
});
