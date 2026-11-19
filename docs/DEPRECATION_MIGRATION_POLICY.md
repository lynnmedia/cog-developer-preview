# Cog Deprecation and Migration Policy

This document defines how deprecations and migrations are handled across all `cog` surfaces (DSL syntax, APIs, libraries, adapters, and tools).

## 1. Notice and Annotation Expectations

When a feature or surface is marked for deprecation:
1. **Source Code Annotation**: The TypeScript code must be decorated with `@deprecated` JSDoc comments detailing the replacement or alternative.
2. **Release Notes Documentation**: The deprecation must be clearly documented in the release notes under a dedicated `Deprecations` section.
3. **Runtime Warning (Optional)**: If the deprecated feature is used in execution, the kernel should log a non-blocking warning (when run context allows).

---

## 2. Compatibility Windows

Deprecated features are guaranteed support over a minimum window before removal:
- **Syntax and IR Schema**: Must be supported for at least one full minor version cycle, with removal only allowed in the subsequent major release.
- **Core APIs and Hooks**: Must remain functional until the next major version release.
- **Domain Libraries and Examples**: Evolving/experimental examples have a shorter window and may be updated or removed in minor version releases.

---

## 3. Migration Guidance

Any deprecation announcement must provide:
- A clear explanation of why the change is occurring.
- Step-by-step instructions on how downstream consumers should migrate.
- A functional alternative that is already active and tested in the current release.

---

## 4. Removal Gates

Deprecations culminate in a removal gate:
- Features can only be removed in **MAJOR** version releases.
- All unit tests and downstream adapters must be verified as fully migrated before the removal gate is closed.
