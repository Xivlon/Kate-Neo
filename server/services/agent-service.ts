/**
 * Agent Service
 *
 * Manages AI coding agent operations including file operations,
 * code generation, project analysis, and multi-step task execution.
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import {
  AgentTaskRequest,
  AgentTaskResponse,
  AgentTaskStep,
  AgentContext,
  AgentCapabilities,
  CodeGenerationRequest,
  CodeGenerationResponse,
  CodeModificationRequest,
  CodeModificationResponse,
  ProjectAnalysisRequest,
  ProjectAnalysisResponse,
  FileOperationRequest,
  FileOperationResponse,
  AgentSettings,
} from '../../shared/agent-types.js';
import { ChatMessage } from '../../shared/ai-types.js';
import { AIService } from './ai-service.js';

/**
 * Agent Service for handling coding agent operations
 */
export class AgentService extends EventEmitter {
  private aiService: AIService;
  private workspaceRoot: string;
  private activeTasks: Map<string, AgentContext> = new Map();
  private settings: AgentSettings;

  constructor(aiService: AIService, workspaceRoot: string) {
    super();
    this.aiService = aiService;
    this.workspaceRoot = workspaceRoot;
    this.settings = {
      mode: 'agent',
      autoExecute: false,
      confirmFileWrites: true,
      maxTokensPerTask: 4000,
      includeProjectContext: true,
    };
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapabilities {
    return {
      canReadFiles: true,
      canWriteFiles: true,
      canExecuteCommands: false, // Could be enabled with proper sandboxing
      canAnalyzeProject: true,
      maxFileSize: 1024 * 1024, // 1MB
      maxConcurrentTasks: 5,
    };
  }

  /**
   * Update agent settings
   */
  updateSettings(settings: Partial<AgentSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.emit('settingsChanged', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): AgentSettings {
    return this.settings;
  }

  /**
   * Execute an agent task
   */
  async executeTask(request: AgentTaskRequest): Promise<AgentTaskResponse> {
    const taskId = crypto.randomUUID();
    const steps: AgentTaskStep[] = [];

    try {
      // Create task context
      const context: AgentContext = {
        taskId,
        workingDirectory: this.workspaceRoot,
        files: new Map(),
        messages: [],
      };
      this.activeTasks.set(taskId, context);

      // Route to appropriate handler
      switch (request.type) {
        case 'read_file':
          return await this.handleReadFile(request, context, steps);
        case 'write_file':
          return await this.handleWriteFile(request, context, steps);
        case 'list_files':
          return await this.handleListFiles(request, context, steps);
        case 'generate_code':
          return await this.handleGenerateCode(request, context, steps);
        case 'modify_code':
          return await this.handleModifyCode(request, context, steps);
        case 'create_component':
          return await this.handleCreateComponent(request, context, steps);
        case 'refactor':
          return await this.handleRefactor(request, context, steps);
        case 'analyze_project':
          return await this.handleAnalyzeProject(request, context, steps);
        case 'multi_step_task':
          return await this.handleMultiStepTask(request, context, steps);
        default:
          throw new Error(`Unknown task type: ${request.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        steps,
      };
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  /**
   * Handle file read operation
   */
  private async handleReadFile(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('read_file', `Reading file: ${request.targetFile}`);
    steps.push(step);

    try {
      if (!request.targetFile) {
        throw new Error('No target file specified');
      }

      const filePath = path.resolve(this.workspaceRoot, request.targetFile);

      // Security check: ensure file is within workspace
      if (!filePath.startsWith(this.workspaceRoot)) {
        throw new Error('Access denied: File outside workspace');
      }

      const content = await fs.readFile(filePath, 'utf-8');
      context.files.set(request.targetFile, content);

      step.status = 'completed';
      step.result = { path: request.targetFile, size: content.length };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        result: { content, path: request.targetFile },
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle file write operation
   */
  private async handleWriteFile(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('write_file', `Writing file: ${request.targetFile}`);
    steps.push(step);

    try {
      if (!request.targetFile || request.code === undefined) {
        throw new Error('No target file or content specified');
      }

      const filePath = path.resolve(this.workspaceRoot, request.targetFile);

      // Security check
      if (!filePath.startsWith(this.workspaceRoot)) {
        throw new Error('Access denied: File outside workspace');
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write file
      await fs.writeFile(filePath, request.code, 'utf-8');

      step.status = 'completed';
      step.result = { path: request.targetFile, size: request.code.length };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        modifiedFiles: [request.targetFile],
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle list files operation
   */
  private async handleListFiles(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('list_files', 'Listing project files');
    steps.push(step);

    try {
      const pattern = request.targetFile || '**/*';
      const files = await glob(pattern, {
        cwd: this.workspaceRoot,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**'],
        nodir: true,
      });

      step.status = 'completed';
      step.result = { count: files.length };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        result: { files },
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle code generation
   */
  private async handleGenerateCode(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('generate_code', 'Generating code');
    steps.push(step);

    try {
      // Load context files if specified
      if (request.files && request.files.length > 0) {
        await this.loadContextFiles(request.files, context);
      }

      // Build prompt for code generation
      const prompt = this.buildCodeGenerationPrompt(request, context);

      // Call AI service
      const messages: ChatMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'You are an expert coding assistant. Generate clean, well-documented, production-ready code based on the requirements. Only output the code, no explanations unless asked.',
          timestamp: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        },
      ];

      const response = await this.aiService.chatCompletion({
        messages,
        maxTokens: this.settings.maxTokensPerTask,
      });

      if (!response.success || !response.message) {
        throw new Error(response.error || 'Failed to generate code');
      }

      const generatedCode = this.extractCodeFromResponse(response.message.content);

      step.status = 'completed';
      step.result = { codeLength: generatedCode.length };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        generatedCode,
        result: { code: generatedCode },
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle code modification
   */
  private async handleModifyCode(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('modify_code', `Modifying code: ${request.targetFile}`);
    steps.push(step);

    try {
      if (!request.targetFile || !request.instruction) {
        throw new Error('Missing target file or instruction');
      }

      // Read the file
      const filePath = path.resolve(this.workspaceRoot, request.targetFile);
      const originalCode = await fs.readFile(filePath, 'utf-8');

      // Build modification prompt
      const prompt = `Modify the following ${request.language || ''} code according to this instruction: ${request.instruction}

Original code:
\`\`\`${request.language || ''}
${originalCode}
\`\`\`

Please provide the complete modified code. Only output the code, nothing else.`;

      const messages: ChatMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'You are an expert coding assistant. Modify the code carefully while preserving its structure and functionality. Only output the modified code, no explanations.',
          timestamp: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        },
      ];

      const response = await this.aiService.chatCompletion({
        messages,
        maxTokens: this.settings.maxTokensPerTask,
      });

      if (!response.success || !response.message) {
        throw new Error(response.error || 'Failed to modify code');
      }

      const modifiedCode = this.extractCodeFromResponse(response.message.content);

      // Write the modified code if autoExecute is enabled
      if (this.settings.autoExecute && !this.settings.confirmFileWrites) {
        await fs.writeFile(filePath, modifiedCode, 'utf-8');
      }

      step.status = 'completed';
      step.result = { originalLength: originalCode.length, modifiedLength: modifiedCode.length };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        generatedCode: modifiedCode,
        modifiedFiles: this.settings.autoExecute ? [request.targetFile] : [],
        result: { code: modifiedCode, originalCode },
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle component creation
   */
  private async handleCreateComponent(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('create_component', `Creating component: ${request.description}`);
    steps.push(step);

    try {
      // Analyze project structure to understand conventions
      const projectInfo = await this.analyzeProjectStructure();

      const prompt = `Create a ${request.language || 'React'} component with the following specification:

${request.description}

Project context:
- Framework: ${projectInfo.framework || 'React'}
- TypeScript: ${projectInfo.typescript ? 'Yes' : 'No'}
- Component style: ${projectInfo.componentStyle || 'functional'}

Generate a complete, production-ready component following the project's conventions. Include all necessary imports, types, and exports.`;

      const messages: ChatMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'You are an expert React/frontend developer. Create clean, well-structured, reusable components following best practices.',
          timestamp: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        },
      ];

      const response = await this.aiService.chatCompletion({
        messages,
        maxTokens: this.settings.maxTokensPerTask,
      });

      if (!response.success || !response.message) {
        throw new Error(response.error || 'Failed to create component');
      }

      const componentCode = this.extractCodeFromResponse(response.message.content);

      step.status = 'completed';
      step.result = { codeLength: componentCode.length };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        generatedCode: componentCode,
        result: { code: componentCode },
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle refactoring
   */
  private async handleRefactor(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('refactor', `Refactoring: ${request.targetFile}`);
    steps.push(step);

    try {
      if (!request.targetFile) {
        throw new Error('No target file specified');
      }

      const filePath = path.resolve(this.workspaceRoot, request.targetFile);
      const originalCode = await fs.readFile(filePath, 'utf-8');

      const prompt = `Refactor the following ${request.language || ''} code to improve ${request.instruction || 'code quality, readability, and maintainability'}:

\`\`\`${request.language || ''}
${originalCode}
\`\`\`

Provide the refactored code with improvements. Maintain the same functionality.`;

      const messages: ChatMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'You are an expert software architect. Refactor code to improve quality while maintaining functionality. Follow best practices and design patterns.',
          timestamp: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        },
      ];

      const response = await this.aiService.chatCompletion({
        messages,
        maxTokens: this.settings.maxTokensPerTask,
      });

      if (!response.success || !response.message) {
        throw new Error(response.error || 'Failed to refactor code');
      }

      const refactoredCode = this.extractCodeFromResponse(response.message.content);

      step.status = 'completed';
      step.result = { originalLength: originalCode.length, refactoredLength: refactoredCode.length };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        generatedCode: refactoredCode,
        result: { code: refactoredCode, originalCode },
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle project analysis
   */
  private async handleAnalyzeProject(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('analyze_project', 'Analyzing project structure');
    steps.push(step);

    try {
      const analysis = await this.analyzeProjectStructure();

      step.status = 'completed';
      step.result = analysis;

      return {
        success: true,
        taskId: context.taskId,
        steps,
        result: analysis,
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Handle multi-step task
   */
  private async handleMultiStepTask(
    request: AgentTaskRequest,
    context: AgentContext,
    steps: AgentTaskStep[]
  ): Promise<AgentTaskResponse> {
    const step = this.createStep('multi_step_task', `Planning task: ${request.description}`);
    steps.push(step);

    try {
      // First, ask AI to break down the task into steps
      const planningPrompt = `Break down this coding task into specific, executable steps:

Task: ${request.description}

Project context:
- Working directory: ${this.workspaceRoot}
${request.files ? `- Relevant files: ${request.files.join(', ')}` : ''}

Provide a numbered list of steps that a coding assistant could execute.`;

      const messages: ChatMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'You are a software project manager. Break down tasks into clear, actionable steps.',
          timestamp: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: planningPrompt,
          timestamp: Date.now(),
        },
      ];

      const response = await this.aiService.chatCompletion({ messages });

      if (!response.success || !response.message) {
        throw new Error(response.error || 'Failed to plan task');
      }

      step.status = 'completed';
      step.result = { plan: response.message.content };

      return {
        success: true,
        taskId: context.taskId,
        steps,
        result: { plan: response.message.content },
      };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * File operations API
   */
  async fileOperation(request: FileOperationRequest): Promise<FileOperationResponse> {
    try {
      const filePath = path.resolve(this.workspaceRoot, request.path);

      // Security check
      if (!filePath.startsWith(this.workspaceRoot)) {
        throw new Error('Access denied: Path outside workspace');
      }

      switch (request.operation) {
        case 'read': {
          const content = await fs.readFile(filePath, 'utf-8');
          return { success: true, data: { content, path: request.path } };
        }

        case 'write': {
          if (!request.content) {
            throw new Error('No content provided for write operation');
          }
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, request.content, 'utf-8');
          return { success: true, data: { path: request.path } };
        }

        case 'list': {
          const entries = await fs.readdir(filePath, { withFileTypes: true });
          const files = entries
            .filter(e => !e.isDirectory())
            .map(e => e.name);
          const directories = entries
            .filter(e => e.isDirectory())
            .map(e => e.name);
          return { success: true, data: { files, directories, path: request.path } };
        }

        case 'delete': {
          await fs.unlink(filePath);
          return { success: true, data: { path: request.path } };
        }

        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Helper: Create a task step
   */
  private createStep(type: string, description: string): AgentTaskStep {
    return {
      id: crypto.randomUUID(),
      type: type as any,
      description,
      status: 'in_progress',
      timestamp: Date.now(),
    };
  }

  /**
   * Helper: Load context files
   */
  private async loadContextFiles(files: string[], context: AgentContext): Promise<void> {
    for (const file of files) {
      try {
        const filePath = path.resolve(this.workspaceRoot, file);
        if (filePath.startsWith(this.workspaceRoot)) {
          const content = await fs.readFile(filePath, 'utf-8');
          context.files.set(file, content);
        }
      } catch (error) {
        console.warn(`Failed to load context file ${file}:`, error);
      }
    }
  }

  /**
   * Helper: Build code generation prompt
   */
  private buildCodeGenerationPrompt(request: AgentTaskRequest, context: AgentContext): string {
    let prompt = `Generate ${request.language || ''} code for: ${request.description}\n\n`;

    if (request.instruction) {
      prompt += `Additional requirements: ${request.instruction}\n\n`;
    }

    if (context.files.size > 0) {
      prompt += 'Context from existing files:\n\n';
      for (const [file, content] of context.files) {
        prompt += `File: ${file}\n\`\`\`\n${content.slice(0, 1000)}\n\`\`\`\n\n`;
      }
    }

    return prompt;
  }

  /**
   * Helper: Extract code from AI response (remove markdown code blocks)
   */
  private extractCodeFromResponse(response: string): string {
    // Remove markdown code blocks
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...response.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      // Return the first code block
      return matches[0][1].trim();
    }

    // If no code blocks, return the whole response trimmed
    return response.trim();
  }

  /**
   * Helper: Analyze project structure
   */
  private async analyzeProjectStructure(): Promise<any> {
    try {
      // Check for package.json
      const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
      let packageJson: any = null;
      try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(content);
      } catch (error) {
        // No package.json
      }

      // Detect framework
      let framework = 'unknown';
      let typescript = false;
      let componentStyle = 'functional';

      if (packageJson) {
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps['react']) framework = 'React';
        else if (deps['vue']) framework = 'Vue';
        else if (deps['@angular/core']) framework = 'Angular';
        else if (deps['svelte']) framework = 'Svelte';
        else if (deps['next']) framework = 'Next.js';

        typescript = !!deps['typescript'];
      }

      // Check for src directory structure
      const srcPath = path.join(this.workspaceRoot, 'src');
      let hasSrcDir = false;
      try {
        await fs.access(srcPath);
        hasSrcDir = true;
      } catch (error) {
        // No src directory
      }

      return {
        framework,
        typescript,
        componentStyle,
        hasSrcDir,
        packageJson: !!packageJson,
      };
    } catch (error) {
      console.error('Error analyzing project:', error);
      return {
        framework: 'unknown',
        typescript: false,
        componentStyle: 'functional',
        hasSrcDir: false,
        packageJson: false,
      };
    }
  }
}
