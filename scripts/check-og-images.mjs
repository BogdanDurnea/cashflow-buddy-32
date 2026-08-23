// Verifies every public route has an OpenGraph/Twitter image in /public and
// that each image uses the recommended 1200x630 dimensions.
// Run: node scripts/check-og-images.mjs

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const routesSrc = readFileSync(resolve("src/data/seoRoutes.ts"), "utf8");

const WIDTH = Number(routesSrc.match(/OG_IMAGE_WIDTH = (\d+)/)?.[1]);
const HEIGHT = Number(routesSrc.match(/OG_IMAGE_HEIGHT = (\d+)/)?.[1]);

const images = [...new Set([...routesSrc.matchAll(/ogImage:\s*"([^"]+)"/g)].map((m) => m[1]))];
// DEFAULT_OG_IMAGE is referenced by constant, not literal, on most routes.
const fallback = routesSrc.match(/DEFAULT_OG_IMAGE = "([^"]+)"/)?.[1];
if (fallback) images.push(fallback);

/** Minimal JPEG/PNG dimension reader — avoids pulling an image dependency into CI. */
function dimensions(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

const errors = [];
for (const image of [...new Set(images)]) {
  const file = resolve(`public${image}`);
  if (!existsSync(file)) {
    errors.push(`${image}: missing from public/`);
    continue;
  }
  const dim = dimensions(readFileSync(file));
  if (!dim) {
    errors.push(`${image}: unsupported image format (expected JPEG or PNG)`);
  } else if (dim.width !== WIDTH || dim.height !== HEIGHT) {
    errors.push(`${image}: is ${dim.width}x${dim.height}, expected ${WIDTH}x${HEIGHT}`);
  } else {
    console.log(`ok  ${image} (${dim.width}x${dim.height})`);
  }
}

if (errors.length) {
  console.error("\nOpenGraph image check failed:");
  errors.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log(`\nAll ${new Set(images).size} social images are ${WIDTH}x${HEIGHT}.`);
