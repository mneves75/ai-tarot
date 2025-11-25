# Changelog

All notable changes to AI Tarot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **LLM Integration**: Resolved critical issues preventing tarot readings from completing
  - Downgraded Zod from v4.1.13 to v3.25.76 (AI SDK incompatibility with Zod v4)
  - Updated Gemini model from `gemini-1.5-flash` to `gemini-2.0-flash` (deprecated model)
  - Fixed cost tracking configuration for new model pricing

### Added
- Comprehensive LLM service test suite (11 new tests)
- Engineering spec documenting the LLM fix (`DOCS/ENGINEERING-SPEC-LLM-FIX.md`)

### Changed
- Updated cost per million tokens for `gemini-2.0-flash`: input $0.10, output $0.40

## [0.1.0] - 2025-11-25

### Added
- Initial release with core tarot reading functionality
- AI-powered card interpretations using Gemini (primary) and OpenAI (fallback)
- Support for 1, 3, and 5 card spreads
- Bilingual support (pt-BR, en-US)
- Guest reading quota system
- Credit-based reading system for authenticated users
- Demo page for unauthenticated users
- Supabase Auth integration with RLS
- Audit logging for all reading operations
- Rate limiting protection
