# Canonical Program Catalog

This catalog serves as the definitive reference for all canonical cognition programs in `cog`, organized by category: Primitives, Pipelines, Graphs, Adapters, and Applications.

---

## 1. Primitives

Primitives demonstrate the atomic semantic operations of the `.cog` language.

### Observation (`canonical-observation.cog`)
- **Purpose**: Demonstrate entity observation capture.
- **Cognitive Concepts**: Grounding state through explicit context sensing.
- **Language Features**: `define entity`, level declarations, entity kind mapping.
- **Expected Planning Behavior**: Creates a `bind` step mapping target to source.
- **Expected Execution Behavior**: Successfully executes and registers entity.
- **Expected Emissions**: Emits observed attributes payload.
- **Expected Traces**: Standard execution trace for binding and emission.
- **Adapter Behavior**: Neutral across adapters unless overridden by kind mappings.
- **Related Canonical Examples**: `canonical-identification.cog`.

### Identification (`canonical-identification.cog`)
- **Purpose**: Verify entity identification properties.
- **Cognitive Concepts**: Unique identity based on entity signature.
- **Language Features**: Identity assignment, attribute equivalence.
- **Expected Planning Behavior**: Generates deterministic mapping structure.
- **Expected Execution Behavior**: Entities with matching attributes are recognized as identical.
- **Expected Emissions**: Deterministic signature identity.
- **Related Canonical Examples**: `canonical-observation.cog`.

### Comparison (`canonical-comparison.cog`)
- **Purpose**: Compare two entities to check for differences.
- **Cognitive Concepts**: Cognitive delta detection between two states.
- **Language Features**: `relate` statement with `differs-from` relation kind.
- **Expected Planning Behavior**: Formulates compare step mapping target properties.
- **Expected Execution Behavior**: Computes differences in defined fields.
- **Expected Emissions**: Comparison delta structure.
- **Related Canonical Examples**: `canonical-observe-to-resolve-pipeline.cog`.

### Classification (`canonical-classification.cog`)
- **Purpose**: Classify an entity, altering its category or kind.
- **Cognitive Concepts**: Category assignment based on contextual parameters.
- **Language Features**: Kind reassignment, classification validation.
- **Expected Planning Behavior**: Generates binding and classification phase mappings.
- **Expected Execution Behavior**: Reassigns entity kind while preserving core properties.
- **Expected Emissions**: Classified entity attributes.
- **Related Canonical Examples**: `canonical-relation.cog`.

### Relation (`canonical-relation.cog`)
- **Purpose**: Relate two entities.
- **Cognitive Concepts**: Inter-entity associations and graph links.
- **Language Features**: `relate` statement.
- **Expected Planning Behavior**: Inserts dependency path in execution graph.
- **Expected Execution Behavior**: Links source and target nodes.
- **Expected Emissions**: Structural relation metadata.
- **Related Canonical Examples**: `canonical-dependency-graph.cog`.

### Projection (`canonical-projection.cog`)
- **Purpose**: Project a view filtering entity attributes.
- **Cognitive Concepts**: Attribute filtration and abstract view generation.
- **Language Features**: `view` statement with projection parameters.
- **Expected Planning Behavior**: Inserts filter step before emission.
- **Expected Execution Behavior**: Generates filtered view structure.
- **Expected Emissions**: Projected view output.
- **Related Canonical Examples**: `canonical-perspective-graph.cog`.

### Resolution (`canonical-resolution.cog`)
- **Purpose**: Resolve an entity to a higher cognitive level.
- **Cognitive Concepts**: Upward level progression (L1 -> L2, etc.).
- **Language Features**: `resolve` statement.
- **Expected Planning Behavior**: Sequences bind steps before resolution steps.
- **Expected Execution Behavior**: Updates target entity level.
- **Expected Emissions**: Resolved entity level output.
- **Related Canonical Examples**: `canonical-observe-to-resolve-pipeline.cog`.

### Constraint (`canonical-constraint.cog`)
- **Purpose**: Enforce constraints on entity attributes.
- **Cognitive Concepts**: Governance boundaries and semantic rules.
- **Language Features**: `constrain` block.
- **Expected Planning Behavior**: Places constraint validation step prior to emission.
- **Expected Execution Behavior**: Evaluates constraint parameters.
- **Expected Emissions**: Constraint validation status.
- **Related Canonical Examples**: `canonical-constraint-evaluation.cog`.

### Transformation (`canonical-transformation.cog`)
- **Purpose**: Transform entity attributes.
- **Cognitive Concepts**: State mutation and normalization.
- **Language Features**: `transform` block.
- **Expected Planning Behavior**: Injects transformation phase mapping.
- **Expected Execution Behavior**: Mutates value attributes.
- **Expected Emissions**: Transformed state metrics.
- **Related Canonical Examples**: `canonical-transformation-pipeline.cog`.

### Emission (`canonical-emission.cog`)
- **Purpose**: Emit final output structures.
- **Cognitive Concepts**: Terminal results projection.
- **Language Features**: `emit` block.
- **Expected Planning Behavior**: Generates final `emit` step.
- **Expected Execution Behavior**: Dispatches output payload.
- **Expected Emissions**: Complete projection output.
- **Related Canonical Examples**: `canonical-projection.cog`.

---

## 2. Pipelines

Pipelines compose multiple primitive operations sequentially.

### Observe-to-Resolve Pipeline (`canonical-observe-to-resolve-pipeline.cog`)
- **Purpose**: Model full L1 -> L2 reasoning chain based on comparisons.
- **Cognitive Concepts**: Observation validation, comparison, and resolution governance.
- **Language Features**: `define entity`, `relate`, `constrain`, `resolve`, `emit`.
- **Expected Planning Behavior**: Standard pipeline ordering (bind -> transform -> validate -> emit).
- **Expected Execution Behavior**: Observation diff triggers constraint evaluation and level resolution.
- **Expected Emissions**: Resolved level representation.

### Classify-and-Relate Pipeline (`canonical-classify-and-relate.cog`)
- **Purpose**: Sequence classification followed by relation mapping.
- **Cognitive Concepts**: Grouping entities before linking them.
- **Language Features**: Multi-statement pipeline sequence.
- **Expected Planning Behavior**: Sequences classification steps before relation mapping.
- **Expected Execution Behavior**: Reassigns kinds and links resulting nodes.

### Constraint-Evaluation Pipeline (`canonical-constraint-evaluation.cog`)
- **Purpose**: Model constraint validation gates prior to resolution.
- **Cognitive Concepts**: Conditional resolution based on structural properties.
- **Language Features**: Nested constraint rules.
- **Expected Planning Behavior**: Inserts validation gate before resolution execution.

### Transformation Pipeline (`canonical-transformation-pipeline.cog`)
- **Purpose**: Normalize raw data and compare against pre-transformation state.
- **Cognitive Concepts**: Data normalization feedback loop.
- **Language Features**: `transform` and `relate` back-references.
- **Expected Planning Behavior**: Sequence transform before relate.

---

## 3. Graphs

Graphs model complex non-linear semantic structures and dependency networks.

### Dependency Graph (`canonical-dependency-graph.cog`)
- **Purpose**: Verify planning order for hierarchical entities.
- **Cognitive Concepts**: Execution planning based on structural dependencies.
- **Language Features**: Nested relates.
- **Expected Planning Behavior**: Topologically sorts steps based on relationships.

### Multi-Relation Graph (`canonical-multi-relation-graph.cog`)
- **Purpose**: Map multiple relationship types between the same entities.
- **Cognitive Concepts**: Rich semantic graph representations.
- **Language Features**: Overlapping `relate` definitions.
- **Expected Planning Behavior**: Evaluates distinct paths concurrently.

### Perspective Graph (`canonical-perspective-graph.cog`)
- **Purpose**: Expose alternative views based on active adapter mapping.
- **Cognitive Concepts**: Adaptable perspectives on the same underlying data.
- **Language Features**: `view` statements and mapped views.
- **Expected Planning Behavior**: Applies view-mapping projections dynamically.

### Multi-Entity Resolution (`canonical-multi-entity-resolution.cog`)
- **Purpose**: Resolve several entities across level boundaries in a single program.
- **Cognitive Concepts**: Multi-entity level orchestration.
- **Language Features**: Multiple `resolve` statements.
- **Expected Planning Behavior**: Groups resolutions by logical dependencies.

---

## 4. Adapters

Adapters demonstrate projection of neutral kernel structures into domain-specific frameworks.

### Adapter View Divergence (`adapter-view-divergence.cog`)
- **Purpose**: Prove view projections differ across adapters.
- **Expected Planning/Execution Behavior**:
  - **No Adapter**: Keeps view names neutral (`advisory`).
  - **MoM Adapter**: Maps views to MoM namespace (`mom:advisory`).
  - **Decision Adapter**: Maps views to Decision namespace (`decision:advisory`).

### Canonical Adapter Reference (`canonical-adapter-reference.cog`)
- **Purpose**: Act as the reference baseline for adapter evaluation.
- **Expected Planning/Execution Behavior**:
  - **No Adapter**: Level L3 is unmapped, target is plain entity, relations are neutral.
  - **MoM Adapter**: Level L3 maps to R3, relation maps to `mom:recommends`, custom planning step `step-mom-verify` injected.
  - **Decision Adapter**: Level L3 remains unmapped, relation maps to `decision:recommends`, custom planning step `step-decision-verify` injected.

---

## 5. Applications

Applications model high-level cognitive processes and reference reasoning workloads.

### Research Synthesis (`canonical-research-synthesis.cog`)
- **Purpose**: Model declarative information extraction, clustering, and synthesis.
- **Cognitive Concepts**: Observe Sources → Extract Claims → Compare → Cluster → Resolve → Emit.
- **Language Features**: Complete declarative statement surface.
- **Expected Planning Behavior**: Topologically plans claim extraction prior to cluster grouping and conclusion resolution.
- **Expected Execution Behavior**: Collects raw facts, claims, clusters, and yields final synthesis emission.
- **Related Canonical Examples**: `canonical-knowledge-graph.cog`.

### Document Review (`canonical-document-review.cog`)
- **Purpose**: Model editorial review and drift detection.
- **Cognitive Concepts**: Observe → Compare → Detect Drift → Resolve → Explain.
- **Language Features**: Comparison and explanation structures.
- **Expected Planning Behavior**: Plans drift detection, resolution action, and explanation generation sequentially.
- **Expected Execution Behavior**: Reconciles draft document with golden model and logs reasoning explanation.

### Decision Workflow (`canonical-decision-workflow.cog`)
- **Purpose**: Model structured decision analysis.
- **Cognitive Concepts**: Observe → Evaluate → Constrain → Resolve → Emit.
- **Language Features**: Multi-criteria constraint rules.
- **Expected Planning Behavior**: Sequences metric observations, alternative evaluations, threshold constraint checks, and final resolution.

### Audit Workflow (`canonical-audit-workflow.cog`)
- **Purpose**: Model declarative software or process audit.
- **Cognitive Concepts**: Observe Repository → Identify Findings → Relate Findings → Resolve Severity → Emit Report.
- **Language Features**: Complex finding relationships (`blocks`).
- **Expected Planning Behavior**: Sorts findings based on inter-dependencies, resolves severity, and schedules report emission.

### Knowledge Graph (`canonical-knowledge-graph.cog`)
- **Purpose**: Construct semantic knowledge graphs and generate correlation explanations.
- **Cognitive Concepts**: Observe → Identify → Relate → Cluster → Explain.
- **Language Features**: Double `identifies` and `clustered-into` patterns.
- **Expected Planning Behavior**: Groups nodes into clusters, validates schema path, and plans explanation.
