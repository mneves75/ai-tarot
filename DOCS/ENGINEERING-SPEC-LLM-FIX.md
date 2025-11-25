# AI Tarot LLM Integration Fix - Engineering Spec (V6)

This spec follows DOCS/GUIDELINES-REF (ExecPlans, Dev, Security, TypeScript). Self-contained for newcomer handoff.

## Executive Summary

Critical production issues affecting tarot readings:
1. **Gemini model deprecated**: `gemini-1.5-flash` returns 404 errors
2. **Zod v4 incompatibility**: Vercel AI SDK's `generateObject` does NOT work with Zod v4
3. **Tarot cards not appearing**: Consequence of both LLM providers failing

**Root Cause**: Package version mismatches between Zod v4 and AI SDK dependencies.

## Current State & Issues

### Error 1: Gemini Model Not Found
```json
{"level":"warn","message":"Gemini failed, falling back to OpenAI",
 "error":"models/gemini-1.5-flash is not found for API version v1beta..."}
```
**Cause**: `gemini-1.5-flash` deprecated/unavailable via `@ai-sdk/google` v2.

### Error 2: OpenAI Schema Mismatch
```json
{"level":"error","message":"All LLM providers failed",
 "openaiError":"No object generated: response did not match schema."}
```
**Cause**: Zod v4 incompatible with `zod-to-json-schema` used by AI SDK. See [GitHub Issue #7291](https://github.com/vercel/ai/issues/7291).

### Issue 3: Tarot Cards Not Appearing
**Not a bug** - cards appear when LLM succeeds. Issue is cascade failure from above.

## Root Cause Analysis

### First Principles Thinking

1. **Why does Gemini fail?**
   - The model ID `gemini-1.5-flash` is either deprecated or not available in v1beta API
   - Solution: Use stable model `gemini-2.0-flash`

2. **Why does OpenAI fail with schema mismatch?**
   - Vercel AI SDK uses `zod-to-json-schema` internally
   - Zod v4 removed/renamed `ZodFirstPartyTypeKind` export
   - This breaks JSON schema generation entirely
   - Solution: Downgrade to Zod v3.25.76

3. **Why did this break?**
   - Zod v4 was a major breaking change (June 2025)
   - AI SDK hasn't updated `zod-to-json-schema` dependency yet
   - Package manager resolved to incompatible version

4. **What would we do better?**
   - Pin exact versions for critical dependencies
   - Add integration tests that call real LLM endpoints
   - Monitor dependency compatibility via CI

## Design Options (5 Options Analyzed)

### Option 1: Downgrade Zod to v3 + Update Gemini Model
**Pros**: Minimal changes, follows working patterns
**Cons**: Lose Zod v4 features (minor)
**Risk**: Low - well-documented fix
**Selected**: YES

### Option 2: Use AI SDK's `jsonSchema()` instead of Zod
**Pros**: Avoids Zod dependency entirely
**Cons**: Lose type inference, more verbose
**Risk**: Medium - requires rewriting schema definitions
**Selected**: NO

### Option 3: Wait for AI SDK Zod v4 Support
**Pros**: No code changes needed
**Cons**: Unknown timeline, production is broken NOW
**Risk**: High - unacceptable for production
**Selected**: NO

### Option 4: Fork zod-to-json-schema with Zod v4 Support
**Pros**: Keeps Zod v4
**Cons**: Maintenance burden, complexity
**Risk**: High - not sustainable
**Selected**: NO

### Option 5: Use Manual JSON Schema Definition
**Pros**: No dependency issues
**Cons**: Duplicates schema definition, loses validation
**Risk**: Medium - schema drift possible
**Selected**: NO

## Implementation Plan

### Phase 1: Dependency Fix (Critical)

**Task 1.1**: Downgrade Zod from v4 to v3.25.76
```bash
pnpm remove zod
pnpm add zod@3.25.76
```

**Task 1.2**: Update imports if needed (Zod v4 → v3 migration)
- Check for Zod v4-specific APIs (unlikely in current codebase)
- Verify all schema definitions still work

### Phase 2: LLM Service Fix

**Task 2.1**: Update Gemini model from `gemini-1.5-flash` to `gemini-2.0-flash`
```typescript
// src/lib/llm/service.ts line 132
// OLD: return google("gemini-1.5-flash");
// NEW: return google("gemini-2.0-flash");
```

**Task 2.2**: Update cost tracking configuration
```typescript
// Update COST_PER_MILLION_TOKENS to use gemini-2.0-flash
const COST_PER_MILLION_TOKENS = {
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
};
```

**Task 2.3**: Update model name in logging
```typescript
// Line 167: const modelName = "gemini-2.0-flash";
```

### Phase 3: Schema Robustness

**Task 3.1**: Review schema constraints for LLM compatibility
- `interpretation.min(50)` might be too strict
- Consider relaxing to `min(20)` for edge cases

**Task 3.2**: Add error context for schema validation failures
```typescript
// Add detailed logging when schema validation fails
if (!result.success) {
  structuredLog("error", "Schema validation failed", {
    errors: result.error.issues,
    rawResponse: response.slice(0, 500),
  });
}
```

### Phase 4: Testing

**Task 4.1**: Update existing LLM schema tests for Zod v3

**Task 4.2**: Add integration test for LLM service (mocked)
```typescript
// src/__tests__/lib/llm/service.test.ts
describe("LLM Service", () => {
  it("should generate reading with valid schema", async () => {
    // Mock generateObject
    // Verify output matches schema
  });
});
```

**Task 4.3**: Verify all 131 existing tests pass

### Phase 5: Validation

**Task 5.1**: Run full test suite
```bash
pnpm test:run
```

**Task 5.2**: Run lint/typecheck
```bash
pnpm lint && pnpm typecheck
```

**Task 5.3**: Manual testing of demo page
- Submit reading request
- Verify cards appear
- Verify interpretation displays

## Acceptance Criteria

1. [ ] Demo page generates readings successfully
2. [ ] Gemini is primary provider (lower cost)
3. [ ] OpenAI fallback works when Gemini fails
4. [ ] All 131+ tests pass
5. [ ] Lint passes with no warnings
6. [ ] Tarot cards display with interpretations

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Zod downgrade breaks other code | Medium | Run full test suite |
| Gemini 2.0 behaves differently | Low | Test output quality |
| Schema still too strict | Low | Monitor logs, adjust if needed |

## Files to Modify

1. `package.json` - Zod version
2. `pnpm-lock.yaml` - Lock file update
3. `src/lib/llm/service.ts` - Model names, cost config
4. `src/lib/llm/schemas.ts` - Potential constraint relaxation
5. `src/__tests__/lib/llm/service.test.ts` - New test file

## Success Metrics

- LLM success rate > 99% (currently 0% for Gemini, ~50% for OpenAI)
- Latency < 15s for single card reading
- Cost per reading < $0.001

## References

- [Zod v4 Incompatibility Issue](https://github.com/vercel/ai/issues/7291)
- [AI SDK Gemini Models](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [Google AI Model List](https://ai.google.dev/gemini-api/docs/models)

---

**Author**: Claude Code
**Created**: 2025-11-25
**Status**: Ready for Implementation
