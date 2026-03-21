#!/usr/bin/env node
/**
 * Code Quality Checker - BAND V COMPLIANCE
 * Requirements: ≤15 lines | ≤1 nesting | ≤400 lines/file
 * Test files: ≤25 lines for test functions | ≤2 nesting
 */

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// ANSI Colors
const Colors = {
  RED: "\x1b[91m",
  YELLOW: "\x1b[33m",
  MAGENTA: "\x1b[95m",
  BOLD: "\x1b[1m",
  END: "\x1b[0m",
};

function printHeader() {
  console.log("\n" + "=".repeat(75));
  console.log(
    `${Colors.BOLD}${Colors.MAGENTA}${"BAND V CODE QUALITY REPORT - JAVASCRIPT".padStart(
      50
    )}${Colors.END}`
  );
  console.log("=".repeat(75));
  console.log("Requirements: ≤15 lines | ≤1 nesting | ≤400 lines/file");
  console.log("Test files: ≤25 lines for test functions | ≤2 nesting\n");
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
  const organizationalFunctions = [
    "describe",
    "beforeEach",
    "afterEach",
    "beforeAll",
    "afterAll",
    "context",
  ];

  if (callee.type === "Identifier" && organizationalFunctions.includes(callee.name)) {
    return true;
  }

  // describe.skip, beforeEach.only, etc.
  if (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    organizationalFunctions.includes(callee.object.name)
  ) {
    return true;
  }

  return false;
}

function shouldCheckTestCallback(fnPath) {
  // Only check actual test callbacks (it, test), not organizational wrappers or helpers
  if (fnPath.parent.type !== "CallExpression") return false;

  const callee = fnPath.parent.callee;
  const testFunctions = ["it", "test"];

  if (callee.type === "Identifier" && testFunctions.includes(callee.name)) {
    return true;
  }

  // it.skip, test.only, etc.
  if (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    testFunctions.includes(callee.object.name)
  ) {
    return true;
  }

  return false;
}

// ✅ Option B: inclusive count (signature + braces + blank lines)
function countFunctionLines(node) {
  if (!node.loc) return 0;
  const startLine = node.loc.start.line;
  const endLine = node.loc.end.line;
  return Math.max(0, endLine - startLine + 1);
}

function isElseIf(ifPath) {
  const parent = ifPath.parent;
  if (!parent || parent.type !== "IfStatement") return false;
  return parent.alternate === ifPath.node;
}

function getFunctionName(fnPath, node) {
  // it("desc", () => {})
  if (fnPath.parent.type === "CallExpression") {
    const callee = fnPath.parent.callee;
    const testFunctions = ["it", "test"];

    let isTestCallback = false;
    if (callee.type === "Identifier" && testFunctions.includes(callee.name)) {
      isTestCallback = true;
    } else if (
      callee.type === "MemberExpression" &&
      callee.object.type === "Identifier" &&
      testFunctions.includes(callee.object.name)
    ) {
      isTestCallback = true;
    }

    if (isTestCallback && fnPath.parent.arguments[0]) {
      const firstArg = fnPath.parent.arguments[0];
      if (firstArg.type === "StringLiteral" || firstArg.type === "Literal") {
        const description = firstArg.value;
        const calleeName = callee.name || (callee.object && callee.object.name);
        return `${calleeName}("${description}")`;
      }
    }
  }

  // named function
  if (node.id && node.id.name) return node.id.name;

  // const foo = () => {}
  if (fnPath.parent.type === "VariableDeclarator" && fnPath.parent.id.name) {
    return fnPath.parent.id.name;
  }

  // { foo() {} }
  if (fnPath.parent.type === "Property" && fnPath.parent.key.name) {
    return fnPath.parent.key.name;
  }

  // class Foo { bar() {} }
  if (fnPath.parent.type === "MethodDefinition" && fnPath.parent.key.name) {
    return fnPath.parent.key.name;
  }

  return "anonymous";
}

function getNestingLevel(fnPath, level = 0) {
  let maxLevel = level;

  const nestingNodes = [
    "IfStatement",
    "ForStatement",
    "ForInStatement",
    "ForOfStatement",
    "WhileStatement",
    "DoWhileStatement",
    "SwitchStatement",
    "TryStatement",
    "WithStatement",
  ];

  fnPath.traverse({
    enter(innerPath) {
      if (nestingNodes.includes(innerPath.node.type)) {
        if (innerPath.node.type === "IfStatement" && isElseIf(innerPath)) return;

        const currentLevel = level + 1;
        const childLevel = getNestingLevel(innerPath, currentLevel);
        maxLevel = Math.max(maxLevel, childLevel);
        innerPath.skip();
      }
    },
  });

  return maxLevel;
}

function checkFunctionLength(targetDir) {
  const violations = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!["node_modules", "coverage", "build", "dist", ".git"].includes(file)) {
          walkDir(filePath);
        }
        continue;
      }

      if (!/\.(js|jsx)$/.test(file)) continue;

      const isTest = isTestFile(filePath);
      const limit = isTest ? 25 : 15;

      try {
        const code = fs.readFileSync(filePath, "utf-8");

        const ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
        });

        traverse(ast, {
          "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression"(fnPath) {
            const node = fnPath.node;

            // In test files, ignore describe/beforeEach/etc callbacks
            if (isTest && isOrganizationalCallback(fnPath)) return;

            // ✅ In test files, only enforce limit on it()/test() callbacks
            if (isTest && !shouldCheckTestCallback(fnPath)) return;

            const lines = countFunctionLines(node);

            if (lines > limit) {
              const functionName = getFunctionName(fnPath, node);
              violations.push({
                file: shortenPath(filePath),
                name: functionName,
                lines,
                limit,
                is_test: isTest,
              });
            }
          },
        });
      } catch (error) {
        if (!isTest) {
          console.error(`Parse error in ${shortenPath(filePath)}: ${error.message}`);
        }
      }
    }
  }

  walkDir(targetDir);
  return violations;
}

function checkFileLength(targetDir) {
  const violations = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!["node_modules", "coverage", "build", "dist", ".git"].includes(file)) {
          walkDir(filePath);
        }
        continue;
      }

      if (!/\.(js|jsx|css)$/.test(file)) continue;

      try {
        const code = fs.readFileSync(filePath, "utf-8");
        const lines = code.split("\n").length;

        if (lines > 400) {
          violations.push({
            file: shortenPath(filePath),
            lines,
            over: lines - 400,
          });
        }
      } catch {
        // ignore read errors
      }
    }
  }

  walkDir(targetDir);
  return violations;
}

function checkNesting(targetDir) {
  const violations = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!["node_modules", "coverage", "build", "dist", ".git"].includes(file)) {
          walkDir(filePath);
        }
        continue;
      }

      if (!/\.(js|jsx)$/.test(file)) continue;

      const isTest = isTestFile(filePath);
      const limit = isTest ? 2 : 1;

      try {
        const code = fs.readFileSync(filePath, "utf-8");

        const ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
        });

        traverse(ast, {
          "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression"(fnPath) {
            const node = fnPath.node;

            if (isTest && isOrganizationalCallback(fnPath)) return;

            // NOTE: Nesting applies to all functions (including helpers).
            // If you only want nesting rules for it/test callbacks in test files, add:
            // if (isTest && !shouldCheckTestCallback(fnPath)) return;

            const nesting = getNestingLevel(fnPath);

            if (nesting > limit) {
              const functionName = getFunctionName(fnPath, node);
              violations.push({
                file: shortenPath(filePath),
                name: functionName,
                nesting,
                limit,
                is_test: isTest,
              });
            }
          },
        });
      } catch {
        // ignore parse errors
      }
    }
  }

  walkDir(targetDir);
  return violations;
}

function main() {
  const target = "../frontend";

  printHeader();

  // 1. Function Length
  printSection("1", "FUNCTION LENGTH");
  const funcViolations = checkFunctionLength(target);

  const regularFunc = funcViolations.filter((v) => !v.is_test);
  const testFunc = funcViolations.filter((v) => v.is_test);

  printSubsection("Regular Files (≤15 lines)");
  if (regularFunc.length > 0) {
    console.log(`\n${Colors.RED}❌ ${regularFunc.length} VIOLATION(S)${Colors.END}\n`);
    regularFunc
      .sort((a, b) => b.lines - a.lines)
      .forEach((v) => {
        console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
        console.log(
          `  ${v.name}() → ${Colors.RED}${v.lines} lines${Colors.END} (limit: ${v.limit})\n`
        );
      });
  } else {
    console.log("\n✅ All regular functions meet Band V requirements\n");
  }

  printSubsection('Test Files (≤25 lines for it()/test() callbacks)');
  if (testFunc.length > 0) {
    console.log(`\n${Colors.RED}❌ ${testFunc.length} VIOLATION(S)${Colors.END}\n`);
    testFunc
      .sort((a, b) => b.lines - a.lines)
      .forEach((v) => {
        console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
        console.log(
          `  ${v.name}() → ${Colors.RED}${v.lines} lines${Colors.END} (limit: ${v.limit})\n`
        );
      });
  } else {
    console.log("\n✅ All test functions meet Band V requirements\n");
  }

  // 2. File Length
  printSection("2", "FILE LENGTH");
  const fileViolations = checkFileLength(target);

  if (fileViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${fileViolations.length} VIOLATION(S)${Colors.END}\n`);
    fileViolations
      .sort((a, b) => b.lines - a.lines)
      .forEach((v) => {
        console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
        console.log(`  ${Colors.RED}${v.lines} lines${Colors.END} (over by ${v.over})\n`);
      });
  } else {
    console.log("\n✅ All files meet Band V requirements\n");
  }

  // 3. Nesting Depth
  printSection("3", "NESTING DEPTH");
  const nestViolations = checkNesting(target);

  const regularNest = nestViolations.filter((v) => !v.is_test);
  const testNest = nestViolations.filter((v) => v.is_test);

  printSubsection("Regular Files (≤1 level)");
  if (regularNest.length > 0) {
    console.log(`\n${Colors.RED}❌ ${regularNest.length} VIOLATION(S)${Colors.END}\n`);
    regularNest
      .sort((a, b) => b.nesting - a.nesting)
      .forEach((v) => {
        console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
        console.log(
          `  ${v.name}() → ${Colors.RED}${v.nesting} levels${Colors.END} (limit: ${v.limit})\n`
        );
      });
  } else {
    console.log("\n✅ All regular functions meet Band V requirements\n");
  }

  printSubsection("Test Files (≤2 levels)");
  if (testNest.length > 0) {
    console.log(`\n${Colors.RED}❌ ${testNest.length} VIOLATION(S)${Colors.END}\n`);
    testNest
      .sort((a, b) => b.nesting - a.nesting)
      .forEach((v) => {
        console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
        console.log(
          `  ${v.name}() → ${Colors.RED}${v.nesting} levels${Colors.END} (limit: ${v.limit})\n`
        );
      });
  } else {
    console.log("\n✅ All test functions meet Band V requirements\n");
  }

  // Summary
  console.log("─".repeat(75));
  console.log(`${Colors.BOLD}${Colors.YELLOW}SUMMARY${Colors.END}`);
  console.log("─".repeat(75) + "\n");

  const totalViolations =
    funcViolations.length + fileViolations.length + nestViolations.length;

  console.log(
    `Function Length:  ${funcViolations.length > 0 ? "❌" : "✅"} ${funcViolations.length
    } violation(s) (${regularFunc.length} regular, ${testFunc.length} test)`
  );
  console.log(
    `File Length:      ${fileViolations.length > 0 ? "❌" : "✅"} ${fileViolations.length
    } violation(s)`
  );
  console.log(
    `Nesting Depth:    ${nestViolations.length > 0 ? "❌" : "✅"} ${nestViolations.length
    } violation(s) (${regularNest.length} regular, ${testNest.length} test)`
  );

  console.log("\n" + "=".repeat(75));

  if (totalViolations === 0) {
    console.log(`${Colors.YELLOW}🎉 BAND V READY! ALL REQUIREMENTS MET!${Colors.END}`);
  } else {
    console.log(
      `${Colors.YELLOW}⚠️  ${totalViolations} TOTAL VIOLATIONS - REFACTORING REQUIRED${Colors.END}`
    );
  }

  console.log("=".repeat(75) + "\n");

  return totalViolations > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { checkFunctionLength, checkFileLength, checkNesting };
