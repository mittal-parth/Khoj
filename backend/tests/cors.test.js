import { isOriginAllowed } from "../src/utils/cors.js";

describe("CORS allowlist origin matching", () => {
  test("treats requests without Origin as not CORS-allowlisted", () => {
    expect(isOriginAllowed(undefined, ["https://example.com"])).toBe(false);
    expect(isOriginAllowed(null, ["https://example.com"])).toBe(false);
    expect(isOriginAllowed("", ["https://example.com"])).toBe(false);
  });

  test("denies all browser origins when allowlist is empty", () => {
    expect(isOriginAllowed("https://example.com", [])).toBe(false);
  });

  test("allows exact origin matches", () => {
    const allowed = ["https://khoj-alpha.netlify.app", "http://localhost:5173"];
    expect(isOriginAllowed("https://khoj-alpha.netlify.app", allowed)).toBe(true);
    expect(isOriginAllowed("http://localhost:5173", allowed)).toBe(true);
  });

  test("normalizes origins that include a path (defensive)", () => {
    const allowed = ["https://xy.com"];
    expect(isOriginAllowed("https://xy.com/abc/", allowed)).toBe(true);
  });

  test("allows wildcard subdomains with matching scheme", () => {
    const allowed = ["https://*khoj-alpha.netlify.app"];

    expect(
      isOriginAllowed(
        "https://deploy-preview-219--khoj-alpha.netlify.app",
        allowed
      )
    ).toBe(true);

    // Any subdomain should work, including nested ones
    expect(isOriginAllowed("https://a.b.khoj-alpha.netlify.app", allowed)).toBe(
      true
    );

    // Wrong scheme should NOT be allowed
    expect(
      isOriginAllowed("http://deploy-preview-219--khoj-alpha.netlify.app", allowed)
    ).toBe(false);
  });

  test("dot-subdomain wildcards do not include the apex domain", () => {
    const allowed = ["https://*.example.com"];
    expect(isOriginAllowed("https://a.example.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://example.com", allowed)).toBe(false);
  });

  test("blocks non-allowlisted origins", () => {
    const allowed = ["https://khoj-alpha.netlify.app"];
    expect(isOriginAllowed("https://evil.com", allowed)).toBe(false);
  });
});

