const INSTAFEED_ENDPOINT = "https://instafeed.nfcube.com/feed/v6";
const DEFAULT_ACCOUNT = "apepsd-ha.myshopify.com";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 24;

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
}

function normalizeLimit(value) {
  const parsed = Number.parseInt(String(value ?? DEFAULT_LIMIT), 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function normalizePost(post) {
  const image = post?.images?.standard_resolution?.url ?? null;
  const video = post?.videos?.standard_resolution?.url ?? null;
  const caption = post?.caption?.text ?? "";

  return {
    id: String(post?.id ?? ""),
    type: post?.type === "video" ? "video" : "image",
    createdTime: post?.created_time ?? null,
    link: post?.link ?? null,
    caption,
    alt: post?.alt_text ?? caption.slice(0, 160),
    image,
    video
  };
}

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.INSTAFEED_API_KEY;
  const account = process.env.INSTAFEED_ACCOUNT || DEFAULT_ACCOUNT;

  if (!apiKey) {
    response.setHeader("Cache-Control", "no-store");
    return response.status(500).json({ error: "Instafeed proxy is not configured" });
  }

  const limit = normalizeLimit(request.query?.limit);
  const upstreamUrl = new URL(INSTAFEED_ENDPOINT);
  upstreamUrl.searchParams.set("limit", String(limit));
  upstreamUrl.searchParams.set("account", account);
  upstreamUrl.searchParams.set("fu", "0");
  upstreamUrl.searchParams.set("fid", "0");

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey
      }
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok || payload?.meta?.code !== 200) {
      response.setHeader("Cache-Control", "no-store");
      return response.status(502).json({
        error: "Instagram feed is temporarily unavailable",
        upstreamStatus: upstreamResponse.status,
        upstreamCode: payload?.meta?.code ?? null
      });
    }

    const posts = Array.isArray(payload.data)
      ? payload.data.map(normalizePost).filter((post) => post.id && post.image && post.link)
      : [];

    response.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600"
    );

    return response.status(200).json({
      username: payload.meta?.username ?? "camo.signal",
      syncTime: payload.meta?.sync_time ?? null,
      posts
    });
  } catch {
    response.setHeader("Cache-Control", "no-store");
    return response.status(502).json({ error: "Instagram feed is temporarily unavailable" });
  }
}
