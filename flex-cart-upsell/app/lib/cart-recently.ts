type Candidate = {
  id?: string | number;
  handle: string;
  requiresCustomization?: boolean;
};

export async function cartRecentlyProducts<T extends Candidate>({
  history,
  cartIds,
  loadProduct,
  loadBestSellers,
}: {
  history: unknown;
  cartIds: (string | number)[];
  loadProduct: (candidate: Candidate) => Promise<T | null>;
  loadBestSellers: () => Promise<Candidate[]>;
}): Promise<T[]> {
  const productId = (id: unknown) =>
    String(id || "").replace("gid://shopify/Product/", "");
  const excluded = new Set(cartIds.map(productId));
  const handles = new Set<string>();
  const selected: T[] = [];
  const recent = Array.isArray(history)
    ? [...history]
        .reverse()
        .filter(
          (handle) =>
            typeof handle === "string" && /^[a-z0-9][a-z0-9-]*$/i.test(handle),
        )
        .slice(0, 13)
    : [];

  async function append(candidates: Candidate[]) {
    for (let offset = 0; offset < candidates.length && selected.length < 5;) {
      const batch: Candidate[] = [];
      while (offset < candidates.length && batch.length < 5 - selected.length) {
        const candidate = candidates[offset++];
        if (
          !candidate?.handle ||
          handles.has(candidate.handle) ||
          excluded.has(productId(candidate.id))
        )
          continue;
        handles.add(candidate.handle);
        if (candidate.requiresCustomization) continue;
        batch.push(candidate);
      }
      const products = await Promise.all(
        batch.map((candidate) => loadProduct(candidate).catch(() => null)),
      );
      for (const product of products) {
        if (
          !product?.id ||
          product.requiresCustomization ||
          excluded.has(productId(product.id))
        )
          continue;
        excluded.add(productId(product.id));
        selected.push(product);
      }
    }
  }

  await append(recent.map((handle) => ({ handle })));
  if (selected.length < 5)
    await append(await loadBestSellers().catch(() => []));
  return selected;
}
