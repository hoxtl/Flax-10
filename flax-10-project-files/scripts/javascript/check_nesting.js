#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getNestingLevel(code) {
  const lines = code.split('\n');
  const results = [];
  
  // Find functions
  const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*(?:async\s*)?function)/g;
  
  let match;
  while ((match = funcRegex.exec(code)) !== null) {
    const name = match[1] || match[2] || match[3] || 'anonymous';
    const startIdx = match.index;
    
    // Find function body
    let braceCount = 0;
    let funcStart = -1;
    let funcEnd = -1;
    
    for (let i = startIdx; i < code.length; i++) {
      if (code[i] === '{') {
        if (funcStart === -1) funcStart = i;
        braceCount++;
      } else if (code[i] === '}') {
        braceCount--;
        if (braceCount === 0 && funcStart !== -1) {
          funcEnd = i;
          break;
        }
      }
    }
    
    if (funcStart !== -1 && funcEnd !== -1) {
      const funcBody = code.substring(funcStart, funcEnd);
      
      // Count control structures
      const controlStructures = funcBody.match(/\b(if|for|while|switch|try)\s*\(/g);
      const nesting = controlStructures ? controlStructures.length : 0;
      
      if (nesting > 1) {
        results.push({ name, nesting });
      }
    }
  }
  
  return results;
}

function checkFile(filepath) {
  const code = fs.readFileSync(filepath, 'utf-8');
  const results = getNestingLevel(code);
  
  results.forEach(r => {
    const isTest = filepath.includes('/tests/') || filepath.includes('.test.') || filepath.includes('.spec.');
    
    if (r.nesting > 2) {
      console.log(`❌ ${filepath}: ${r.name}() - ${r.nesting} levels (Band III or lower)`);
    } else if (r.nesting === 2) {
      if (isTest) {
        console.log(`✅ ${filepath}: ${r.name}() - ${r.nesting} levels (OK for tests)`);
      } else {
        console.log(`⚠️  ${filepath}: ${r.name}() - ${r.nesting} levels (Band IV - review recommended)`);
      }
    }
  });
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        walkDir(filepath);
      }
    } else if (file.match(/\.(js|jsx)$/)) {
      checkFile(filepath);
    }
  });
}

console.log('🔀 NESTING DEPTH CHECK - JavaScript/JSX');
console.log('Band V: ≤1 level | Band IV: ≤2 levels\n');
console.log('='.repeat(70));

const targetDir = process.argv[2] || 'src';
walkDir(targetDir);