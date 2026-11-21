const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "docs");
fs.mkdirSync(output, { recursive: true });
for (const name of ["video.html", "approved-videos.json"]) {
  fs.copyFileSync(path.join(root, name), path.join(output, name));
}
console.log(`Prepared ${output} for the public video QR site.`);
