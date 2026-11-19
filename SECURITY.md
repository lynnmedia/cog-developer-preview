# Security Policy

Lynn Media takes the security of open-source software seriously. This policy outlines how to report security vulnerabilities and clarifies support expectations for the Cog Developer Preview.

---

## 1. Supported Versions

| Package | Version Range | Security Support Status |
|---|---|---|
| `@winmedia/cog-core` | `0.3.x` (Developer Preview) | Best-Effort Active Inspection |
| `@winmedia/cog-adapter-mom` | `0.3.x` (Developer Preview) | Best-Effort Active Inspection |
| `@winmedia/cog-adapter-decision` | `0.3.x` (Developer Preview) | Best-Effort Active Inspection |
| `cog-vscode-extension` | `0.1.x` (Developer Preview) | Best-Effort Active Inspection |
| Prior versions | `< 0.3.0` | Unsupported |

> **Developer Preview Notice**: Cog is currently in Developer Preview. While security reports are promptly evaluated, enterprise SLA guarantees and backports for legacy minor versions are not provided at this preview stage.

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or sensitive residue in Cog:

1. **Do NOT open a public GitHub issue.**
2. Report the vulnerability privately via **GitHub Security Advisories** on the repository, or email **security@lynnmedia.com**.
3. Include the following details in your report:
   - Package name and version.
   - Detailed description of the vulnerability and attack vector.
   - Proof of Concept (PoC) or reproducible `.cog` source code.
   - Potential impact of the issue.

---

## 3. Vulnerability Response Timeline

- **Acknowledgment**: Within 3 business days of receiving the report.
- **Triage & Assessment**: Within 7 business days.
- **Fix & Disclosure**: Coordinated disclosure with credit attributed to the reporter upon patch release.
