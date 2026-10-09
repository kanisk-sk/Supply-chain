import { describe, expect, it } from "vitest";
import { productionApiOrigin } from "../../next.config.mjs";

describe("production API configuration", () => {
  it("requires explicit HTTPS backend origin at build time", () => {
    for (const value of [undefined, "", "http://api.example.com/api/v1", "https://localhost/api/v1", "https://127.0.0.1/api/v1", "https://api.example.com", "https://user:secret@api.example.com/api/v1", "https://api.example.com/api/v1?debug=true", "https://api.example.com/api/v1/"]) {
      expect(() => productionApiOrigin(value)).toThrow();
    }
    expect(productionApiOrigin("https://api.example.com/api/v1")).toBe("https://api.example.com");
  });
});
