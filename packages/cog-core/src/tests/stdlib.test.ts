import assert from "node:assert/strict";
import test from "node:test";
import {
  observe,
  identify,
  compare,
  classify,
  relate,
  group,
  project,
  resolve,
  evaluate,
  explain,
  compose,
} from "../index";

test("stdlib observe creates an entity observation shape", () => {
  const obs = observe("obs-001", "observation", { temp: 22 });
  assert.deepEqual(obs, {
    id: "obs-001",
    name: "obs-001",
    entityKind: "observation",
    attributes: { temp: 22 },
  });
});

test("stdlib identify returns unique descriptor", () => {
  const entity = observe("ent-001", "person", { name: "Alice" });
  assert.equal(identify(entity), "person:ent-001:name=Alice");
});

test("stdlib compare detects differences", () => {
  const e1 = observe("ent-001", "person", { name: "Alice", age: 30 });
  const e2 = observe("ent-001", "person", { name: "Alice", age: 31 });
  const diff = compare(e1, e2);
  assert.deepEqual(diff.added, []);
  assert.deepEqual(diff.removed, []);
  assert.deepEqual(diff.modified, ["age"]);
});

test("stdlib classify changes kind", () => {
  const entity = observe("ent-001", "person", { name: "Alice" });
  const updated = classify(entity, "user");
  assert.equal(updated.entityKind, "user");
});

test("stdlib relate creates a relation structure", () => {
  const rel = relate("rel-001", "friend", "ent-001", "ent-002", { close: true });
  assert.deepEqual(rel, {
    id: "rel-001",
    relationKind: "friend",
    sourceRef: "ent-001",
    targetRef: "ent-002",
    attributes: { close: true },
  });
});

test("stdlib group clusters entities by key", () => {
  const e1 = observe("e1", "item", { category: "A" });
  const e2 = observe("e2", "item", { category: "B" });
  const e3 = observe("e3", "item", { category: "A" });
  const grouped = group([e1, e2, e3], "category");
  assert.deepEqual(grouped, {
    A: [e1, e3],
    B: [e2],
  });
});

test("stdlib project filters entity attributes", () => {
  const entity = observe("e1", "item", { category: "A", price: 10, stock: 5 });
  const projected = project(entity, ["price", "stock"]);
  assert.deepEqual(projected.attributes, { price: 10, stock: 5 });
  assert.equal(projected.attributes.category, undefined);
});

test("stdlib resolve creates a resolution", () => {
  const res = resolve("res-001", "e1", "L3", { active: true });
  assert.deepEqual(res, {
    id: "res-001",
    targetRef: "e1",
    resolutionRef: "L3",
    value: "L3",
    attributes: { active: true },
  });
});

test("stdlib evaluate runs a rule", () => {
  const result = evaluate("price > 5", { price: 10 });
  assert.equal(result, true);
});

test("stdlib explain provides issue explanations", () => {
  const msg = explain({ message: "Entity missing kind", code: "ERR_KIND" });
  assert.match(msg, /ERR_KIND/);
});

test("stdlib compose combines structures", () => {
  const base = { a: 1 };
  const extension = { b: 2 };
  const result = compose(base, extension);
  assert.deepEqual(result, { a: 1, b: 2 });
});
