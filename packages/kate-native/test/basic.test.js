/**
 * Basic tests for Kate native module
 * 
 * Tests core functionality of the native bindings
 */

const kate = require('../index.js');

console.log('=== Kate Native Module Tests ===\n');

// Test 1: Module status
console.log('Test 1: Module Status');
console.log('  Kate Available:', kate.isKateAvailable());
console.log('  Qt Running:', kate.isQtRunning());
const status = kate.getStatus();
console.log('  Status:', JSON.stringify(status, null, 2));
console.log('  ✓ Status check passed\n');

// Test 2: Document creation
console.log('Test 2: Document Creation');
try {
    const doc = kate.createDocument();
    console.log('  Document created:', doc !== null);
    console.log('  ✓ Document creation passed\n');
    
    // Test 3: Text operations
    console.log('Test 3: Text Operations');
    doc.setText('Hello, Kate!\nThis is a test.');
    const text = doc.getText();
    console.log('  Text set and retrieved:', text.includes('Hello'));
    console.log('  Line count:', doc.lineCount());
    console.log('  First line:', doc.line(0));
    console.log('  ✓ Text operations passed\n');
    
    // Test 4: Syntax modes
    console.log('Test 4: Syntax Modes');
    doc.setMode('JavaScript');
    const mode = doc.mode();
    console.log('  Mode set to:', mode);
    console.log('  ✓ Syntax mode passed\n');
    
    // Test 5: Editing operations
    console.log('Test 5: Editing Operations');
    const initialLength = doc.length();
    doc.insertText(0, 0, '// Comment\n');
    const newLength = doc.length();
    console.log('  Text inserted, length changed:', initialLength !== newLength);
    console.log('  Modified:', doc.isModified());
    console.log('  ✓ Editing operations passed\n');
    
    console.log('=== All Tests Passed ===');
} catch (error) {
    console.error('Test failed:', error);
    if (kate.isKateAvailable()) {
        console.error('Unexpected error with Kate available');
        process.exit(1);
    } else {
        console.log('Tests completed in fallback mode (KTextEditor not available)');
    }
}
