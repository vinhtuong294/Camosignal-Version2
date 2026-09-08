import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

const buildDirectory =
  process.env.FLEX_UPSELL_BUILD_DIRECTORY?.trim() || undefined;

export default {
  ssr: true,
  presets: [vercelPreset()],
  ...(buildDirectory ? { buildDirectory } : {}),
} satisfies Config;
