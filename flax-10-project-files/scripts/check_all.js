#!/usr/bin/env node
/**
 * Code Quality Checker - BAND V COMPLIANCE
 * Requirements: ≤15 lines | ≤1 nesting | ≤400 lines/file
 */

const fs = require('fs');
const path = require('path');

// ANSI Colors - Fixed for JavaScript
const Colors = {
  RED: '\x1b[91m',      // Changed from \033
  YELLOW: '\x1b[33m',   // Changed from \033
  MAGENTA: '\x1b[95m',  // Changed from \033
  BOLD: '\x1b[1m',      // Changed from \033
  END: '\x1b[0m'        // Changed from \033
};

function printHeader() {
  console.log('\n' + '='.repeat(75));
  console.log(`${Colors.BOLD}${Colors.MAGENTA}${'BAND V CODE QUALITY REPORT - JAVASCRIPT'.padStart(62).padEnd(75)}${Colors.END}`);
  console.log('='.repeat(75));
  console.log('Requirements: ≤15 lines | ≤1 nesting | ≤400 lines/file\n');
}

function printSection(number, title) {
  console.log(`\n${Colors.BOLD}${Colors.YELLOW}${number}. ${title}${Colors.END}`);
  console.log('─'.repeat(75));
}

function shortenPath(filepath) {
  return filepath.replace('../../frontend/src/', '');
}

function countFunctionLines(code, startIdx) {
  let braceCount = 0;
  let started = false;
  
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') {
      if (!started) started = true;
      braceCount++;
    } else if (code[i] === '}') {
      braceCount--;
      if (braceCount === 0 && started) {
        const funcBody = code.substring(startIdx, i + 1);
        return funcBody.split('\n').length;
      }
    }
  }
  return 0;
}

function checkFunctionLength(targetDir) {
  const violations = [];
  
  function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
      const filepath = path.join(dir, file);
      
      if (fs.statSync(filepath).isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          walkDir(filepath);
        }
        return;
      }
      
      if (!file.match(/\.(js|jsx)$/)) return;
      
      const code = fs.readFileSync(filepath, 'utf-8');
      const isTest = filepath.includes('/tests/') || filepath.includes('.test.') || filepath.includes('.spec.');
      const limit = isTest ? 25 : 15;
      
      const regex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*(?:async\s*)?function)/g;
      
      let match;
      while ((match = regex.exec(code)) !== null) {
        const name = match[1] || match[2] || match[3] || 'anonymous';
        const lines = countFunctionLines(code, match.index);
        
        if (lines > limit) {
          violations.push({
            file: shortenPath(filepath),
            name,
            lines,
            limit,
            isTest
          });
        }
      }
    });
  }
  
  walkDir(targetDir);
  return violations;
}

function checkFileLength(targetDir) {
  const violations = [];
  
  function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
      const filepath = path.join(dir, file);
      
      if (fs.statSync(filepath).isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          walkDir(filepath);
        }
        return;
      }
      
      if (!file.match(/\.(js|jsx)$/)) return;
      
      const code = fs.readFileSync(filepath, 'utf-8');
      const lines = code.split('\n').length;
      
      if (lines > 400) {
        violations.push({
          file: shortenPath(filepath),
          lines,
          over: lines - 400
        });
      }
    });
  }
  
  walkDir(targetDir);
  return violations;
}

function checkNesting(targetDir) {
  const violations = [];
  
  function countNesting(code, startIdx, endIdx) {
    const funcBody = code.substring(startIdx, endIdx);
    const controlStructures = funcBody.match(/\b(if|for|while|switch|try)\s*\(/g);
    return controlStructures ? controlStructures.length : 0;
  }
  
  function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
      const filepath = path.join(dir, file);
      
      if (fs.statSync(filepath).isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          walkDir(filepath);
        }
        return;
      }
      
      if (!file.match(/\.(js|jsx)$/)) return;
      
      const code = fs.readFileSync(filepath, 'utf-8');
      const isTest = filepath.includes('/tests/') || filepath.includes('.test.') || filepath.includes('.spec.');
      const limit = isTest ? 2 : 1;
      
      const regex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*(?:async\s*)?function)/g;
      
      let match;
      while ((match = regex.exec(code)) !== null) {
        const name = match[1] || match[2] || match[3] || 'anonymous';
        
        // Find function body
        let braceCount = 0;
        let funcStart = -1;
        let funcEnd = -1;
        
        for (let i = match.index; i < code.length; i++) {
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
          const nesting = countNesting(code, funcStart, funcEnd);
          
          if (nesting > limit) {
            violations.push({
              file: shortenPath(filepath),
              name,
              nesting,
              limit,
              isTest
            });
          }
        }
      }
    });
  }
  
  walkDir(targetDir);
  return violations;
}

function main() {
  const target = '../../frontend/src';
  
  printHeader();
  
  // 1. Function Length
  printSection('1', 'FUNCTION LENGTH');
  const funcViolations = checkFunctionLength(target);
  
  if (funcViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${funcViolations.length} VIOLATION(S)${Colors.END}\n`);
    funcViolations.sort((a, b) => b.lines - a.lines).forEach(v => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${v.name}() → ${Colors.RED}${v.lines} lines${Colors.END} (limit: ${v.limit})\n`);
    });
  } else {
    console.log('\n✅ All functions meet Band V requirements\n');
  }
  
  // 2. File Length
  printSection('2', 'FILE LENGTH');
  const fileViolations = checkFileLength(target);
  
  if (fileViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${fileViolations.length} VIOLATION(S)${Colors.END}\n`);
    fileViolations.sort((a, b) => b.lines - a.lines).forEach(v => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${Colors.RED}${v.lines} lines${Colors.END} (over by ${v.over})\n`);
    });
  } else {
    console.log('\n✅ All files meet Band V requirements\n');
  }
  
  // 3. Nesting Depth
  printSection('3', 'NESTING DEPTH');
  const nestViolations = checkNesting(target);
  
  if (nestViolations.length > 0) {
    console.log(`\n${Colors.RED}❌ ${nestViolations.length} VIOLATION(S)${Colors.END}\n`);
    nestViolations.sort((a, b) => b.nesting - a.nesting).forEach(v => {
      console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
      console.log(`  ${v.name}() → ${Colors.RED}${v.nesting} levels${Colors.END} (limit: ${v.limit})\n`);
    });
  } else {
    console.log('\n✅ All functions meet Band V requirements\n');
  }
  
  // Summary
  console.log('─'.repeat(75));
  console.log(`${Colors.BOLD}${Colors.YELLOW}SUMMARY${Colors.END}`);
  console.log('─'.repeat(75) + '\n');
  
  const totalViolations = funcViolations.length + fileViolations.length + nestViolations.length;
  
  console.log(`Function Length:  ${funcViolations.length > 0 ? '❌' : '✅'} ${funcViolations.length} violation(s)`);
  console.log(`File Length:      ${fileViolations.length > 0 ? '❌' : '✅'} ${fileViolations.length} violation(s)`);
  console.log(`Nesting Depth:    ${nestViolations.length > 0 ? '❌' : '✅'} ${nestViolations.length} violation(s)`);
  
  console.log('\n' + '='.repeat(75));
  
  if (totalViolations === 0) {
    console.log(`${Colors.YELLOW}🎉 BAND V READY! ALL REQUIREMENTS MET!${Colors.END}`);
  } else {
    console.log(`${Colors.YELLOW}⚠️  ${totalViolations} TOTAL VIOLATIONS - REFACTORING REQUIRED${Colors.END}`);
  }
  
  console.log('='.repeat(75) + '\n');
  
  return totalViolations > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exit(main());
}