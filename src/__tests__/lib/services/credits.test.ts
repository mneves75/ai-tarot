import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTotalCreditsSpent } from "@/lib/services/credits";

const mocks = vi.hoisted(() => {
  const whereMock = vi.fn();
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  return { whereMock, fromMock, selectMock };
});

// Mocks for the drizzle query chain: select().from().where()
vi.mock("@/lib/db", () => ({
  db: { select: mocks.selectMock },
}));

type CreditType =
  | "reading"
  | "purchase"
  | "bonus"
  | "adjustment"
  | "refund"
  | "welcome";

type Tx = { delta: number; type: CreditType };

const setTransactions = (transactions: Tx[]) => {
  mocks.whereMock.mockResolvedValue(transactions);
};

describe("credits service - totals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts only reading debits and ignores refunds", async () => {
    setTransactions([
      { delta: -2, type: "reading" },
      { delta: -3, type: "reading" },
      { delta: -5, type: "refund" },
      { delta: 10, type: "purchase" },
    ]);

    const total = await getTotalCreditsSpent("user-1");

    expect(total).toBe(5);
    expect(mocks.whereMock).toHaveBeenCalledTimes(1);
  });

  it("includes negative adjustments but ignores positive adjustments", async () => {
    setTransactions([
      { delta: -4, type: "adjustment" },
      { delta: 6, type: "adjustment" },
      { delta: -1, type: "reading" },
    ]);

    const total = await getTotalCreditsSpent("user-2");

    expect(total).toBe(5);
  });

  it("returns zero when no debits exist", async () => {
    setTransactions([
      { delta: 5, type: "purchase" },
      { delta: 3, type: "bonus" },
    ]);

    const total = await getTotalCreditsSpent("user-3");

    expect(total).toBe(0);
  });
});
