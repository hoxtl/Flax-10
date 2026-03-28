#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse } from '@babel/parser';

const TEST_FILE_PATTERN = /\.test\.(js|jsx|ts|tsx)$/;
const DEFAULT_ROOT = 'src/tests';

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');
const targets = args.filter((arg) => arg !== '--fix');
const roots = (targets.length > 0 ? targets : [DEFAULT_ROOT]).map((target) => path.resolve(process.cwd(), target));

const files = collectTestFiles(roots);
let filesWithViolations = 0;
let totalViolations = 0;
let remainingViolations = 0;
let fixedViolations = 0;

for (const filePath of files) {
  const result = inspectFile(filePath, { fixMode });
  const displayedViolations = fixMode ? result.remainingViolations : result.violations;
  if (result.violations.length === 0) {
    continue;
  }

  totalViolations += result.violations.length;
  remainingViolations += result.remainingViolations.length;
  fixedViolations += result.violations.length - result.remainingViolations.length;

  if (displayedViolations.length === 0) {
    continue;
  }

  filesWithViolations += 1;
  console.log(path.relative(process.cwd(), filePath));
  for (const violation of displayedViolations) {
    const fixLabel = violation.fixable ? 'fixable' : 'manual';
    console.log(
      `  - lines ${violation.firstLine}-${violation.secondLine}: expected 1 blank line between test blocks (${fixLabel})`,
    );
  }
  console.log('');
}

if (filesWithViolations === 0) {
  console.log('All checked test files already use one blank line between adjacent it()/test() blocks.');
  process.exit(0);
}

if (fixMode) {
  if (remainingViolations === 0) {
    console.log(`Fixed ${fixedViolations} spacing issue(s).`);
    process.exit(0);
  }

  console.error(`Fixed ${fixedViolations} spacing issue(s), but ${remainingViolations} still need manual cleanup.`);
  process.exit(1);
}

console.error(`Found ${totalViolations} spacing issue(s) across ${filesWithViolations} file(s).`);
process.exit(1);

function collectTestFiles(rootPaths) {
  const found = new Set();

  for (const rootPath of rootPaths) {
    if (!fs.existsSync(rootPath)) {
      continue;
    }

    const stat = fs.statSync(rootPath);
    if (stat.isFile()) {
      if (TEST_FILE_PATTERN.test(path.basename(rootPath))) {
        found.add(rootPath);
      }
      continue;
    }

    const stack = [rootPath];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (TEST_FILE_PATTERN.test(entry.name)) {
          found.add(fullPath);
        }
      }
    }
  }

  return [...found].sort();
}

function inspectFile(filePath, { fixMode }) {
  const originalSource = fs.readFileSync(filePath, 'utf8');
  const eol = originalSource.includes('\r\n') ? '\r\n' : '\n';
  const violations = findSpacingViolations(originalSource, filePath);

  if (!fixMode || violations.length === 0) {
    return {
      violations,
      remainingViolations: violations,
    };
  }

  const fixableViolations = violations.filter((violation) => violation.fixable);
  if (fixableViolations.length === 0) {
    return {
      violations,
      remainingViolations: violations,
    };
  }

  let updatedSource = originalSource;
  for (const violation of [...fixableViolations].sort((a, b) => b.replaceStart - a.replaceStart)) {
    updatedSource =
      updatedSource.slice(0, violation.replaceStart)
      + `${eol}${eol}${violation.indent}`
      + updatedSource.slice(violation.replaceEnd);
    violation.fixed = true;
  }

  if (updatedSource !== originalSource) {
    fs.writeFileSync(filePath, updatedSource);
  }

  return {
    violations,
    remainingViolations: violations.filter((violation) => !violation.fixed),
  };
}

function findSpacingViolations(source, filePath) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: false,
  });

  const lines = source.split(/\r?\n/);
  const violations = [];

  walkAst(ast, (node) => {
    if (node.type !== 'BlockStatement') {
      return;
    }

    const statements = node.body;
    for (let index = 0; index < statements.length - 1; index += 1) {
      const current = statements[index];
      const next = statements[index + 1];
      if (!isTestStatement(current) || !isTestStatement(next) || !current.loc || !next.loc) {
        continue;
      }

      const gapLineCount = next.loc.start.line - current.loc.end.line - 1;
      const inBetweenLines = lines.slice(current.loc.end.line, next.loc.start.line - 1);
      const hasExactlyOneBlankLine = gapLineCount === 1 && inBetweenLines.length === 1 && inBetweenLines[0].trim() === '';
      if (hasExactlyOneBlankLine) {
        continue;
      }

      const betweenText = source.slice(current.end, next.start);
      const whitespaceOnly = /^[\t \r\n]*$/.test(betweenText);
      const lineStart = source.lastIndexOf('\n', next.start - 1) + 1;
      const indent = source.slice(lineStart, next.start);

      violations.push({
        filePath,
        firstLine: current.loc.start.line,
        secondLine: next.loc.start.line,
        fixable: whitespaceOnly,
        fixed: false,
        indent,
        replaceStart: current.end,
        replaceEnd: next.start,
      });
    }
  });

  return violations;
}

function walkAst(node, visit) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      walkAst(child, visit);
    }
    return;
  }

  if (typeof node.type === 'string') {
    visit(node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'start' || key === 'end') {
      continue;
    }
    walkAst(value, visit);
  }
}

function isTestStatement(statement) {
  if (!statement || statement.type !== 'ExpressionStatement') {
    return false;
  }

  return isTestCall(statement.expression);
}

function isTestCall(node) {
  if (!node || node.type !== 'CallExpression') {
    return false;
  }

  return isTestCallee(node.callee);
}

function isTestCallee(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'Identifier') {
    return node.name === 'it' || node.name === 'test';
  }

  if (node.type === 'MemberExpression') {
    return isTestCallee(node.object);
  }

  if (node.type === 'CallExpression') {
    return isTestCallee(node.callee);
  }

  return false;
}
