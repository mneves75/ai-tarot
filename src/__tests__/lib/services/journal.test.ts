import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * HIGH-4: Journal Deletion Authorization Tests
 *
 * These tests verify that journal deletion includes defense-in-depth
 * ownership verification via JOIN queries and proper audit logging.
 */

// Mock audit logger
const mockAuditLog = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/audit/logger", () => ({
  auditLog: (params: unknown) => mockAuditLog(params),
}));

// Mock drizzle database operations
const mockDb = vi.hoisted(() => {
  const returningMock = vi.fn();
  const whereMock = vi.fn(() => ({ returning: returningMock }));
  const setMock = vi.fn(() => ({ where: whereMock }));
  const updateMock = vi.fn(() => ({ set: setMock }));
  const limitMock = vi.fn();
  const selectWhereMock = vi.fn(() => ({ limit: limitMock }));
  const innerJoinMock = vi.fn(() => ({ where: selectWhereMock }));
  const fromMock = vi.fn(() => ({
    innerJoin: innerJoinMock,
    where: selectWhereMock,
  }));
  const selectMock = vi.fn(() => ({ from: fromMock }));

  return {
    select: selectMock,
    update: updateMock,
    fromMock,
    innerJoinMock,
    selectWhereMock,
    limitMock,
    setMock,
    whereMock,
    returningMock,
  };
});

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/db/schema", () => ({
  readingJournals: { id: "id", readingId: "readingId", userId: "userId", deletedAt: "deletedAt" },
  readings: { id: "id", userId: "userId", deletedAt: "deletedAt" },
}));

// Mock validation
vi.mock("@/lib/validation", () => ({
  assertValidUuid: vi.fn(),
}));

describe("journal service - HIGH-4 security fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteJournalEntry - defense-in-depth", () => {
    it("uses JOIN query to verify both journal and reading ownership", async () => {
      // Setup mock to simulate successful ownership verification
      mockDb.limitMock.mockResolvedValueOnce([
        { id: "journal-123", readingId: "reading-456" },
      ]);
      mockDb.returningMock.mockResolvedValueOnce([{ id: "journal-123" }]);

      // Import after mocks are set up
      const { deleteJournalEntry } = await import("@/lib/services/journal");

      await deleteJournalEntry("journal-123", "user-789");

      // Verify SELECT was called (for ownership check)
      expect(mockDb.select).toHaveBeenCalled();

      // Verify innerJoin was used (defense-in-depth)
      expect(mockDb.innerJoinMock).toHaveBeenCalled();
    });

    it("returns false and logs warning when journal not found", async () => {
      // Setup mock to simulate journal not found
      mockDb.limitMock.mockResolvedValueOnce([]);

      const { deleteJournalEntry } = await import("@/lib/services/journal");

      const result = await deleteJournalEntry("nonexistent-journal", "user-789");

      expect(result).toBe(false);

      // Verify audit log was called with warning
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "journal.delete.not_found",
          level: "warn",
          success: false,
        })
      );
    });

    it("returns false when user does not own the reading", async () => {
      // Mock returns empty - simulates user not owning the reading
      // The JOIN query fails to find matching records
      mockDb.limitMock.mockResolvedValueOnce([]);

      const { deleteJournalEntry } = await import("@/lib/services/journal");

      const result = await deleteJournalEntry("journal-123", "wrong-user");

      expect(result).toBe(false);

      // Verify audit log was called
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "journal.delete.not_found",
          level: "warn",
          userId: "wrong-user",
        })
      );
    });

    it("logs successful deletion with reading ID in metadata", async () => {
      // Setup mock for successful deletion
      mockDb.limitMock.mockResolvedValueOnce([
        { id: "journal-123", readingId: "reading-456" },
      ]);
      mockDb.returningMock.mockResolvedValueOnce([{ id: "journal-123" }]);

      const { deleteJournalEntry } = await import("@/lib/services/journal");

      const result = await deleteJournalEntry("journal-123", "user-789");

      expect(result).toBe(true);

      // Verify success audit log includes reading ID
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "journal.delete.success",
          level: "info",
          success: true,
          metadata: expect.objectContaining({
            readingId: "reading-456",
          }),
        })
      );
    });

    it("performs soft delete by setting deletedAt timestamp", async () => {
      // Setup mock for successful deletion
      mockDb.limitMock.mockResolvedValueOnce([
        { id: "journal-123", readingId: "reading-456" },
      ]);
      mockDb.returningMock.mockResolvedValueOnce([{ id: "journal-123" }]);

      const { deleteJournalEntry } = await import("@/lib/services/journal");

      await deleteJournalEntry("journal-123", "user-789");

      // Verify UPDATE was called with deletedAt
      expect(mockDb.setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        })
      );
    });
  });

  describe("attack scenarios", () => {
    it("blocks IDOR attempt - user tries to delete another user's journal", async () => {
      // Attacker knows a valid journal ID but doesn't own the reading
      // The JOIN query ensures both conditions must match
      mockDb.limitMock.mockResolvedValueOnce([]);

      const { deleteJournalEntry } = await import("@/lib/services/journal");

      // Attacker user-attacker tries to delete journal owned by user-victim
      const result = await deleteJournalEntry("victim-journal-id", "user-attacker");

      expect(result).toBe(false);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "warn",
          userId: "user-attacker",
          resourceId: "victim-journal-id",
        })
      );
    });

    it("blocks deletion of already-deleted journals", async () => {
      // Journal exists but has deletedAt set (soft deleted)
      // The WHERE clause includes isNull(deletedAt), so no result
      mockDb.limitMock.mockResolvedValueOnce([]);

      const { deleteJournalEntry } = await import("@/lib/services/journal");

      const result = await deleteJournalEntry("already-deleted-journal", "user-789");

      expect(result).toBe(false);
    });

    it("blocks deletion when reading is soft-deleted", async () => {
      // Journal exists, but the reading has been soft-deleted
      // JOIN fails because readings.deletedAt is not null
      mockDb.limitMock.mockResolvedValueOnce([]);

      const { deleteJournalEntry } = await import("@/lib/services/journal");

      const result = await deleteJournalEntry("orphan-journal", "user-789");

      expect(result).toBe(false);
    });
  });
});
