#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function countFunctionLines(code, startIdx) {
  let braceCount = 0;
  let started = false;
  let lines = 0;
  
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') {
      if (!started) started = true;
      braceCount++;
    } else if (code[i] === '}') {
      braceCount--;
      if (braceCount === 0 && started) {
        const funcBody = code.substring(startIdx, i + 1);
        lines = funcBody.split('\n').length;
        break;
      }
    }
  }
  return lines;
}

function checkFile(filepath) {
  const code = fs.readFileSync(filepath, 'utf-8');
  const results = [];
  
  // Match: function name(), const name = () =>, const name = function()
  const regex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*(?:async\s*)?function)/g;
  
  let match;
  while ((match = regex.exec(code)) !== null) {
    const name = match[1] || match[2] || match[3] || 'anonymous';
    const lines = countFunctionLines(code, match.index);
    
    if (lines > 15) {
      results.push({ file: filepath, name, lines, limit: 15 });
    }
  }
  
  return results;
}

function walkDir(dir, results = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        walkDir(filepath, results);
      }
    } else if (file.match(/\.(js|jsx)$/)) {
      results.push(...checkFile(filepath));
    }
  });
  return results;
}

const targetDir = process.argv[2] || '../../frontend/src';  // Updated path
const results = walkDir(targetDir);
results.sort((a, b) => b.lines - a.lines);

console.log('🔧 FUNCTION LENGTH CHECK - JavaScript/JSX');
console.log('Band V: ≤15 lines | Band IV: ≤25 lines\n');
console.log('='.repeat(70));

results.forEach(r => {
  const status = r.lines > 25 ? '❌' : '⚠️';
  const msg = r.lines > 25 ? '(>25 VIOLATION)' : `(>${r.limit})`;
  console.log(`${status} ${r.file}: ${r.name}() - ${r.lines} lines ${msg}`);
});

console.log('\n' + '='.repeat(70));
console.log('SUMMARY:');
const violations = results.filter(r => r.lines > 25);
const warnings = results.filter(r => r.lines <= 25);
console.log(`❌ Violations (>25 lines): ${violations.length}`);
console.log(`⚠️  Warnings (15-25 lines): ${warnings.length}`);
console.log(`Total functions over limit: ${results.length}`);