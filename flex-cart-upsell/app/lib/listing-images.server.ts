import { unzipSync } from "fflate";
import { downloadLarkAttachment } from "./lark.server";
import type { ListingImage, LarkListingRow } from "./listing-types";
import { colorForFilename, effectiveColors, normalizeText } from "./listing-utils";

const MAX_ASSET_BYTES = 120 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function extension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(filename: string) {
  return IMAGE_EXTENSIONS.has(extension(filename));
}

function mimeFromName(filename: string) {
  switch (extension(filename)) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

function configuredColor(name: string, row: LarkListingRow, colors: string[]) {
  const raw = process.env.LARK_IMAGE_COLOR_MAP?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      const map = parsed[row.designId] ?? parsed[row.recordId] ?? parsed["*"];
      const baseName = name.split(/[\\/]/).pop() ?? name;
      const mapped = map?.[name] ?? map?.[baseName] ?? map?.[name.toLowerCase()] ?? map?.[baseName.toLowerCase()];
      if (typeof mapped === "string") {
        const color = colors.find((candidate) => normalizeText(candidate) === normalizeText(mapped));
        if (color) return color;
      }
    } catch {
      // Ignore malformed optional mappings and use filename matching below.
    }
  }
  return colorForFilename(name, colors);
}

function excludedFilename(name: string, row: LarkListingRow) {
  const raw = process.env.LARK_IMAGE_EXCLUDE?.trim();
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const configured = parsed[row.designId] ?? parsed[row.recordId] ?? parsed["*"];
    if (!Array.isArray(configured)) return false;
    const baseName = name.split(/[\\/]/).pop() ?? name;
    return configured.some((item) => {
      if (typeof item !== "string") return false;
      const pattern = normalizeText(item);
      return pattern && (normalizeText(name) === pattern || normalizeText(baseName) === pattern || normalizeText(baseName).includes(pattern));
    });
  } catch {
    return false;
  }
}

function asImage(name: string, bytes: Uint8Array, row: LarkListingRow): ListingImage | null {
  if (!isImage(name)) return null;
  const colors = effectiveColors(row);
  return { name, bytes, mimeType: mimeFromName(name), color: configuredColor(name, row, colors) };
}

function imagesFromZip(bytes: Uint8Array, row: LarkListingRow) {
  const entries = unzipSync(bytes);
  const images = Object.entries(entries)
    .filter(([name]) => !excludedFilename(name, row))
    .map(([name, contents]) => asImage(name, contents, row))
    .filter((image): image is ListingImage => Boolean(image));
  return images;
}

export async function loadListingImages(row: LarkListingRow) {
  const images: ListingImage[] = [];
  for (const attachment of row.attachments) {
    const bytes = await downloadLarkAttachment(attachment.fileToken);
    if (bytes.byteLength > MAX_ASSET_BYTES) {
      throw new Error(`${attachment.name} exceeds the 120 MB listing asset limit.`);
    }
    if (extension(attachment.name) === "zip") {
      images.push(...imagesFromZip(bytes, row));
      continue;
    }
    const image = asImage(attachment.name, bytes, row);
    if (image) images.push(image);
  }
  if (!images.length) throw new Error("No JPG, PNG, or WEBP images were found in the Lark attachments.");
  return images;
}

export function imageCountsByColor(images: ListingImage[], row: LarkListingRow) {
  const colors = effectiveColors(row);
  if (!colors.length) return [{ color: "No color option", count: images.length }];
  return colors.map((color) => ({
    color,
    count: images.filter((image) => image.color?.toLowerCase() === color.toLowerCase()).length,
  }));
}

export function unmatchedImageNames(images: ListingImage[], row: LarkListingRow) {
  if (!effectiveColors(row).length) return [];
  return images.filter((image) => !image.color).map((image) => image.name);
}
