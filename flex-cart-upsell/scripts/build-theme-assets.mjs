import { build } from "esbuild";

const shared = {
  minify: true,
  target: "es2020",
};

await Promise.all([
  build({
    ...shared,
    bundle: true,
    entryPoints: ["app/storefront/flex-upsell.js"],
    outfile: "../assets/cart-upsell-preview.js",
  }),
  build({
    ...shared,
    bundle: true,
    entryPoints: ["app/storefront/flex-upsell.js"],
    outfile:
      "extensions/flex-cart-upsell-theme/assets/flex-upsell-cart-refresh.js",
  }),
  build({
    ...shared,
    entryPoints: ["app/storefront/flex-upsell-loader.js"],
    outfile: "extensions/flex-cart-upsell-theme/assets/flex-upsell-loader.js",
  }),
]);
