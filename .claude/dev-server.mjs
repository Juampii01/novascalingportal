#!/usr/local/bin/node
// Patch PATH so child processes can find node
process.env.PATH = `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || "/usr/bin:/bin"}`;
// Disable Turbopack — use webpack for dev
process.env.TURBOPACK = "0";
process.env.NEXT_EXPERIMENTAL_TURBO = "0";

import { fileURLToPath } from "url";
import { createRequire } from "module";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
process.chdir(projectRoot);

const nextBin = path.join(
  projectRoot,
  "node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/bin/next"
);

process.argv = [process.execPath, nextBin, "dev"];

const require = createRequire(import.meta.url);
require(nextBin);
