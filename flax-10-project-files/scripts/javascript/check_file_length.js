#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function checkFile(filepath, limit = 400) {
  const code = fs.readFileSync(filepath, 'utf-8');
  const lines = code.split('\n');
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim()).length;
  
  if (totalLines > limit) {
    return {
      file: filepath,
      totalLines,
      nonEmptyLines,
      limit,
      violation: true
    };
  } else if (totalLines > limit * 0.9) {
    return {
      file: filepath,
      totalLines,
      nonEmptyLines,
      limit,
      violation: false
    };
  }
  
  return null;
}

function walkDir(dir, results = [], warnings = [], limit = 400) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        walkDir(filepath, results, warnings, limit);
      }
    } else if (file.match(/\.(js|jsx)$/)) {
      const result = checkFile(filepath, limit);
      if (result) {
        if (result.violation) {
          results.push(result);
        } else {
          warnings.push(result);
        }
      }
    }
  });
  return { results, warnings };
}

const targetDir = process.argv[2] || 'src';
const limit = 400;
const { results, warnings } = walkDir(targetDir, [], [], limit);

results.sort((a, b) => b.totalLines - a.totalLines);
warnings.sort((a, b) => b.totalLines - a.totalLines);

console.log('📄 FILE LENGTH CHECK - JavaScript/JSX');
console.log(`Limit: ${limit} lines\n`);
console.log('='.repeat(70));

if (results.length > 0) {
  console.log(`\n❌ VIOLATIONS (>${limit} lines):`);
  console.log('='.repeat(70));
  results.forEach(r => {
    console.log(`❌ ${r.file}`);
    console.log(`   Total: ${r.totalLines} lines (non-empty: ${r.nonEmptyLines})`);
    console.log(`   Exceeds limit by: ${r.totalLines - limit} lines\n`);
  });
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (>${limit * 0.9} lines, approaching limit):`);
  console.log('='.repeat(70));
  warnings.forEach(w => {
    console.log(`⚠️  ${w.file}`);
    console.log(`   Total: ${w.totalLines} lines (non-empty: ${w.nonEmptyLines})`);
    console.log(`   ${limit - w.totalLines} lines remaining before limit\n`);
  });
}

console.log('='.repeat(70));
console.log('SUMMARY:');
console.log(`❌ Files over ${limit} lines: ${results.length}`);
console.log(`⚠️  Files approaching limit (>${limit * 0.9} lines): ${warnings.length}`);

if (results.length > 0) {
  console.log(`\n⚠️  ACTION REQUIRED: Refactor files exceeding ${limit} lines!`);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Warning: Some files are approaching the limit.');
} else {
  console.log(`\n✅ All files are within the ${limit} line limit!`);
}