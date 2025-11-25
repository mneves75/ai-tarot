import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  db: mocks.db,
}));

import { TarotService, SPREAD_CONFIGS } from "@/lib/services/tarot";
import { ValidationError } from "@/lib/errors";

// Build a small deterministic deck
const makeDeck = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    code: `code-${i}`,
    name: `Card ${i}`,
    arcana: "major" as const,
    suit: "none" as const,
    cardIndex: i,
    keywordsUpright: ["k1"],
    keywordsReversed: ["k2"],
    descriptionUpright: "up",
    descriptionReversed: "down",
    imageUrl: null,
  }));

class TestTarotService extends TarotService {
  constructor(private readonly deck: ReturnType<typeof makeDeck>) {
    super();
  }

  override async getDefaultDeck() {
    return this.deck;
  }
}

const originalRandom = Math.random;

afterEach(() => {
  Math.random = originalRandom;
  vi.restoreAllMocks();
});

describe("TarotService drawCards", () => {
  it("draws the expected number of cards and positions", async () => {
    // deterministic sequence: first 9 values for shuffle (keep order), next for orientations
    const randomValues = [
      ...Array(9).fill(0), // shuffle no-op
      0.25, // card 0 upright
      0.75, // card 1 reversed
      0.25, // card 2 upright
    ];
    let idx = 0;
    Math.random = () => randomValues[idx++] ?? 0.1;

    const service = new TestTarotService(makeDeck(10));
    const result = await service.drawCards("three");

    expect(result).toHaveLength(SPREAD_CONFIGS.three.cardCount);
    expect(result.map((c) => c.positionRole)).toEqual([
      "passado",
      "presente",
      "futuro",
    ]);
    // TypeScript guard: array length already asserted above
    const [card0, card1] = result;
    expect(card0?.orientation).toBe("upright");
    expect(card1?.orientation).toBe("reversed");
  });

  it("throws when deck is too small", async () => {
    const service = new TestTarotService(makeDeck(1));
    await expect(service.drawCards("five")).rejects.toThrow(
      ValidationError
    );
  });

  it("throws when spread positions are missing", async () => {
    // Patch spread config for this test to simulate missing positions
    const backup = [...SPREAD_CONFIGS.five.positions];
    SPREAD_CONFIGS.five.positions.splice(3); // remove positions after index 2

    const service = new TestTarotService(makeDeck(10));
    await expect(service.drawCards("five")).rejects.toThrow(
      "Spread configuration missing position"
    );

    SPREAD_CONFIGS.five.positions = backup;
  });
});
