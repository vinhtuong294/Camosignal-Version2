import {
  getProductSnapshotForSync,
  type AdminGraphqlClient,
} from "./catalogue-sync.server";
import {
  removeProductSnapshot,
  replaceProductSnapshots,
} from "./campaign.server";

export async function syncProductFromWebhook({
  admin,
  productId,
  shop,
}: {
  admin: AdminGraphqlClient;
  productId: string;
  shop: string;
}) {
  const { currency, snapshot } = await getProductSnapshotForSync({
    admin,
    productId,
  });

  if (!snapshot) {
    await removeProductSnapshot(shop, productId);
    return;
  }

  await replaceProductSnapshots(shop, currency, [snapshot]);
}
