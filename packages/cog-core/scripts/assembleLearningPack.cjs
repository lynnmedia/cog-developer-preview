const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const learningRoot = path.join(packageRoot, "learning");

const learningDocs = [
  "START_HERE.md",
  "LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md",
  "GOVERNED_DECISION_TUTORIAL.md",
  "LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md",
  "LEVEL_3_COGNITIVE_APPLICATIONS.md",
  "LANGUAGE_SPEC_v0.4.md",
  "LANGUAGE_SEMANTIC_MODEL.md",
  "DEVELOPER_PREVIEW_TEACHING_SURFACE.md",
];

const canonicalApplications = [
  "canonical-research-synthesis.cog",
  "canonical-document-review.cog",
  "canonical-decision-workflow.cog",
  "canonical-audit-workflow.cog",
  "canonical-knowledge-graph.cog",
];

const pathReplacements = [
  ["packages/cog-core/examples/", "examples/"],
  ["docs/START_HERE.md", "learning/START_HERE.md"],
  ["docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md", "learning/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md"],
  ["docs/GOVERNED_DECISION_TUTORIAL.md", "learning/GOVERNED_DECISION_TUTORIAL.md"],
  ["docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md", "learning/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md"],
  ["docs/LEVEL_3_COGNITIVE_APPLICATIONS.md", "learning/LEVEL_3_COGNITIVE_APPLICATIONS.md"],
  ["docs/LANGUAGE_SPEC_v0.4.md", "learning/LANGUAGE_SPEC_v0.4.md"],
  ["docs/LANGUAGE_SEMANTIC_MODEL.md", "learning/LANGUAGE_SEMANTIC_MODEL.md"],
  ["docs/DEVELOPER_PREVIEW_TEACHING_SURFACE.md", "learning/DEVELOPER_PREVIEW_TEACHING_SURFACE.md"],
];

const distributionHeader = `<!-- assembled-cog-learning-pack -->\n> **Installed-package view.** This file is assembled from the authoritative Cog repository documentation during package creation. Paths beginning with \`examples/\` are relative to the installed \`@winmedia/cog-core\` package root. References to repository test source identify executable provenance and are not required learning assets.\n\n`;

function transformForPackage(content) {
  let transformed = content;
  for (const [from, to] of pathReplacements) {
    transformed = transformed.split(from).join(to);
  }
  return distributionHeader + transformed;
}

fs.rmSync(learningRoot, { recursive: true, force: true });
fs.mkdirSync(learningRoot, { recursive: true });

for (const fileName of learningDocs) {
  const sourcePath = path.join(repoRoot, "docs", fileName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing Developer Preview learning source: ${sourcePath}`);
  }

  const source = fs.readFileSync(sourcePath, "utf8");
  fs.writeFileSync(path.join(learningRoot, fileName), transformForPackage(source), "utf8");
}

const manifest = `# Cog Developer Preview Learning Pack Manifest\n\nThis directory is generated from repository teaching authorities during \`npm pack\` / publication. Do not edit generated copies as source files.\n\n## Start\n\nOpen:\n\n\`learning/START_HERE.md\`\n\nfrom the installed \`@winmedia/cog-core\` package root.\n\n## Curriculum\n\n1. \`learning/START_HERE.md\`\n2. \`learning/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md\`\n3. \`learning/GOVERNED_DECISION_TUTORIAL.md\`\n4. \`learning/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md\`\n5. \`learning/LEVEL_3_COGNITIVE_APPLICATIONS.md\`\n\nReference authorities also shipped:\n\n- \`learning/LANGUAGE_SPEC_v0.4.md\`\n- \`learning/LANGUAGE_SEMANTIC_MODEL.md\`\n- \`learning/DEVELOPER_PREVIEW_TEACHING_SURFACE.md\`\n\n## Shipped executable examples\n\nThe complete package \`examples/\` tree is included. Level 3 canonical applications are:\n\n${canonicalApplications.map((file) => `- \`examples/applications/${file}\``).join("\n")}\n\n## Developer Preview CLI\n\n\`discover\`, \`workflows\`, \`validate\`, \`lint\`, \`graph\`, \`run\`, \`trace\`, and \`diff\` are available through the installed \`cog\` executable. For a normal project-local installation, use \`npx --no-install cog ...\`.\n`;

fs.writeFileSync(path.join(learningRoot, "MANIFEST.md"), manifest, "utf8");
