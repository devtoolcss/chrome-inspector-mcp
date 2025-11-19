import { build } from "esbuild";

const isProd = process.env.NODE_ENV === "production";

const commonOptions = {
  entryPoints: [
    "popup.ts",
    "background.ts",
    "offscreen_inspectors.ts",
    "devtools.ts",
  ].map((file) => `src/${file}`),
  bundle: true,
  outdir: "dist",
  format: "esm",
  tsconfig: "tsconfig.json",
  external: ["chrome"],
};

build({
  ...commonOptions,
  sourcemap: !isProd,
  minify: isProd,
}).catch(() => process.exit(1));
