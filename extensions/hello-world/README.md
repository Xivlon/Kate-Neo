# Hello World Extension

A simple example extension for Kate Neo IDE that demonstrates the extension API.

## Features

- Demonstrates extension activation
- Registers a simple command
- Shows how to use the extension API

## Usage

1. The extension activates automatically when Kate Neo starts
2. Use the Command Palette to run "Hello World: Say Hello"
3. You'll see a notification message

## Extension API Used

- `commands.registerCommand()` - Register a custom command
- `window.showInformationMessage()` - Show notifications
- `context.subscriptions` - Manage disposables for cleanup

## Development

This extension serves as a template for creating Kate Neo extensions. See the source code for examples of:
- Extension manifest (package.json)
- Activation function
- Command registration
- Resource cleanup
