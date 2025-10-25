/**
 * Hello World Extension
 * 
 * Example extension demonstrating the Kate Neo extension API
 */

module.exports = {
  activate: function(context) {
    console.log('[HelloWorld] Extension activated!');
    
    // Register a command
    const disposable = context.api.commands.registerCommand(
      'helloWorld.sayHello',
      () => {
        context.api.window.showInformationMessage('Hello from Kate Neo Extension!');
      }
    );
    
    // Add to subscriptions for cleanup
    context.subscriptions.push(disposable);
    
    // Log activation
    context.api.window.showInformationMessage('Hello World extension is now active!');
  },
  
  deactivate: function() {
    console.log('[HelloWorld] Extension deactivated!');
  }
};
