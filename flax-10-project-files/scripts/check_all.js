#!/usr/bin/env node
/**
 * Code Quality Checker - BAND V COMPLIANCE
 * Requirements: ≤15 lines | ≤1 nesting | ≤400 lines/file
 * Test files: ≤25 lines for test functions | ≤2 nesting
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// ANSI Colors
const Colors = {
    RED: '\x1b[91m',
    YELLOW: '\x1b[33m',
    MAGENTA: '\x1b[95m',
    BOLD: '\x1b[1m',
    END: '\x1b[0m'
};

function printHeader() {
    console.log('\n' + '='.repeat(75));
    console.log(`${Colors.BOLD}${Colors.MAGENTA}${'BAND V CODE QUALITY REPORT - JAVASCRIPT'.padStart(50)}${Colors.END}`);
    console.log('='.repeat(75));
    console.log('Requirements: ≤15 lines | ≤1 nesting | ≤400 lines/file');
    console.log('Test files: ≤25 lines for test functions\n');
}

function printSection(number, title) {
    console.log(`\n${Colors.BOLD}${Colors.YELLOW}${number}. ${title}${Colors.END}`);
    console.log('─'.repeat(75));
}

function printSubsection(title) {
    console.log(`\n${Colors.BOLD}${title}${Colors.END}`);
    console.log('·'.repeat(75));
}

function shortenPath(filePath) {
    return filePath.replace(/^\.\.\/frontend\//, '');
}

function isTestFile(filePath) {
    return filePath.includes('/__tests__/') || 
           filePath.includes('/tests/') ||
           /\.(test|spec)\.(js|jsx)$/.test(filePath);
}

function isTestFrameworkCallback(path) {
    // Check if this function is a callback to describe/it/test/etc.
    const parent = path.parent;
    if (parent.type !== 'CallExpression') return false;
    
    const callee = parent.callee;
    const testFunctions = [
        'describe', 'it', 'test', 'beforeEach', 'afterEach', 
        'beforeAll', 'afterAll', 'expect', 'context'
    ];
    
    if (callee.type === 'Identifier' && testFunctions.includes(callee.name)) {
        return true;
    }
    
    // Handle it.skip, describe.only, etc.
    if (callee.type === 'MemberExpression' && 
        callee.object.type === 'Identifier' && 
        testFunctions.includes(callee.object.name)) {
        return true;
    }
    
    return false;
}

function countFunctionLines(node, sourceLines) {
    if (!node.loc) return 0;
    
    let startLine = node.loc.start.line;
    const endLine = node.loc.end.line;
    
    // Skip the function declaration line
    if (node.type === 'FunctionDeclaration' || 
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'FunctionExpression') {
        // If function has a body, start from the opening brace
        if (node.body && node.body.type === 'BlockStatement') {
            startLine = node.body.loc.start.line + 1; // Skip opening brace
        }
    }
    
    // For arrow functions, handle both block and expression bodies
    if (node.type === 'ArrowFunctionExpression') {
        if (node.body.type !== 'BlockStatement') {
            // Single expression arrow function
            return 1;
        }
    }
    
    return Math.max(0, endLine - startLine);
}

function isElseIf(path) {
    // Check if this IfStatement is directly in the alternate branch of another IfStatement
    const parent = path.parent;
    if (!parent || parent.type !== 'IfStatement') return false;
    return parent.alternate === path.node;
}

function getNestingLevel(path, level = 0) {
    let maxLevel = level;
    
    const nestingNodes = [
        'IfStatement',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'WhileStatement',
        'DoWhileStatement',
        'SwitchStatement',
        'TryStatement',
        'WithStatement'
    ];
    
    path.traverse({
        enter(innerPath) {
            if (nestingNodes.includes(innerPath.node.type)) {
                // Don't count else-if as an additional level
                if (innerPath.node.type === 'IfStatement' && isElseIf(innerPath)) {
                    return; // Skip this, it's part of an else-if chain
                }
                
                const currentLevel = level + 1;
                const childLevel = getNestingLevel(innerPath, currentLevel);
                maxLevel = Math.max(maxLevel, childLevel);
                innerPath.skip(); // Don't traverse children again
            }
        }
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
                if (!['node_modules', 'coverage', 'build', 'dist', '.git'].includes(file)) {
                    walkDir(filePath);
                }
                continue;
            }
            
            if (!/\.(js|jsx)$/.test(file)) continue;
            
            const isTest = isTestFile(filePath);
            const limit = isTest ? 25 : 15;
            
            try {
                const code = fs.readFileSync(filePath, 'utf-8');
                const sourceLines = code.split('\n');
                
                const ast = parser.parse(code, {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript']
                });
                
                traverse(ast, {
                    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(path) {
                        const node = path.node;
                        
                        // Skip test framework callbacks in test files
                        if (isTest && isTestFrameworkCallback(path)) {
                            return;
                        }
                        
                        const lines = countFunctionLines(node, sourceLines);
                        
                        if (lines > limit) {
                            let functionName = 'anonymous';
                            
                            if (node.id && node.id.name) {
                                functionName = node.id.name;
                            } else if (path.parent.type === 'VariableDeclarator' && path.parent.id.name) {
                                functionName = path.parent.id.name;
                            } else if (path.parent.type === 'Property' && path.parent.key.name) {
                                functionName = path.parent.key.name;
                            } else if (path.parent.type === 'MethodDefinition' && path.parent.key.name) {
                                functionName = path.parent.key.name;
                            }
                            
                            violations.push({
                                file: shortenPath(filePath),
                                name: functionName,
                                lines: lines,
                                limit: limit,
                                is_test: isTest
                            });
                        }
                    }
                });
            } catch (error) {
                // Skip files with parse errors
                console.error(`Parse error in ${shortenPath(filePath)}: ${error.message}`);
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
                if (!['node_modules', 'coverage', 'build', 'dist', '.git'].includes(file)) {
                    walkDir(filePath);
                }
                continue;
            }
            
            if (!/\.(js|jsx|css)$/.test(file)) continue;
            
            try {
                const code = fs.readFileSync(filePath, 'utf-8');
                const lines = code.split('\n').length;
                
                if (lines > 400) {
                    violations.push({
                        file: shortenPath(filePath),
                        lines: lines,
                        over: lines - 400
                    });
                }
            } catch (error) {
                // Skip files with read errors
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
                if (!['node_modules', 'coverage', 'build', 'dist', '.git'].includes(file)) {
                    walkDir(filePath);
                }
                continue;
            }
            
            if (!/\.(js|jsx)$/.test(file)) continue;
            
            const isTest = isTestFile(filePath);
            const limit = isTest ? 2 : 1;
            
            try {
                const code = fs.readFileSync(filePath, 'utf-8');
                
                const ast = parser.parse(code, {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript']
                });
                
                traverse(ast, {
                    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(path) {
                        const node = path.node;
                        
                        // Skip test framework callbacks in test files
                        if (isTest && isTestFrameworkCallback(path)) {
                            return;
                        }
                        
                        const nesting = getNestingLevel(path);
                        
                        if (nesting > limit) {
                            let functionName = 'anonymous';
                            
                            if (node.id && node.id.name) {
                                functionName = node.id.name;
                            } else if (path.parent.type === 'VariableDeclarator' && path.parent.id.name) {
                                functionName = path.parent.id.name;
                            } else if (path.parent.type === 'Property' && path.parent.key.name) {
                                functionName = path.parent.key.name;
                            } else if (path.parent.type === 'MethodDefinition' && path.parent.key.name) {
                                functionName = path.parent.key.name;
                            }
                            
                            violations.push({
                                file: shortenPath(filePath),
                                name: functionName,
                                nesting: nesting,
                                limit: limit,
                                is_test: isTest
                            });
                        }
                    }
                });
            } catch (error) {
                // Skip files with parse errors
            }
        }
    }
    
    walkDir(targetDir);
    return violations;
}

function main() {
    const target = '../frontend';
    
    printHeader();
    
    // 1. Function Length
    printSection('1', 'FUNCTION LENGTH');
    const funcViolations = checkFunctionLength(target);
    
    const regularFunc = funcViolations.filter(v => !v.is_test);
    const testFunc = funcViolations.filter(v => v.is_test);
    
    // Regular files
    printSubsection('Regular Files (≤15 lines)');
    if (regularFunc.length > 0) {
        console.log(`\n${Colors.RED}❌ ${regularFunc.length} VIOLATION(S)${Colors.END}\n`);
        regularFunc.sort((a, b) => b.lines - a.lines).forEach(v => {
            console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
            console.log(`  ${v.name}() → ${Colors.RED}${v.lines} lines${Colors.END} (limit: ${v.limit})\n`);
        });
    } else {
        console.log('\n✅ All regular functions meet Band V requirements\n');
    }
    
    // Test files
    printSubsection('Test Files (≤25 lines)');
    if (testFunc.length > 0) {
        console.log(`\n${Colors.RED}❌ ${testFunc.length} VIOLATION(S)${Colors.END}\n`);
        testFunc.sort((a, b) => b.lines - a.lines).forEach(v => {
            console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
            console.log(`  ${v.name}() → ${Colors.RED}${v.lines} lines${Colors.END} (limit: ${v.limit})\n`);
        });
    } else {
        console.log('\n✅ All test functions meet Band V requirements\n');
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
    
    const regularNest = nestViolations.filter(v => !v.is_test);
    const testNest = nestViolations.filter(v => v.is_test);
    
    // Regular files
    printSubsection('Regular Files (≤1 level)');
    if (regularNest.length > 0) {
        console.log(`\n${Colors.RED}❌ ${regularNest.length} VIOLATION(S)${Colors.END}\n`);
        regularNest.sort((a, b) => b.nesting - a.nesting).forEach(v => {
            console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
            console.log(`  ${v.name}() → ${Colors.RED}${v.nesting} levels${Colors.END} (limit: ${v.limit})\n`);
        });
    } else {
        console.log('\n✅ All regular functions meet Band V requirements\n');
    }
    
    // Test files
    printSubsection('Test Files (≤2 levels)');
    if (testNest.length > 0) {
        console.log(`\n${Colors.RED}❌ ${testNest.length} VIOLATION(S)${Colors.END}\n`);
        testNest.sort((a, b) => b.nesting - a.nesting).forEach(v => {
            console.log(`${Colors.BOLD}${v.file}${Colors.END}`);
            console.log(`  ${v.name}() → ${Colors.RED}${v.nesting} levels${Colors.END} (limit: ${v.limit})\n`);
        });
    } else {
        console.log('\n✅ All test functions meet Band V requirements\n');
    }
    
    // Summary
    console.log('─'.repeat(75));
    console.log(`${Colors.BOLD}${Colors.YELLOW}SUMMARY${Colors.END}`);
    console.log('─'.repeat(75) + '\n');
    
    const totalViolations = funcViolations.length + fileViolations.length + nestViolations.length;
    
    console.log(`Function Length:  ${funcViolations.length > 0 ? '❌' : '✅'} ${funcViolations.length} violation(s) (${regularFunc.length} regular, ${testFunc.length} test)`);
    console.log(`File Length:      ${fileViolations.length > 0 ? '❌' : '✅'} ${fileViolations.length} violation(s)`);
    console.log(`Nesting Depth:    ${nestViolations.length > 0 ? '❌' : '✅'} ${nestViolations.length} violation(s) (${regularNest.length} regular, ${testNest.length} test)`);
    
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

module.exports = { checkFunctionLength, checkFileLength, checkNesting };