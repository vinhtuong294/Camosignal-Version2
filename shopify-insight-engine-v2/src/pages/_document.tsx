import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head>
        <meta
          name="shopify-api-key"
          content={process.env.SHOPIFY_API_KEY || "19c7298a511c9995152c2aa32a923535"}
        />
        <meta name="shopify-disabled-features" content="fetch, auto-redirect" />
        {/* Shopify App Bridge CDN must load before Next's runtime scripts and cannot use async/defer. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
      </Head>
      <body className="flex min-h-full flex-col">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
