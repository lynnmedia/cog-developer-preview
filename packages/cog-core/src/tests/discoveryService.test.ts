import assert from "node:assert/strict";
import test from "node:test";
import { DiscoveryService } from "../service/discoveryService";

test("DiscoveryService lists registered libraries with metadata", () => {
  const service = new DiscoveryService();
  const list = service.discoverLibraries();

  assert.ok(list.length > 0);
  const research = list.find((lib) => lib.id === "cog:domain:research");
  assert.ok(research);
  assert.equal(research.name, "Research Synthesis Library");
});

test("DiscoveryService retrieves contract info for specific library", () => {
  const service = new DiscoveryService();
  const contract = service.getLibraryContract("cog:domain:research");

  assert.ok(contract);
  assert.equal(contract.id, "cog:domain:research");
  assert.ok(contract.capabilities.includes("research-synthesis"));
});
