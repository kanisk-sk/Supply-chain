import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, listAllPages, inventoryProductChoices, request, SESSION_EXPIRED_EVENT } from "./api";

describe("API session and request recovery", () => {
  let values: Map<string, string>;
  let browser: EventTarget;
  beforeEach(() => {
    values = new Map([["token", "current-session"]]);
    browser = new EventTarget();
    vi.stubGlobal("window", browser);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it("invalidates the rejected session and informs the authentication provider", async () => {
    const expired = vi.fn(); browser.addEventListener(SESSION_EXPIRED_EVENT, expired);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: "Expired" }), { status: 401 })));
    await expect(request("/inventory")).rejects.toMatchObject({ status: 401 });
    expect(values.has("token")).toBe(false); expect(expired).toHaveBeenCalledOnce();
  });
  it("does not erase a valid session during server outages or incorrect login attempts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
    await expect(request("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(values.get("token")).toBe("current-session");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    await expect(request("/auth/login")).rejects.toMatchObject({ status: 401 });
    expect(values.get("token")).toBe("current-session");
  });
  it("does not clear a newer session when an older request returns unauthorized", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      values.set("token", "new-session");
      return new Response("{}", { status: 401 });
    }));
    await expect(request("/inventory")).rejects.toMatchObject({ status: 401 });
    expect(values.get("token")).toBe("new-session");
  });
  it("aborts a stalled request within the application timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const result = request("/inventory");
    const assertion = expect(result).rejects.toMatchObject({ code: "REQUEST_TIMEOUT", status: 408 });
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });
  it("builds warehouse-manager product choices through permitted scoped inventory only", async () => {
    const fetcher = vi.fn(async (url: string) => {
      expect(url).toContain("/inventory?"); expect(url).not.toContain("/products");
      const page = Number(new URL(url).searchParams.get("page"));
      return new Response(JSON.stringify({ success: true, data: page === 1 ? [{ product_id: 7, product: { id: 7, name: "Pump", sku: "PUMP" } }] : [{ product_id: 7, product: { id: 7, name: "Pump", sku: "PUMP" } }, { product_id: 8, product: { id: 8, name: "Valve", sku: "VALVE" } }], meta: { page, limit: 100, total: 3, pages: 2 } }));
    });
    vi.stubGlobal("fetch", fetcher);
    const choices = await inventoryProductChoices(false);
    expect(choices.map(product => product.id)).toEqual([7, 8]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("forwards caller cancellation instead of misreporting a timeout", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const result = request("/inventory", { signal: controller.signal }); controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("complete form choices", () => {
  it("loads later pages so records beyond the first 100 remain selectable", async () => {
    const load = vi.fn(async (page: number) => ({ success: true, data: page === 1 ? Array.from({ length: 100 }, (_, index) => index + 1) : [101, 102], meta: { page, limit: 100, total: 102, pages: 2 } }));
    const choices = await listAllPages(load);
    expect(choices).toHaveLength(102); expect(choices.at(-1)).toBe(102);
    expect(load.mock.calls.map(call => call[0])).toEqual([1, 2]);
  });
  it("propagates failures instead of accepting an incomplete set", async () => {
    await expect(listAllPages(async () => { throw new Error("Offline"); })).rejects.toThrow("Offline");
  });
});
