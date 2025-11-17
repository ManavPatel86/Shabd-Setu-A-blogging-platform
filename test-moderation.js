// Test file to verify moderation fixes
// Run this with: node test-moderation.js

import { moderateComment } from './api/utils/moderation.js';

const testCases = [
  {
    input: "youre a big mother fucker",
    expected: "BLOCKED",
    description: "Contraction without space (motherfucker)"
  },
  {
    input: "you're a big mother fucker",
    expected: "BLOCKED",
    description: "Contraction with apostrophe"
  },
  {
    input: "you're a big mother-fucker",
    expected: "BLOCKED",
    description: "Hyphenated version"
  },
  {
    input: "you're a big MoThEr FuCkEr",
    expected: "BLOCKED",
    description: "Mixed case"
  },
  {
    input: "This is motherfucker content",
    expected: "BLOCKED",
    description: "Original test case"
  },
  {
    input: "What the shit is this?",
    expected: "BLOCKED",
    description: "With punctuation"
  },
  {
    input: "What the sh*t is this?",
    expected: "BLOCKED",
    description: "With asterisk replacement"
  },
  {
    input: "You're a damn idiot",
    expected: "BLOCKED",
    description: "Multiple offensive words"
  },
  {
    input: "Great article, thanks for sharing!",
    expected: "ALLOWED",
    description: "Clean comment"
  },
  {
    input: "I really enjoyed this piece!",
    expected: "ALLOWED",
    description: "Another clean comment"
  },
  {
    input: "mother   fucker",
    expected: "BLOCKED",
    description: "Multiple spaces"
  }
];

async function runTests() {
  console.log('🧪 Running Moderation Tests\n');
  console.log('=' .repeat(70));
  
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const result = await moderateComment(test.input);
    const isBlocked = !result.safe;
    const expected = test.expected === "BLOCKED";
    const status = isBlocked === expected ? '✅ PASS' : '❌ FAIL';
    
    if (isBlocked === expected) {
      passed++;
    } else {
      failed++;
    }

    console.log(`\n${status} | ${test.description}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: ${test.expected} | Got: ${isBlocked ? 'BLOCKED' : 'ALLOWED'}`);
    
    if (isBlocked) {
      console.log(`   Issues: ${result.badLines[0]?.issues.join(', ')}`);
      console.log(`   Category: ${result.badLines[0]?.category}`);
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`⚠️  ${failed} test(s) failed`);
  }
}

runTests().catch(console.error);
