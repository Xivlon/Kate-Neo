/**
 * Simple Kate Native Module Example
 * 
 * Demonstrates basic usage of the Kate native bindings
 */

const kate = require('../index.js');

console.log('Kate Native Module - Simple Example\n');

// Check availability
console.log('Kate Available:', kate.isKateAvailable());
console.log('Qt Running:', kate.isQtRunning());
console.log();

if (!kate.isKateAvailable()) {
    console.log('Note: Running in fallback mode (KTextEditor not available)');
    console.log('Install Qt5 and KF5 libraries to enable full functionality.\n');
}

// Create a document
console.log('Creating document...');
const doc = kate.createDocument();

// Set some text
console.log('Setting text...');
doc.setText(`// JavaScript Example
function hello(name) {
  console.log('Hello, ' + name + '!');
}

hello('World');
`);

// Display document info
console.log('\nDocument Information:');
console.log('  Lines:', doc.lineCount());
console.log('  Length:', doc.length(), 'characters');
console.log('  Modified:', doc.isModified());

// Show some lines
console.log('\nFirst 3 lines:');
for (let i = 0; i < Math.min(3, doc.lineCount()); i++) {
    console.log(`  ${i}: ${doc.line(i)}`);
}

// Set syntax highlighting
console.log('\nSetting syntax mode to JavaScript...');
doc.setMode('JavaScript');
console.log('Current mode:', doc.mode());

// Edit the document
console.log('\nInserting comment at top...');
doc.insertText(0, 0, '// Kate Native Module Example\n');
console.log('New line count:', doc.lineCount());
console.log('First line:', doc.line(0));

// Get editor info
console.log('\nEditor Information:');
try {
    const editor = kate.getEditor();
    console.log('  Version:', editor.version());
    console.log('  Name:', editor.applicationName());
} catch (error) {
    console.log('  (Editor info not available in fallback mode)');
}

console.log('\nExample completed successfully!');
