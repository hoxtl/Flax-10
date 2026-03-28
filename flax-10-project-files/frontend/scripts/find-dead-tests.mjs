#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const TEST_FILE_PATTERN = /\.test\.(js|jsx|ts|tsx)$/;
const RESOLVABLE_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.module.css',
];

const args = new Set(process.argv.slice(2));
const includeWeakSignals = args.has('--include-weak');
const jsonOutput = args.has('--json');
const strictMode = args.has('--strict');

const frontendRoot = process.cwd();
const srcRoot = path.join(frontendRoot, 'src');
const testsRoot = path.join(srcRoot, 'tests');

if (!fs.existsSync(testsRoot)) {
  console.error(`Could not find tests directory: ${testsRoot}`);
  process.exit(1);
}

const report = [];
for (const testFile of collectTestFiles(testsRoot)) {
  const entry = inspectTestFile(testFile);
  if (entry.issues.length > 0) {
    report.push(entry);
  }
}

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(buildJsonReport(report), null, 2)}\n`);
} else {
  printHumanReport(report);
}

const hasBlockingIssues = report.some((entry) =>
  entry.issues.some((issue) => issue.severity === 'strong' || issue.severity === 'medium'),
);

if (strictMode && hasBlockingIssues) {
  process.exit(1);
}

function collectTestFiles(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (TEST_FILE_PATTERN.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function inspectTestFile(testFile) {
  const issues = [];
  const text = fs.readFileSync(testFile, 'utf8');
  const dependencyScan = scanLocalDependencies(testFile);
  const resolvedSourceRefs = dependencyScan.sourceReferences;
  const missingRelativeImports = dependencyScan.missingRelativeImports;

  if (missingRelativeImports.length > 0) {
    issues.push({
      severity: 'strong',
      kind: 'missing-relative-imports',
      message: `Missing relative imports: ${missingRelativeImports.join(', ')}`,
    });
  }

  const activeCalls = countMatches(text, /\b(?:describe|it|test)\s*\(/g)
    + countMatches(text, /\b(?:describe|it|test)\.(?:only|each|concurrent|sequential)\s*\(/g);
  const skippedCalls = countMatches(text, /\b(?:describe|it|test)\.skip\s*\(/g);

  if (skippedCalls > 0 && activeCalls === 0) {
    issues.push({
      severity: 'medium',
      kind: 'skipped-only',
      message: 'This file only contains skipped suites/tests.',
    });
  }

  const containsPlaceholderAssertion = /expect\(\s*true\s*\)\.toBe\(\s*true\s*\)/.test(text);
  const containsPlaceholderLabel = /\bplaceholder\b/i.test(text);

  if (resolvedSourceRefs.length === 0 && (containsPlaceholderAssertion || containsPlaceholderLabel)) {
    issues.push({
      severity: 'medium',
      kind: 'placeholder-stub',
      message: 'This file looks like a placeholder stub and does not reference app source files.',
    });
  }

  if (includeWeakSignals && resolvedSourceRefs.length === 0) {
    issues.push({
      severity: 'weak',
      kind: 'no-app-source-references',
      message: 'No relative imports resolve to frontend app source outside src/tests.',
    });
  }

  return {
    file: relativeFromFrontendRoot(testFile),
    issues,
    sourceReferences: resolvedSourceRefs.map(relativeFromFrontendRoot),
  };
}

function scanLocalDependencies(entryFile) {
  const sourceReferences = new Set();
  const missingRelativeImports = new Set();
  const visitedFiles = new Set();
  const stack = [entryFile];

  while (stack.length > 0) {
    const currentFile = stack.pop();
    if (visitedFiles.has(currentFile)) {
      continue;
    }

    visitedFiles.add(currentFile);
    const text = fs.readFileSync(currentFile, 'utf8');

    for (const specifier of collectSpecifiers(text)) {
      if (!specifier.startsWith('.')) {
        continue;
      }

      const resolved = resolveRelativeSpecifier(currentFile, specifier);
      if (!resolved) {
        missingRelativeImports.add(`${relativeFromFrontendRoot(currentFile)} :: ${specifier}`);
        continue;
      }

      if (isInsidePath(resolved, testsRoot)) {
        if (!visitedFiles.has(resolved)) {
          stack.push(resolved);
        }
        continue;
      }

      if (isInsidePath(resolved, srcRoot)) {
        sourceReferences.add(resolved);
      }
    }
  }

  return {
    sourceReferences: [...sourceReferences].sort(),
    missingRelativeImports: [...missingRelativeImports].sort(),
  };
}

function collectSpecifiers(text) {
  const specifiers = new Set();
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bvi\.mock\(\s*['"]([^'"]+)['"]/g,
    /\bjest\.mock\(\s*['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

function resolveRelativeSpecifier(fromFile, specifier) {
  const basePath = path.resolve(path.dirname(fromFile), specifier);
  const candidates = buildResolutionCandidates(basePath);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function buildResolutionCandidates(basePath) {
  const candidates = [];

  candidates.push(basePath);

  for (const ext of RESOLVABLE_EXTENSIONS) {
    candidates.push(`${basePath}${ext}`);
  }

  for (const ext of RESOLVABLE_EXTENSIONS) {
    candidates.push(path.join(basePath, `index${ext}`));
  }

  return candidates;
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function isInsidePath(targetPath, parentPath) {
  const relativePath = path.relative(parentPath, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function relativeFromFrontendRoot(targetPath) {
  return path.relative(frontendRoot, targetPath);
}

function buildJsonReport(entries) {
  return {
    frontendRoot,
    summary: summarize(entries),
    files: entries,
  };
}

function summarize(entries) {
  const summary = {
    filesWithIssues: entries.length,
    strong: 0,
    medium: 0,
    weak: 0,
  };

  for (const entry of entries) {
    for (const issue of entry.issues) {
      summary[issue.severity] += 1;
    }
  }

  return summary;
}

function printHumanReport(entries) {
  const summary = summarize(entries);
  if (entries.length === 0) {
    console.log('No likely dead/orphan test files found.');
    return;
  }

  console.log('Likely dead/orphan frontend test files');
  console.log(`Files with issues: ${summary.filesWithIssues}`);
  console.log(`Strong: ${summary.strong}  Medium: ${summary.medium}  Weak: ${summary.weak}`);
  console.log('');

  for (const entry of entries) {
    console.log(entry.file);
    for (const issue of entry.issues) {
      console.log(`  - [${issue.severity}] ${issue.kind}: ${issue.message}`);
    }
    if (entry.sourceReferences.length > 0) {
      console.log(`  - source refs: ${entry.sourceReferences.join(', ')}`);
    }
    console.log('');
  }
}
