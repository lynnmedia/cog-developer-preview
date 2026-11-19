# Contributing to Cog

Thank you for your interest in contributing to Cog! Cog is an ontology-agnostic cognition kernel and language for deterministic cognitive specifications.

---

## 1. Constitutional Principles

1. **Kernel Ontology Agnosticism**: The Core language (`@cog/core`) must not assume or hardcode any domain ontology or application-specific semantics. Domain concerns belong in domain libraries or custom adapters.
2. **Deterministic Execution**: All language execution, planning, and validation must produce deterministic, reproducible outcomes.
3. **Rigorous Boundaries**: Workspace packages maintain clear separation between Core, Standard Library, Developer Tools, and Domain Adapters.

---

## 2. Local Development & Testing

### Prerequisites
- **Node.js**: `20.x`
- **npm**: `>=10`

### Build and Test Commands
```bash
# Clean install
npm install

# Build core and workspaces
npm run build
npm run build:v0.3

# Run test suites
npm test
npm run test:v0.3

# Run release validation and isolated consumer proofs
npm run validate:release
```

---

## 3. Pull Request Guidelines

- All new features or routines must include deterministic tests.
- Maintain the locked public API boundary on `@cog/core`.
- Run `npm run validate:release` and ensure all tests pass cleanly before submitting a PR.
