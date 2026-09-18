import assert from "node:assert/strict";
import test from "node:test";
import { createAsyncTtlCache } from "./async-ttl-cache.ts";

test("concurrent catalogue requests share one load and expire after the TTL", async () => {
  let now = 0;
  let reads = 0;
  const cache = createAsyncTtlCache<number>(100, 32, () => now);
  const load = async () => ++reads;
  const values = await Promise.all(
    Array.from({ length: 100 }, () => cache.get("shop-a", load)),
  );
  assert.deepEqual(new Set(values), new Set([1]));
  assert.equal(reads, 1);
  now = 99;
  assert.equal(await cache.get("shop-a", load), 1);
  now = 100;
  assert.equal(await cache.get("shop-a", load), 2);
});

test("shops have independent cache entries", async () => {
  const cache = createAsyncTtlCache<string>(100);
  assert.equal(await cache.get("a", async () => "A"), "A");
  assert.equal(await cache.get("b", async () => "B"), "B");
  cache.delete("a");
  assert.equal(await cache.get("a", async () => "new A"), "new A");
  assert.equal(await cache.get("b", async () => "wrong B"), "B");
});

test("database failures are not cached and a later request can recover", async () => {
  const cache = createAsyncTtlCache<string>(100);
  const failure = () => { throw new Error("offline"); };
  await assert.rejects(cache.get("a", failure), /offline/);
  assert.equal(await cache.get("a", async () => "restored"), "restored");
});

test("a pre-sync in-flight result cannot replace a post-sync cache entry", async () => {
  const cache = createAsyncTtlCache<string>(100);
  let finish!: (value: string) => void;
  const old = cache.get("a", () => new Promise<string>((resolve) => { finish = resolve; }));
  await Promise.resolve();
  cache.delete("a");
  assert.equal(await cache.get("a", async () => "new"), "new");
  finish("old");
  assert.equal(await old, "old");
  assert.equal(await cache.get("a", async () => "wrong"), "new");
});

test("a detached failed request cannot delete the replacement cache entry", async () => {
  const cache = createAsyncTtlCache<string>(100);
  let fail!: (error: Error) => void;
  const old = cache.get("a", () => new Promise<string>((_, reject) => { fail = reject; }));
  const rejected = assert.rejects(old, /offline/);
  await Promise.resolve();
  cache.delete("a");
  await cache.get("a", async () => "new");
  fail(new Error("offline"));
  await rejected;
  assert.equal(await cache.get("a", async () => "wrong"), "new");
});

test("cache evicts older keys when the entry limit is reached", async () => {
  const cache = createAsyncTtlCache<string>(100, 2);
  await cache.get("a", async () => "A");
  await cache.get("b", async () => "B");
  await cache.get("c", async () => "C");
  assert.equal(await cache.get("b", async () => "wrong"), "B");
  assert.equal(await cache.get("a", async () => "reloaded A"), "reloaded A");
});
