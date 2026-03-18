#!/usr/bin/env node
/**
 * Code Quality Checker - BAND V COMPLIANCE
 * Requirements: ≤20 lines | ≤1 nesting | ≤400 lines/file
 * Test files: ≤25 lines for test functions | ≤1 nesting
 */

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const Colors = {
  RED: "\x1b[91m",
  YELLOW: "\x1b[33m",
  MAGENTA: "\x1b[95m",
  BOLD: "\x1b[1m",
  END: "\x1b[0m",
};

function printHeader() {
  console.log("\n" + "=".repeat(75));
  console.log(`${Colors.BOLD}${Colors.MAGENTA}${"BAND V CODE QUALITY REPORT - JAVASCRIPT".padStart(50)}${Colors.END}`);
  console.log("=".repeat(75));
  console.log("Requirements: ≤20 lines | ≤1 nesting | ≤400 lines/file");
  console.log("Test files: ≤25 lines for test functions | ≤1 nesting\n");
}

function printSection(number, title) {
  console.log(`\n${Colors.BOLD}${Colors.YELLOW}${number}. ${title}${Colors.END}`);
  console.log("─".repeat(75));
}
 
function printSubsection(title) {
  console.log(`\n${Colors.BOLD}${title}${Colors.END}`);
  console.log("·".repeat(75));
}

function shortenPath(filePath) {
  return filePath.replace(/^\.\.\/frontend\//, "");
}

function isTestFile(filePath) {
  return (
    filePath.includes("/__tests__/") ||
    filePath.includes("/tests/") ||
    /\.(test|spec)\.(js|jsx)$/.test(filePath)
  );
}

function isOrganizationalCallback(fnPath) {
  if (fnPath.parent.type !== "CallExpression") return false;
  const callee = fnPath.parent.callee;
  const orgFns = ["describe", "beforeEach", "afterEach", "beforeAll", "afterAll", "context"];
  if (callee.type === "Identifier" && orgFns.includes(callee.name)) return true;
  if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && orgFns.includes(callee.object.name)) return true;
  return false;
}

function shouldCheckTestCallback(fnPath) {
  if (fnPath.parent.type !== "CallExpression") return false;
  const callee = fnPath.parent.callee;
  const testFns = ["it", "test"];
  if (callee.type === "Identifier" && testFns.includes(callee.name)) return true;
  if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && testFns.includes(callee.object.name)) return true;
  return false;
}

function countFunctionLines(node) {
  if (!node.loc) return 0;
  return Math.max(0, node.loc.end.line - node.loc.start.line + 1);
}

function isElseIf(ifPath) {
  const parent = ifPath.parent;
  return parent && parent.type === "IfStatement" && parent.alternate === ifPath.node;
}

function getFunctionName(fnPath, node) {
  if (fnPath.parent.type === "CallExpression") {
    const callee = fnPath.parent.callee;
    const testFns = ["it", "test"];
    let isTestCb = callee.type === "Identifier" && testFns.includes(callee.name);
    if (!isTestCb && callee.type === "MemberExpression" && callee.object.type === "Identifier") {
      isTestCb = testFns.includes(callee.object.name);
    }
    if (isTestCb && fnPath.parent.arguments[0]) {
      const firstArg = fnPath.parent.arguments[0];
      if (firstArg.type === "StringLiteral" || firstArg.type === "Literal") {
        const calleeName = callee.name || (callee.object && callee.object.name);
        return `${calleeName}("${firstArg.value}")`;
      }
    }
  }
  if (node.id && node.id.name) return node.id.name;
  if (fnPath.parent.type === "VariableDeclarator" && fnPath.parent.id.name) return fnPath.parent.id.name;
  if (fnPath.parent.type === "Property" && fnPath.parent.key.name) return fnPath.parent.key.name;
  if (fnPath.parent.type === "MethodDefinition" && fnPath.parent.key.name) return fnPath.parent.key.name;
  return "anonymous";
}

function getNestingLevel(fnPath, level = 0) {
  let maxLevel = level;
  const nestingNodes = [
    "IfStatement", "ForStatement", "ForInStatement", "ForOfStatement",
    "WhileStatement", "DoWhileStatement", "SwitchStatement", "TryStatement", "WithStatement",
  ];
  fnPath.traverse({
    enter(innerPath) {
      if (!nestingNodes.includes(innerPath.node.type)) return;
      if (innerPath.node.type === "IfStatement" && isElseIf(innerPath)) return;
      const childLevel = getNestingLevel(innerPath, level + 1);
      maxLevel = Math.max(maxLevel, childLevel);
      innerPath.skip();
    },
  });
  return maxLevel;
}

function walkDir(dir, callback) {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!["node_modules", "coverage", "build", "dist", ".git"].includes(file)) {
        walkDir(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  }
}

function parseFile(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  return parser.parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
}

function checkFunctionLength(targetDir) {
  const violations = [];
  walkDir(targetDir, (filePath) => {
    if (!/\.(js|jsx)$/.test(filePath)) return;
    const isTest = isTestFile(filePath);
    const limit = isTest ? 25 : 20;
    try {
      const ast = parseFile(filePath);
      traverse(ast, {
        "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression"(fnPath) {
          if (isTest && isOrganizationalCallback(fnPath)) return;
          if (isTest && !shouldCheckTestCallback(fnPath)) return;
          const lines = countFunctionLines(fnPath.node);
          if (lines > limit) {
            violations.push({ file: shortenPath(filePath), name: getFunctionName(fnPath, fnPath.node), lines, limit, is_test: isTest });
          }
        },
      });
    } catch (e) {
      if (!isTest) console.error(`Parse error in ${shortenPath(filePath)}: ${e.message}`);
    }
  });
  return violations;
}

function checkFileLength(targetDir) {
  const violations = [];
  walkDir(targetDir, (filePath) => {
    if (!/\.(js|jsx|css)$/.test(filePath)) return;
    try {
      const lines = fs.readFileSync(filePath, "utf-8").split("\n").length;
      if (lines > 400) violations.push({ file: shortenPath(filePath), lines, over: lines - 400 });
    } catch { /* ignore */ }
  });
  return violations;
}

function checkNesting(targetDir) {
  const violations = [];
  walkDir(targetDir, (filePath) => {
    if (!/\.(js|jsx)$/.test(filePath)) return;
    const isTest = isTestFile(filePath);
    const limit = 1; // ≤1 for both regular and test files
    try {
      const ast = parseFile(filePath);
      traverse(ast, {
        "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression"(fnPath) {
          if (isTest && isOrganizationalCallback(fnPath)) return;
          const nesting = getNestingLevel(fnPath);
          if (nesting > limit) {
            violations.push({ file: shortenPath(filePath), name: getFunctionName(fnPath, fnPath.node), nesting, limit, is_test: isTest });
          }
        },
      });
    } catch { /* ignore */ }
  });
  return violations;
}

function main() {
  const target = process.argv[2] || "../frontend";

  printHeader();

  // 1. Function Length
  printSection("1", "FUNCTION LENGTH");
  const funcViolations = checkFunctionLength(target);
  const regularFunc = funcViolations.filter((v) => !v.is_test);
  const testFunc = funcViolations.filter((v) => v.is_test);

  printSubsection("Regular Files (≤20 lines)");
  if (regularFunc.length > 0) {
    console.log(`\n${Colors.RED}❌ ${regularFunc.length} VIOLATION(S)${Colors.END}\n`);
    regularFunc.sort((a, b) => b.lines - a.lines).forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${v.name}() → ${Colors.RED}${v.lines} lines${Colors.END} (limit: ${v.limit})\n`);
    });
  } else {
    console.log("\n✅ All regular functions within 20 lines\n");
  }

  printSubsection("Test Files (≤25 lines for it()/test() callbacks)");
  if (testFunc.length > 0) {
    console.log(`\n${Colors.RED}❌ ${testFunc.length} VIOLATION(S)${Colors.END}\n`);
    testFunc.sort((a, b) => b.lines - a.lines).forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${v.name}() → ${Colors.RED}${v.lines} lines${Colors.END} (limit: ${v.limit})\n`);
    });
  } else {
    console.log("\n✅ All test functions within 25 lines\n");
  }

  // 2. File Length
  printSection("2", "FILE LENGTH");
  const fileViolations = checkFileLength(target);
  if (fileViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${fileViolations.length} VIOLATION(S)${Colors.END}\n`);
    fileViolations.sort((a, b) => b.lines - a.lines).forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${Colors.RED}${v.lines} lines${Colors.END} (over by ${v.over})\n`);
    });
  } else {
    console.log("\n✅ All files within 400 lines\n");
  }

  // 3. Nesting Depth
  printSection("3", "NESTING DEPTH");
  const nestViolations = checkNesting(target);
  const regularNest = nestViolations.filter((v) => !v.is_test);
  const testNest = nestViolations.filter((v) => v.is_test);

  printSubsection("Regular Files (≤1 level)");
  if (regularNest.length > 0) {
    console.log(`\n${Colors.RED}❌ ${regularNest.length} VIOLATION(S)${Colors.END}\n`);
    regularNest.sort((a, b) => b.nesting - a.nesting).forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${v.name}() → ${Colors.RED}${v.nesting} levels${Colors.END} (limit: ${v.limit})\n`);
    });
  } else {
    console.log("\n✅ All regular functions within 1 nesting level\n");
  }

  printSubsection("Test Files (≤1 level)");
  if (testNest.length > 0) {
    console.log(`\n${Colors.RED}❌ ${testNest.length} VIOLATION(S)${Colors.END}\n`);
    testNest.sort((a, b) => b.nesting - a.nesting).forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${v.name}() → ${Colors.RED}${v.nesting} levels${Colors.END} (limit: ${v.limit})\n`);
    });
  } else {
    console.log("\n✅ All test functions within 1 nesting level\n");
  }

  // Summary
  console.log("─".repeat(75));
  console.log(`${Colors.BOLD}${Colors.YELLOW}SUMMARY${Colors.END}`);
  console.log("─".repeat(75) + "\n");
  const totalViolations = funcViolations.length + fileViolations.length + nestViolations.length;
  console.log(`Function Length:  ${funcViolations.length > 0 ? "❌" : "✅"} ${funcViolations.length} violation(s) (${regularFunc.length} regular, ${testFunc.length} test)`);
  console.log(`File Length:      ${fileViolations.length > 0 ? "❌" : "✅"} ${fileViolations.length} violation(s)`);
  console.log(`Nesting Depth:    ${nestViolations.length > 0 ? "❌" : "✅"} ${nestViolations.length} violation(s) (${regularNest.length} regular, ${testNest.length} test)`);
  console.log("\n" + "=".repeat(75));
  if (totalViolations === 0) {
    console.log(`${Colors.YELLOW}🎉 BAND V READY! ALL REQUIREMENTS MET!${Colors.END}`);
  } else {
    console.log(`${Colors.YELLOW}⚠️  ${totalViolations} TOTAL VIOLATIONS - REFACTORING REQUIRED${Colors.END}`);
  }
  console.log("=".repeat(75) + "\n");
  return totalViolations > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { checkFunctionLength, checkFileLength, checkNesting };