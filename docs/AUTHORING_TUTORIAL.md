# Progressive Cog Authoring Tutorial

This tutorial guides you through the process of authoring a multi-stage cognition workflow in Cog. You will learn how to use the core statement types (`define`, `relate`, `view`, `resolve`, `transform`, `emit`, and `constrain`) to build a robust model with cumulative verification state.

---

## Tutorial Scenario: Credit Card Application Assessment

We will model a financial application workflow that intakes a **Credit Application**, verifies the applicant's **Credit Score**, references their **Income Verification**, performs a **Risk Check**, and emits an **Approval Decision**.

---

## Step 1: Defining Entities (`define`)

All workflows begin by declaring the structural entities involved. We define our input records and the intermediate structures:

```cog
# Stage 1: Incoming Application Data
define entity "credit-application" {
  kind: "record"
  level: L1
}

# Stage 2: Applicant Credit Profile
define entity "credit-score" {
  kind: "verification"
  level: L1
}

# Stage 3: Income Verification
define entity "income-verification" {
  kind: "verification"
  level: L2
}
```

---

## Step 2: Relating Entities (`relate`)

Relationships establish dependency and reference links between entities:

```cog
# Link the application to the applicant's credit score
relate "credit-application" -> "credit-score" {
  kind: "references_credit"
}

# Link the application to the income verification
relate "credit-application" -> "income-verification" {
  kind: "references_income"
}
```

---

## Step 3: Resolving External References (`resolve`)

When execution transitions from raw inputs to verified structures, we resolve entities to specific verification levels (L1 to L5):

```cog
# Resolve the application inputs to L1 verification level
resolve "credit-application" to L1 {
  // Empty resolve block indicates basic check
}

# Resolve the credit score to L2 verification level
resolve "credit-score" to L2 {
  // Empty resolve block
}
```

---

## Step 4: Emitting Outputs (`emit`)

At intermediate stages, we emit events or summaries targeting specific resolved entities to notify external systems:

```cog
# Emit an event showing the pre-screening is complete
emit {
  target: "credit-application"
  kind: "pre_screening_completed"
}
```

---

## Step 5: Transforming Entities (`transform`)

We transform entities to compute new attributes or progress them through states. In this step, we project the credit score and income verification into a consolidated **Risk Check**:

```cog
# Consolidate verification details into a single risk check entity
define entity "risk-assessment" {
  kind: "risk_check"
  level: L3
}

transform "risk-assessment" {
  source: "credit-score"
  action: "evaluate_risk"
}
```

---

## Step 6: Constraining State (`constrain`)

Constraints enforce invariant logical check rules on entities. We want to ensure that no high-risk applications can proceed:

```cog
# Constrain the risk check to enforce approval safety
constrain "risk-assessment" {
  rule: "risk_score_less_than_threshold"
  limit: 50
}
```

---

## Step 7: Emitting the Final Decision (`emit`)

Finally, we emit the outcome of the multi-stage assessment:

```cog
# Emit the final credit approval event
emit {
  target: "risk-assessment"
  kind: "credit_application_approved"
}
```

---

## Step 8: Complete Program Listing

Here is the final consolidated program:

```cog
define entity "credit-application" {
  kind: "record"
  level: L1
}

define entity "credit-score" {
  kind: "verification"
  level: L1
}

define entity "income-verification" {
  kind: "verification"
  level: L2
}

relate "credit-application" -> "credit-score" {
  kind: "references_credit"
}

relate "credit-application" -> "income-verification" {
  kind: "references_income"
}

resolve "credit-application" to L1 {}
resolve "credit-score" to L2 {}

emit {
  target: "credit-application"
  kind: "pre_screening_completed"
}

define entity "risk-assessment" {
  kind: "risk_check"
  level: L3
}

transform "risk-assessment" {
  source: "credit-score"
  action: "evaluate_risk"
}

constrain "risk-assessment" {
  rule: "risk_score_less_than_threshold"
  limit: 50
}

emit {
  target: "risk-assessment"
  kind: "credit_application_approved"
}
```
