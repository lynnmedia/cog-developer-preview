# Cog Developer Preview Source Publication

The first commit preserves the approved source baseline tree
`1252b312be658b32870a1538de1cc3e9f95286c6`. The public Developer Preview
sources on `main` come from the 0.3.0 package source tag, commit
`6a83d25ee73d492d0f0c578e8846b969d37556d0`. They include the TypeScript
kernel, command-line tools, optional adapters, VS Code tooling, tests, and
runnable examples.

The public checkout points repository metadata here and gives readers a
source-first example. The lockfile adds registry checksums without changing
dependency versions. The test command schedules package-building tests serially
so they do not overwrite shared build outputs. The clean-clone verifier
includes the scoped-tarball filename correction.

See the root README for installation and [the MIT license](../../LICENSE) for
reuse terms.

Commit SHA `FINAL_COMMIT_SHA_REPORTED_IN_CHAT`
