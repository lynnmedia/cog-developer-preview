# Domain Library Catalog

This catalog documents the available cognitive domain libraries, pipelines, proofs, and capabilities in the `cog` repository.

---

## 1. Domain Libraries

### Research Synthesis Library (`cog:domain:research`)
- **Purpose**: Declarative information extraction, claim analysis, and thematic synthesis.
- **Capabilities**: `research-synthesis`
- **Supported Patterns**:
  - `source-to-claim`: Extract claims from raw text source observations.
  - `claim-clustering`: Compare and group claims into semantic clusters.
  - `synthesis-resolution`: Resolve claims to a synthesized thematic conclusion.

### Editorial Review Library (`cog:domain:editorial`)
- **Purpose**: Document quality control, comparison against golden baselines, and drift mitigation.
- **Capabilities**: `document-review`
- **Supported Patterns**:
  - `drift-detection`: Identify delta differences between draft and golden documents.
  - `reconciliation-action`: Map detected drift to concrete corrective actions.
  - `editorial-explanation`: Produce structured audit justifications explaining why changes were resolved.

### Decision Analysis Library (`cog:domain:decision`)
- **Purpose**: Multi-criteria option evaluation, constraint enforcement, and formal approval loops.
- **Capabilities**: `decision-analysis`
- **Supported Patterns**:
  - `alternative-evaluation`: Map raw parameters to distinct selectable alternatives.
  - `metric-constraint`: Enforce numeric boundaries and strict rules on selected alternatives.
  - `decision-resolution`: Formal approval transition matching criteria outcomes.

### Audit Reasoning Library (`cog:domain:audit`)
- **Purpose**: Process-level compliance and vulnerability finding trace maps.
- **Capabilities**: `audit-reasoning`
- **Supported Patterns**:
  - `finding-identification`: Flag policy violations from workspace observations.
  - `finding-relationship`: Map blocking and dependency graphs between active findings.
  - `severity-resolution`: Resolve severity level based on aggregate constraints.

### Knowledge Graph Library (`cog:domain:graph`)
- **Purpose**: Build network graphs, user-host profile correlations, and semantic activity clusters.
- **Capabilities**: `knowledge-graph`
- **Supported Patterns**:
  - `profile-identification`: Extract entities (users, hosts, endpoints) from raw logs.
  - `graph-clustering`: Group linked profiles into correlated network clusters.
  - `correlation-explanation`: Construct causal chains explaining access violations.

### Human Orientation Library (`cog:domain:orientation`)
- **Purpose**: Reflective situation analysis mapping observations, pressures, and tensions.
- **Capabilities**: `orientation-support`
- **Supported Patterns**:
  - `situation-observation`: Define environment and context variables.
  - `tension-identification`: Classify system or operational tensions.
  - `reflective-guidance`: Formulate suggestion paths without diagnostic claims.

### Cognitive Ecology Library (`cog:domain:cognitive-ecology`)
- **Purpose**: System-level ecology modeling loops, constraints, and causal actors.
- **Capabilities**: `cognitive-ecology`
- **Supported Patterns**:
  - `systems-mapping`: Identify actors, dependencies, and resources.
  - `feedback-analysis`: Model feedback loops and system constraints.
  - `intervention-discovery`: Discover system intervention points and explanations.

### Devotional Intelligence Library (`cog:domain:devotional-intelligence`)
- **Purpose**: Reflective devotional contemplation and insight structuring.
- **Capabilities**: `devotional-intelligence`
- **Supported Patterns**:
  - `reflective-contemplation`: Structure textual readings and inputs.
  - `insight-mapping`: Extract theological or qualitative core values.
  - `non-authoritative-guidance`: Map insights to personal reflection recommendations.

### Governance Reasoning Library (`cog:domain:governance`)
- **Purpose**: Rule conformity modeling, evidence validation, and non-execution checks.
- **Capabilities**: `governance-reasoning`
- **Supported Patterns**:
  - `boundary-review`: Model scopes of authority and decision boundaries.
  - `evidence-checks`: Map and verify evidence logs against requirements.
  - `escalation-mapping`: Direct unresolved issues to proper reviews.

### Learning Cognition Library (`cog:domain:learning`)
- **Purpose**: Instructional workflow planning mapping concept gaps, practice, and understanding.
- **Capabilities**: `learning-workflow`
- **Supported Patterns**:
  - `observe-gap`: Track knowledge or practice delta boundaries.
  - `concept-identification`: Map target educational concepts.
  - `understanding-resolution`: Perform instructional practice verification.

### Planning Cognition Library (`cog:domain:planning`)
- **Purpose**: Goal formulation, task ordering, risk checking, and action item mapping.
- **Capabilities**: `planning-workflow`
- **Supported Patterns**:
  - `goal-modeling`: Deconstruct raw desires into target outcomes.
  - `risk-assessment`: Identify blocks, assumptions, and mitigations.
  - `plan-formulation`: Compile actions into chronological, reviewable workflows.


---

## 2. Compositions & Pipeline Proofs

- **Research -> Editorial Review (`composeResearchToEditorial`)**: Pipes synthesized claim outputs from research directly into a document review workflow to verify drift against Golden targets.
- **Audit -> Decision (`composeAuditToDecision`)**: Flows resolved vulnerability severity metrics directly into decision constraint checks to automatically trigger gate approvals/blocks.
- **Knowledge Graph -> Research Synthesis (`composeGraphToResearch`)**: Feeds correlated security graph explanations as source inputs to perform research claim extraction and root-cause analysis.
- **Research-to-Book Pipeline (`researchToBookPipeline`)**: Standard pipeline that compiles raw chapter notes into outlines ready for publishing.
- **MoM & Decision Adapter Proofs**: Shows safe, kernel-neutral integration with domain adapters (`momAdapter` and `decisionAdapter`) for plan enrichment, kind mapping, and specialized emissions.

---

## 3. Downstream Consumption

All domain libraries, pipelines, proofs, and the registry are exported directly from the `@winmedia/cog-core` package:

```typescript
import {
  domainRegistry,
  researchLibrary,
  editorialLibrary,
  decisionLibrary,
  auditLibrary,
  graphLibrary,
  orientationLibrary,
  cognitiveEcologyLibrary,
  devotionalIntelligenceLibrary,
  governanceLibrary,
  learningLibrary,
  planningLibrary,
  researchToBookPipeline,
  composeResearchToEditorial,
  composeAuditToDecision,
  composeGraphToResearch
} from "@winmedia/cog-core";

```
