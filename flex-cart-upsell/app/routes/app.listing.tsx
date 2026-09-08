import { useEffect, useMemo, useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { CheckCircle, CircleNotch, Cube, Package, WarningCircle } from "@phosphor-icons/react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import "../styles/listing.css";
import { getLarkConfigStatus, listLarkListingRows } from "../lib/lark.server";
import { createDraftListing, previewListing, type ShopifyAdminClient } from "../lib/shopify-listing.server";
import type { ListingPreview, LarkListingRow } from "../lib/listing-types";
import { authenticate } from "../shopify.server";

type ActionResult = {
  intent: "sync" | "preview" | "create-draft";
  rows?: LarkListingRow[];
  preview?: ListingPreview;
  result?: { adminUrl: string; title: string; imagesUploaded: number };
  error?: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const config = getLarkConfigStatus();
  if (!config.configured) return { config, rows: [] as LarkListingRow[], loadError: null };
  try {
    return { config, rows: await listLarkListingRows(), loadError: null };
  } catch (error) {
    return {
      config,
      rows: [] as LarkListingRow[],
      loadError: error instanceof Error ? error.message : "Could not load Lark records.",
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  try {
    if (intent === "sync") {
      return { intent, rows: await listLarkListingRows() };
    }
    const recordId = String(formData.get("recordId") ?? "");
    if (!recordId) throw new Error("Choose a Lark row first.");
    if (intent === "preview") {
      return { intent, preview: await previewListing(admin as ShopifyAdminClient, recordId) };
    }
    if (intent === "create-draft") {
      const templateProductId = String(formData.get("templateProductId") ?? "");
      if (!templateProductId) throw new Error("Choose a Shopify product template.");
      const result = await createDraftListing({
        admin: admin as ShopifyAdminClient,
        shop: session.shop,
        recordId,
        templateProductId,
      });
      return { intent, result };
    }
    throw new Error("Unknown listing action.");
  } catch (error) {
    return {
      intent: intent === "sync" || intent === "preview" || intent === "create-draft" ? intent : "sync",
      error: error instanceof Error ? error.message : "Listing action failed.",
    };
  }
};

function statusLabel(status: LarkListingRow["status"]) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function Status({ status }: { status: LarkListingRow["status"] }) {
  const className =
    status === "READY"
      ? "listing-status listing-status--ready"
      : status === "DRAFT_CREATED"
        ? "listing-status listing-status--done"
        : "listing-status listing-status--review";
  return <span className={className}>{statusLabel(status)}</span>;
}

export default function ListingPage() {
  const initial = useLoaderData<typeof loader>();
  const [rows, setRows] = useState(initial.rows);
  const [selectedId, setSelectedId] = useState<string | null>(initial.rows[0]?.recordId ?? null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const syncFetcher = useFetcher<ActionResult>();
  const previewFetcher = useFetcher<ActionResult>();
  const createFetcher = useFetcher<ActionResult>();

  useEffect(() => setRows(initial.rows), [initial.rows]);
  useEffect(() => {
    if (syncFetcher.data?.rows) {
      setRows(syncFetcher.data.rows);
      setSelectedId((current) => current ?? syncFetcher.data?.rows?.[0]?.recordId ?? null);
    }
  }, [syncFetcher.data]);
  useEffect(() => {
    if (previewFetcher.data?.preview) setSelectedTemplateId(previewFetcher.data.preview.selectedTemplateId);
  }, [previewFetcher.data]);

  const selected = useMemo(() => rows.find((row) => row.recordId === selectedId) ?? null, [rows, selectedId]);
  const preview = previewFetcher.data?.preview;
  const creating = createFetcher.state !== "idle";
  const previewing = previewFetcher.state !== "idle";
  const syncing = syncFetcher.state !== "idle";
  const createEnabled = Boolean(
    preview &&
      selectedTemplateId &&
      preview.row.status === "READY" &&
      preview.suggestedCollection &&
      !preview.warnings.some((warning) => warning.includes("no recognized color")),
  );

  if (!initial.config.configured) {
    return (
      <main className="listing-shell">
        <section className="listing-setup-card">
          <Package aria-hidden size={28} weight="duotone" />
          <div>
            <h1>Connect Lark to start listing</h1>
            <p>Add the missing values in <code>.env</code>, then reload this page.</p>
            <ul>{initial.config.missing.map((name) => <li key={name}>{name}</li>)}</ul>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="listing-shell">
      <header className="listing-heading">
        <div>
          <h1>Product listing</h1>
          <p>Review Lark uploads, then create a safe Shopify draft from a matching template.</p>
        </div>
        <button
          className="listing-button listing-button--secondary"
          disabled={syncing}
          onClick={() => syncFetcher.submit({ intent: "sync" }, { method: "post" })}
          type="button"
        >
          {syncing ? <CircleNotch aria-hidden className="listing-spin" size={16} /> : null}
          Sync Lark
        </button>
      </header>

      {initial.loadError || syncFetcher.data?.error ? (
        <div className="listing-alert"><WarningCircle aria-hidden size={18} />{initial.loadError ?? syncFetcher.data?.error}</div>
      ) : null}

      <div className="listing-workspace">
        <section className="listing-table-card" aria-label="Lark uploads">
          <div className="listing-table-header">
            <div><strong>TUONG - UPLOAD</strong><span>{rows.length} records</span></div>
            <span>Source: Lark Base</span>
          </div>
          <div className="listing-table-scroll">
            <table>
              <thead>
                <tr><th>Design ID</th><th>Product type</th><th>Main Color</th><th>Colors</th><th>Weekly Design Plan</th><th>Assets</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className={row.recordId === selectedId ? "is-selected" : ""} key={row.recordId}>
                    <td><button className="listing-row-button" onClick={() => setSelectedId(row.recordId)} type="button">{row.designId}</button></td>
                    <td>{row.productType || "?"}</td><td>{row.mainColor ?? "?"}</td>
                    <td><div className="listing-color-list">{row.colors.length ? row.colors.map((color) => <span key={color}>{color}</span>) : "?"}</div></td>
                    <td>{row.weeklyDesignPlan ?? "?"}</td>
                    <td>{row.attachments.length} file{row.attachments.length === 1 ? "" : "s"}</td><td><Status status={row.status} /></td>
                  </tr>
                ))}
                {!rows.length ? <tr><td className="listing-empty" colSpan={7}>No Lark records found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="listing-inspector">
          {selected ? (
            <>
              <div className="listing-inspector-heading">
                <div><span>Selected upload</span><h2>{selected.title ?? selected.designId}</h2></div><Status status={selected.status} />
              </div>
              <dl className="listing-details">
                <div><dt>Product type</dt><dd>{selected.productType || "Missing"}</dd></div>
                <div><dt>Title source</dt><dd>{selected.titleSource === "weekly-plan" ? "Weekly Design Plan" : selected.titleSource}</dd></div>
                <div><dt>Price</dt><dd>{selected.price === null ? "Keep template" : `$${selected.price}`}</dd></div>
                <div><dt>Inventory</dt><dd>{selected.inventory === null ? "Keep template" : selected.inventory}</dd></div>
              </dl>
              <button
                className="listing-button listing-button--primary"
                disabled={previewing || selected.status === "DRAFT_CREATED"}
                onClick={() => previewFetcher.submit({ intent: "preview", recordId: selected.recordId }, { method: "post" })}
                type="button"
              >
                {previewing ? <CircleNotch aria-hidden className="listing-spin" size={16} /> : <Cube aria-hidden size={16} weight="fill" />}
                Preview listing
              </button>
              {previewFetcher.data?.error ? <div className="listing-alert"><WarningCircle aria-hidden size={18} />{previewFetcher.data.error}</div> : null}
              {preview ? (
                <div className="listing-preview">
                  <section><h3>Images by color</h3><div className="listing-counts">{preview.imageCounts.map((item) => <span key={item.color}>{item.color}<b>{item.count}</b></span>)}</div></section>
                  <section><h3>Product template</h3>
                    <select onChange={(event) => setSelectedTemplateId(event.target.value)} value={selectedTemplateId ?? ""}>
                      <option value="">Choose template</option>
                      {preview.templates.map((template) => <option key={template.id} value={template.id}>{template.title} ? {template.variantCount} variants</option>)}
                    </select>
                  </section>
                  <section><h3>Collection</h3><p>{preview.suggestedCollection ? preview.suggestedCollection.title : "No confident match"}</p></section>
                  {preview.warnings.length ? <section className="listing-warnings"><h3>Review before creating</h3><ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section> : null}
                  <button
                    className="listing-button listing-button--create"
                    disabled={!createEnabled || creating}
                    onClick={() => createFetcher.submit({ intent: "create-draft", recordId: selected.recordId, templateProductId: selectedTemplateId ?? "" }, { method: "post" })}
                    type="button"
                  >
                    {creating ? <CircleNotch aria-hidden className="listing-spin" size={16} /> : <CheckCircle aria-hidden size={16} weight="fill" />}
                    Create Draft in Shopify
                  </button>
                  {createFetcher.data?.error ? <div className="listing-alert"><WarningCircle aria-hidden size={18} />{createFetcher.data.error}</div> : null}
                  {createFetcher.data?.result ? <a className="listing-success" href={createFetcher.data.result.adminUrl} rel="noreferrer" target="_blank"><CheckCircle aria-hidden size={17} weight="fill" />Draft created: {createFetcher.data.result.title}</a> : null}
                </div>
              ) : null}
            </>
          ) : <div className="listing-inspector-empty">Select an upload to preview its Shopify draft.</div>}
        </aside>
      </div>
    </main>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
