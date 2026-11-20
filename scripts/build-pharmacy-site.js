const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const publishedFiles = [
  "index.html",
  "pharmacy-config.js",
  "video.html",
  "approved-videos.json"
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of publishedFiles) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
fs.cpSync(path.join(root, "assets"), path.join(output, "assets"), {
  recursive: true,
  filter: source => !path.basename(source).startsWith(".")
});

console.log(`Prepared ${output} for the access-controlled pharmacy site.`);
