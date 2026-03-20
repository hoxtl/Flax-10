#!/usr/bin/env node
/**
 * Comment Quality Checker - BAND V COMPLIANCE
 * Checks: banner comments | American spelling | emojis | arrow text | excessive decoration
 */

const fs = require("fs");
const path = require("path");

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
    `${Colors.BOLD}${Colors.MAGENTA}${"COMMENT QUALITY REPORT - JAVASCRIPT".padStart(55)}${Colors.END}`
  );
  console.log("=".repeat(75));
  console.log("Rules: No banners | British spelling | No emojis | No arrow text");
  console.log("       No excessive decoration\n");
}

function printSection(number, title) {
  console.log(`\n${Colors.BOLD}${Colors.YELLOW}${number}. ${title}${Colors.END}`);
  console.log("─".repeat(75));
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

// American → British spelling map (lowercase)
const SPELLING_MAP = {
  "color": "colour",
  "colors": "colours",
  "colored": "coloured",
  "coloring": "colouring",
  "colorize": "colourise",
  "favorite": "favourite",
  "favorites": "favourites",
  "favorited": "favourited",
  "favor": "favour",
  "initialize": "initialise",
  "initialized": "initialised",
  "initializing": "initialising",
  "initialization": "initialisation",
  "organize": "organise",
  "organized": "organised",
  "organizing": "organising",
  "organization": "organisation",
  "customize": "customise",
  "customized": "customised",
  "customizing": "customising",
  "customization": "customisation",
  "optimize": "optimise",
  "optimized": "optimised",
  "optimizing": "optimising",
  "optimization": "optimisation",
  "recognize": "recognise",
  "recognized": "recognised",
  "recognizing": "recognising",
  "synchronize": "synchronise",
  "synchronized": "synchronised",
  "synchronizing": "synchronising",
  "analyze": "analyse",
  "analyzed": "analysed",
  "analyzing": "analysing",
  "behavior": "behaviour",
  "behaviors": "behaviours",
  "neighbor": "neighbour",
  "neighbors": "neighbours",
  "honor": "honour",
  "honored": "honoured",
  "humor": "humour",
  "labor": "labour",
  "center": "centre",
  "centers": "centres",
  "meter": "metre",
  "meters": "metres",
  "theater": "theatre",
  "theaters": "theatres",
  "catalog": "catalogue",
  "catalogs": "catalogues",
  "dialog": "dialogue",
  "dialogs": "dialogues",
  "defense": "defence",
  "offense": "offence",
  "license": "licence",
  "practice": "practise",
  "gray": "grey",
  "canceled": "cancelled",
  "canceling": "cancelling",
  "traveled": "travelled",
  "traveling": "travelling",
  "modeled": "modelled",
  "modeling": "modelling",
  "labeled": "labelled",
  "labeling": "labelling",
  "enrollment": "enrolment",
  "fulfill": "fulfil",
  "fulfillment": "fulfilment",
  "skillful": "skilful",
};

// Emoji regex (covers most common emoji ranges)
const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/u;

// Code terms that use American spelling and cannot be changed
const CODE_TERMS = new Set([
  "color", "colors", "colored", "coloring",
  "gray",
  "center", "centers",
  "dialog",
  "normalize", "normalized",
  "serialize", "serialized", "deserialize", "deserialized",
  "license",
  "canceled",
  "labeled",
  "modeled", "modeling",
  "initialize", "initialized", "initializing", "initialization",
  "optimize", "optimized", "optimizing", "optimization",
  "synchronize", "synchronized", "synchronizing",
]);

// Banner patterns — decorative separators only, not /* or /** alone
const BANNER_PATTERNS = [
  /^\s*\/\/\s*[-=~*#]{5,}/,           // // ------, // ======, // ~~~~~~, // ******
  /^\s*\/\/\s*[─━═]{3,}/,             // // ───────
  /^\s*\/\*\s*[-=~*#─━═]{5,}/,        // /* ------
  /^\s*\*\s*[-=~*#─━═]{5,}/,          // * ------  (inside block comment)
  /^\s*[-=~*#─━═]{5,}\s*\*\//,        // ------ */
  /^\s*\/\/\s*[╔╗╚╝║│┌┐└┘├┤┬┴┼]/,    // Box-drawing chars
];

// Arrow text patterns (includes Unicode arrows AI tools often use)
const ARROW_PATTERNS = [
  /-->/,    // -->
  /<--/,    // <--
  /==>/,    // ==>
  /<==/,    // <==
  /~>/,     // ~>
  /<~/,     // <~
  /[→←⇒⇐⟶⟵]/u,  // Unicode arrows
];

function extractComments(code) {
  const comments = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Single-line comments: // ...
    const singleMatch = line.match(/\/\/(.*)/);
    if (singleMatch) {
      comments.push({ line: lineNum, text: singleMatch[1].trim(), raw: line });
    }

    // Block comment on single line: /* ... */
    const blockSingle = line.match(/\/\*(.*?)\*\//);
    if (blockSingle) {
      comments.push({ line: lineNum, text: blockSingle[1].trim(), raw: line });
    }
  }

  // Multi-line block comments
  const blockRe = /\/\*[\s\S]*?\*\//g;
  let match;
  while ((match = blockRe.exec(code)) !== null) {
    const startLine = code.slice(0, match.index).split("\n").length;
    const blockLines = match[0].split("\n");
    for (let j = 0; j < blockLines.length; j++) {
      const bLine = blockLines[j];
      const cleaned = bLine.replace(/^\s*\/?\*+\/?/, "").trim();
      if (cleaned) {
        comments.push({ line: startLine + j, text: cleaned, raw: bLine });
      }
    }
  }

  return comments;
}

function checkBannerComments(targetDir) {
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
        const lines = code.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const pattern of BANNER_PATTERNS) {
            if (pattern.test(line)) {
              violations.push({
                file: shortenPath(filePath),
                line: i + 1,
                text: line.trim().slice(0, 60),
                is_test: isTestFile(filePath),
              });
              break;
            }
          }
        }
      } catch {
        // ignore read errors
      }
    }
  }

  walkDir(targetDir);
  return violations;
}

function checkAmericanSpelling(targetDir) {
  const violations = [];
  const americanWords = Object.keys(SPELLING_MAP);

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

      try {
        const code = fs.readFileSync(filePath, "utf-8");
        const comments = extractComments(code);

        for (const comment of comments) {
          const words = comment.text.toLowerCase().split(/\W+/);
          for (const word of words) {
            if (americanWords.includes(word) && !CODE_TERMS.has(word)) {
              violations.push({
                file: shortenPath(filePath),
                line: comment.line,
                american: word,
                british: SPELLING_MAP[word],
                is_test: isTestFile(filePath),
              });
            }
          }
        }
      } catch {
        // ignore errors
      }
    }
  }

  walkDir(targetDir);
  return violations;
}

function checkEmojiComments(targetDir) {
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

      try {
        const code = fs.readFileSync(filePath, "utf-8");
        const comments = extractComments(code);

        for (const comment of comments) {
          if (EMOJI_RE.test(comment.text)) {
            violations.push({
              file: shortenPath(filePath),
              line: comment.line,
              text: comment.text.slice(0, 60),
              is_test: isTestFile(filePath),
            });
          }
        }
      } catch {
        // ignore errors
      }
    }
  }

  walkDir(targetDir);
  return violations;
}

function checkArrowText(targetDir) {
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

      try {
        const code = fs.readFileSync(filePath, "utf-8");
        const comments = extractComments(code);

        for (const comment of comments) {
          for (const pattern of ARROW_PATTERNS) {
            if (pattern.test(comment.text)) {
              violations.push({
                file: shortenPath(filePath),
                line: comment.line,
                text: comment.text.slice(0, 60),
                is_test: isTestFile(filePath),
              });
              break;
            }
          }
        }
      } catch {
        // ignore errors
      }
    }
  }

  walkDir(targetDir);
  return violations;
}

function main() {
  const target = "../frontend";

  printHeader();

  // 1. Banner Comments
  printSection("1", "BANNER COMMENTS");
  const bannerViolations = checkBannerComments(target);

  if (bannerViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${bannerViolations.length} VIOLATION(S)${Colors.END}\n`);
    bannerViolations.forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}:${v.line}${Colors.END}`);
      console.log(`  ${Colors.RED}${v.text}${Colors.END}\n`);
    });
  } else {
    console.log("\n✅ No banner comments found\n");
  }

  // 2. American Spelling
  printSection("2", "AMERICAN SPELLING IN COMMENTS");
  const spellingViolations = checkAmericanSpelling(target);

  if (spellingViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${spellingViolations.length} VIOLATION(S)${Colors.END}\n`);
    spellingViolations.forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}:${v.line}${Colors.END}`);
      console.log(
        `  "${v.american}" → ${Colors.RED}use "${v.british}"${Colors.END}\n`
      );
    });
  } else {
    console.log("\n✅ No American spellings found in comments\n");
  }

  // 3. Emoji Comments
  printSection("3", "EMOJIS IN COMMENTS");
  const emojiViolations = checkEmojiComments(target);

  if (emojiViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${emojiViolations.length} VIOLATION(S)${Colors.END}\n`);
    emojiViolations.forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}:${v.line}${Colors.END}`);
      console.log(`  ${Colors.RED}${v.text}${Colors.END}\n`);
    });
  } else {
    console.log("\n✅ No emojis found in comments\n");
  }

  // 4. Arrow Text
  printSection("4", "ARROW TEXT IN COMMENTS");
  const arrowViolations = checkArrowText(target);

  if (arrowViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${arrowViolations.length} VIOLATION(S)${Colors.END}\n`);
    arrowViolations.forEach((v) => {
      console.log(`${Colors.BOLD}${v.file}:${v.line}${Colors.END}`);
      console.log(`  ${Colors.RED}${v.text}${Colors.END}\n`);
    });
  } else {
    console.log("\n✅ No arrow text found in comments\n");
  }

  // Summary
  console.log("─".repeat(75));
  console.log(`${Colors.BOLD}${Colors.YELLOW}SUMMARY${Colors.END}`);
  console.log("─".repeat(75) + "\n");

  const totalViolations =
    bannerViolations.length +
    spellingViolations.length +
    emojiViolations.length +
    arrowViolations.length;

  console.log(
    `Banner Comments:    ${bannerViolations.length > 0 ? "❌" : "✅"} ${bannerViolations.length} violation(s)`
  );
  console.log(
    `American Spelling:  ${spellingViolations.length > 0 ? "❌" : "✅"} ${spellingViolations.length} violation(s)`
  );
  console.log(
    `Emoji Comments:     ${emojiViolations.length > 0 ? "❌" : "✅"} ${emojiViolations.length} violation(s)`
  );
  console.log(
    `Arrow Text:         ${arrowViolations.length > 0 ? "❌" : "✅"} ${arrowViolations.length} violation(s)`
  );

  console.log("\n" + "=".repeat(75));

  if (totalViolations === 0) {
    console.log(`${Colors.YELLOW}🎉 ALL COMMENT RULES MET!${Colors.END}`);
  } else {
    console.log(
      `${Colors.YELLOW}⚠️  ${totalViolations} TOTAL VIOLATIONS - FIXES REQUIRED${Colors.END}`
    );
  }

  console.log("=".repeat(75) + "\n");

  return totalViolations > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  checkBannerComments,
  checkAmericanSpelling,
  checkEmojiComments,
  checkArrowText,
};
