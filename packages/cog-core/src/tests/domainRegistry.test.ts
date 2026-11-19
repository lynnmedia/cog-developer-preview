import assert from "node:assert/strict";
import test from "node:test";
import { domainRegistry } from "../domain/registry";
import type { DomainLibrary } from "../domain/contract";

const mockLibrary: DomainLibrary = {
  id: "cog:domain:mock",
  name: "Mock Library",
  description: "A test mock library",
  capabilities: ["research-synthesis"],
  supportedPatterns: ["mock-pattern"],
  generate(params) {
    return `// Mock program for ${params.topic}`;
  },
};

test("Domain registry can register, retrieve, list and filter domain libraries", () => {
  // Initially, standard libraries might be registered or empty. Let's register our mock.
  domainRegistry.register(mockLibrary);

  // Retrieve mock library
  const retrieved = domainRegistry.getLibrary("cog:domain:mock");
  assert.ok(retrieved);
  assert.equal(retrieved.id, "cog:domain:mock");
  assert.equal(retrieved.name, "Mock Library");
  assert.equal(retrieved.generate({ topic: "AI" }), "// Mock program for AI");

  // Retrieve via capability
  const withCapability = domainRegistry.getLibrariesByCapability("research-synthesis");
  assert.ok(withCapability.some((lib) => lib.id === "cog:domain:mock"));

  // Retrieve via non-existing ID returns undefined
  const notFound = domainRegistry.getLibrary("cog:domain:non-existent");
  assert.equal(notFound, undefined);

  // List libraries returns registry info with validationStatus
  const list = domainRegistry.listLibraries();
  const info = list.find((lib) => lib.id === "cog:domain:mock");
  assert.ok(info);
  assert.equal(info.validationStatus, "valid");
});
