import { describe, expect, it } from "vitest";
import {
  validateRedirectPath,
  sanitizeForwardedHost,
  DANGEROUS_PATTERNS,
} from "@/lib/utils/security/redirect-validation";

/**
 * CRIT-5: Open Redirect Prevention Tests
 *
 * These tests verify that redirect paths are properly validated
 * to prevent open redirect attacks (phishing via crafted URLs).
 */

describe("redirect validation - CRIT-5 security fix", () => {
  describe("validateRedirectPath", () => {
    describe("valid paths", () => {
      it("accepts root path", () => {
        expect(validateRedirectPath("/")).toBe("/");
      });

      it("accepts simple internal paths", () => {
        expect(validateRedirectPath("/dashboard")).toBe("/dashboard");
        expect(validateRedirectPath("/profile")).toBe("/profile");
        expect(validateRedirectPath("/settings")).toBe("/settings");
      });

      it("accepts nested paths", () => {
        expect(validateRedirectPath("/app/readings/123")).toBe(
          "/app/readings/123"
        );
        expect(validateRedirectPath("/auth/callback")).toBe("/auth/callback");
      });

      it("accepts paths with query strings", () => {
        expect(validateRedirectPath("/search?q=test")).toBe("/search?q=test");
        expect(validateRedirectPath("/page?foo=bar&baz=qux")).toBe(
          "/page?foo=bar&baz=qux"
        );
      });

      it("accepts paths with fragments", () => {
        expect(validateRedirectPath("/page#section")).toBe("/page#section");
      });

      it("preserves URL encoding for valid characters", () => {
        expect(validateRedirectPath("/search?q=hello%20world")).toBe(
          "/search?q=hello%20world"
        );
      });
    });

    describe("null/empty handling", () => {
      it("returns / for null input", () => {
        expect(validateRedirectPath(null)).toBe("/");
      });

      it("returns / for empty string", () => {
        expect(validateRedirectPath("")).toBe("/");
      });
    });

    describe("protocol-relative URL attacks (//evil.com)", () => {
      it("blocks //evil.com", () => {
        expect(validateRedirectPath("//evil.com")).toBe("/");
      });

      it("blocks //evil.com/path", () => {
        expect(validateRedirectPath("//evil.com/path")).toBe("/");
      });

      it("blocks //evil.com?param=value", () => {
        expect(validateRedirectPath("//evil.com?param=value")).toBe("/");
      });

      it("blocks /// (triple slash)", () => {
        expect(validateRedirectPath("///evil.com")).toBe("/");
      });
    });

    describe("backslash attacks (/\\evil.com)", () => {
      it("blocks /\\evil.com", () => {
        expect(validateRedirectPath("/\\evil.com")).toBe("/");
      });

      it("blocks encoded backslash %5c", () => {
        expect(validateRedirectPath("/%5cevil.com")).toBe("/");
      });

      it("blocks encoded backslash %5C (uppercase)", () => {
        expect(validateRedirectPath("/%5Cevil.com")).toBe("/");
      });
    });

    describe("protocol injection attacks", () => {
      it("blocks http://evil.com", () => {
        expect(validateRedirectPath("http://evil.com")).toBe("/");
      });

      it("blocks https://evil.com", () => {
        expect(validateRedirectPath("https://evil.com")).toBe("/");
      });

      it("blocks javascript:alert(1)", () => {
        expect(validateRedirectPath("javascript:alert(1)")).toBe("/");
      });

      it("blocks data:text/html", () => {
        expect(validateRedirectPath("data:text/html,<script>")).toBe("/");
      });

      it("blocks ftp://evil.com", () => {
        expect(validateRedirectPath("ftp://evil.com")).toBe("/");
      });
    });

    describe("encoded slash attacks", () => {
      it("blocks %2f%2fevil.com (double encoded slash)", () => {
        expect(validateRedirectPath("%2f%2fevil.com")).toBe("/");
      });

      it("blocks %2F%2Fevil.com (uppercase encoded)", () => {
        expect(validateRedirectPath("%2F%2Fevil.com")).toBe("/");
      });

      it("blocks /%2fevil.com (mixed encoding)", () => {
        expect(validateRedirectPath("/%2fevil.com")).toBe("/");
      });
    });

    describe("null byte attacks", () => {
      it("blocks paths with null bytes", () => {
        expect(validateRedirectPath("/path\x00evil")).toBe("/");
      });

      it("blocks encoded null bytes", () => {
        expect(validateRedirectPath("/path%00evil")).toBe("/");
      });
    });

    describe("credential injection attacks (@)", () => {
      it("blocks user@evil.com URLs", () => {
        expect(validateRedirectPath("/redirect?url=user@evil.com")).toBe("/");
      });

      it("blocks paths with @ symbol", () => {
        expect(validateRedirectPath("/@evil.com")).toBe("/");
      });
    });

    describe("relative path traversal", () => {
      it("blocks /. (single dot)", () => {
        expect(validateRedirectPath("/.")).toBe("/");
      });

      it("blocks /.. (parent directory)", () => {
        expect(validateRedirectPath("/..")).toBe("/");
      });

      it("blocks /./ (dot in path)", () => {
        expect(validateRedirectPath("/./")).toBe("/");
      });

      it("blocks /../ (parent traversal)", () => {
        expect(validateRedirectPath("/../")).toBe("/");
      });
    });

    describe("malformed encoding", () => {
      it("blocks invalid percent encoding", () => {
        // %ZZ is not valid hex
        expect(validateRedirectPath("/%ZZinvalid")).toBe("/");
      });

      it("blocks incomplete encoding", () => {
        expect(validateRedirectPath("/%2")).toBe("/");
      });
    });

    describe("paths not starting with /", () => {
      it("blocks paths starting with letter", () => {
        expect(validateRedirectPath("evil.com")).toBe("/");
      });

      it("blocks relative paths", () => {
        expect(validateRedirectPath("../parent")).toBe("/");
      });

      it("blocks domain-like paths", () => {
        expect(validateRedirectPath("www.evil.com")).toBe("/");
      });
    });

    describe("OWASP open redirect test cases", () => {
      // Based on OWASP Testing Guide
      const owaspTestCases = [
        "//evil.com",
        "//evil.com/%2f..",
        "///evil.com",
        "////evil.com",
        "/\\evil.com",
        "/\\/\\/evil.com",
        "https:evil.com",
        "//google%00.com",
        "//google%E3%80%82com",
        "/http://evil.com",
        "/.evil.com",
        "///evil.com/%2f%2e%2e",
      ];

      for (const testCase of owaspTestCases) {
        it(`blocks OWASP test case: ${testCase}`, () => {
          expect(validateRedirectPath(testCase)).toBe("/");
        });
      }
    });
  });

  describe("sanitizeForwardedHost", () => {
    it("returns null for null input", () => {
      expect(sanitizeForwardedHost(null)).toBeNull();
    });

    it("keeps valid hostname", () => {
      expect(sanitizeForwardedHost("example.com")).toBe("example.com");
    });

    it("keeps hostname with subdomain", () => {
      expect(sanitizeForwardedHost("api.example.com")).toBe("api.example.com");
    });

    it("keeps hostname with hyphens", () => {
      expect(sanitizeForwardedHost("my-app.example.com")).toBe(
        "my-app.example.com"
      );
    });

    it("removes port numbers", () => {
      // Colon is not in [\\w.-] so it gets removed along with the port
      expect(sanitizeForwardedHost("example.com:3000")).toBe("example.com3000");
    });

    it("removes spaces", () => {
      expect(sanitizeForwardedHost("example .com")).toBe("example.com");
    });

    it("removes special characters", () => {
      expect(sanitizeForwardedHost("evil<script>.com")).toBe("evilscript.com");
    });

    it("removes newlines (header injection)", () => {
      expect(sanitizeForwardedHost("evil.com\r\nX-Injected: header")).toBe(
        "evil.comX-Injectedheader"
      );
    });

    it("removes slashes", () => {
      expect(sanitizeForwardedHost("evil.com/path")).toBe("evil.compath");
    });
  });

  describe("DANGEROUS_PATTERNS coverage", () => {
    it("has pattern for protocol-relative URLs", () => {
      expect(DANGEROUS_PATTERNS.some((p) => p.test("//evil.com"))).toBe(true);
    });

    it("has pattern for backslash URLs", () => {
      expect(DANGEROUS_PATTERNS.some((p) => p.test("/\\evil.com"))).toBe(true);
    });

    it("has pattern for protocols", () => {
      expect(DANGEROUS_PATTERNS.some((p) => p.test("http://"))).toBe(true);
    });

    it("has pattern for encoded double slash", () => {
      expect(DANGEROUS_PATTERNS.some((p) => p.test("%2f%2f"))).toBe(true);
    });

    it("has pattern for encoded backslash", () => {
      expect(DANGEROUS_PATTERNS.some((p) => p.test("%5c"))).toBe(true);
    });

    it("has pattern for null bytes", () => {
      expect(DANGEROUS_PATTERNS.some((p) => p.test("\x00"))).toBe(true);
    });

    it("has pattern for @ symbol", () => {
      expect(DANGEROUS_PATTERNS.some((p) => p.test("@"))).toBe(true);
    });
  });

  describe("real-world attack scenarios", () => {
    it("blocks phishing redirect after OAuth", () => {
      // Attacker creates: /auth/callback?code=xxx&next=//phishing-site.com
      const maliciousNext = "//phishing-site.com";
      expect(validateRedirectPath(maliciousNext)).toBe("/");
    });

    it("blocks credential harvesting redirect", () => {
      // Attacker tries: /login?redirect=http://fake-login.com
      const maliciousRedirect = "http://fake-login.com";
      expect(validateRedirectPath(maliciousRedirect)).toBe("/");
    });

    it("blocks XSS via javascript: protocol", () => {
      const xssAttempt = "javascript:alert(document.cookie)";
      expect(validateRedirectPath(xssAttempt)).toBe("/");
    });

    it("blocks data: URI injection", () => {
      const dataUri = "data:text/html,<script>alert(1)</script>";
      expect(validateRedirectPath(dataUri)).toBe("/");
    });

    it("blocks bypass via double encoding", () => {
      // Attacker hopes server decodes twice
      const doubleEncoded = "/%252f%252fevil.com";
      expect(validateRedirectPath(doubleEncoded)).toBe("/");
    });
  });
});
