import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

/**
 * Test setup file for Vitest.
 * Configures global mocks and cleanup.
 */

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock server-only module (used by lib/dal, lib/audit, etc.)
vi.mock("server-only", () => ({}));

// Mock Next.js headers (async in Next.js 16)
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve(
      new Map([
        ["x-forwarded-for", "127.0.0.1"],
        ["x-request-id", "test-request-id"],
        ["user-agent", "test-user-agent"],
      ])
    )
  ),
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    })
  ),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock crypto.randomUUID for consistent test IDs
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => "test-uuid-0000-0000-000000000000",
  } as Crypto;
}
