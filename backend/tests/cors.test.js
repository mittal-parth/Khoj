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
    const allowed = ["https://testing.netlify.app", "http://localhost:5173"];
    expect(isOriginAllowed("https://testing.netlify.app", allowed)).toBe(true);
    expect(isOriginAllowed("http://localhost:5173", allowed)).toBe(true);
  });

  test("normalizes origins that include a path (defensive)", () => {
    const allowed = ["https://xy.com"];
    expect(isOriginAllowed("https://xy.com/abc/", allowed)).toBe(true);
  });

  test("allows wildcard subdomains with matching scheme", () => {
    const allowed = ["https://*testing.netlify.app"];

    expect(
      isOriginAllowed(
        "https://deploy-preview-219--testing.netlify.app",
        allowed
      )
    ).toBe(true);

    // Any subdomain should work, including nested ones
    expect(isOriginAllowed("https://a.b.testing.netlify.app", allowed)).toBe(
      true
    );

    // Wrong scheme should NOT be allowed
    expect(
      isOriginAllowed("http://deploy-preview-219--testing.netlify.app", allowed)
    ).toBe(false);
  });

  test("dot-subdomain wildcards do not include the apex domain", () => {
    const allowed = ["https://*.example.com"];
    expect(isOriginAllowed("https://a.example.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://example.com", allowed)).toBe(false);
  });

  test("blocks non-allowlisted origins", () => {
    const allowed = ["https://testing.netlify.app"];
    expect(isOriginAllowed("https://evil.com", allowed)).toBe(false);
  });

  test("allows all origins when wildcard * is in allowlist", () => {
    const allowed = ["https://example.com", "*"];
    expect(isOriginAllowed("https://any-domain.com", allowed)).toBe(true);
    expect(isOriginAllowed("http://evil.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://example.com", allowed)).toBe(true);
  });

  test("requires scheme in allowlist patterns", () => {
    // Patterns without scheme should NOT match (security: prevents http/https ambiguity)
    const allowed = ["localhost:5173", "example.com:8080"];
    expect(isOriginAllowed("http://localhost:5173", allowed)).toBe(false);
    expect(isOriginAllowed("https://example.com:8080", allowed)).toBe(false);
    
    // Patterns with scheme should work
    const allowedWithScheme = ["http://localhost:5173", "https://example.com:8080"];
    expect(isOriginAllowed("http://localhost:5173", allowedWithScheme)).toBe(true);
    expect(isOriginAllowed("https://example.com:8080", allowedWithScheme)).toBe(true);
    expect(isOriginAllowed("https://localhost:5173", allowedWithScheme)).toBe(false); // Wrong scheme
  });

  test("handles invalid origin formats gracefully", () => {
    const allowed = ["https://example.com"];
    expect(isOriginAllowed("not-a-valid-url", allowed)).toBe(false);
    expect(isOriginAllowed("://invalid", allowed)).toBe(false);
    expect(isOriginAllowed("", allowed)).toBe(false);
  });

  test("handles port numbers correctly", () => {
    const allowed = ["http://localhost:5173", "https://example.com:443"];
    expect(isOriginAllowed("http://localhost:5173", allowed)).toBe(true);
    expect(isOriginAllowed("http://localhost:3000", allowed)).toBe(false);
    expect(isOriginAllowed("https://example.com:443", allowed)).toBe(true);
    // Port 443 is default for HTTPS, so URLs normalize to the same origin
    expect(isOriginAllowed("https://example.com", allowed)).toBe(true);
    
    // Test with non-default port
    const allowedWithPort = ["http://example.com:8080"];
    expect(isOriginAllowed("http://example.com:8080", allowedWithPort)).toBe(true);
    expect(isOriginAllowed("http://example.com", allowedWithPort)).toBe(false); // Port mismatch
    expect(isOriginAllowed("http://example.com:3000", allowedWithPort)).toBe(false);
  });

  test("protocol must match for wildcard patterns", () => {
    const allowed = ["https://*.example.com", "http://*.test.com"];
    expect(isOriginAllowed("https://sub.example.com", allowed)).toBe(true);
    expect(isOriginAllowed("http://sub.example.com", allowed)).toBe(false);
    expect(isOriginAllowed("http://sub.test.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://sub.test.com", allowed)).toBe(false);
  });
});

