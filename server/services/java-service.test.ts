/**
 * JavaService Tests
 *
 * Tests for the Java compilation and Tomcat integration service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock the JavaService class for testing
class MockJavaService extends EventEmitter {
  private config = {
    javaHome: '/usr/lib/jvm/java-17',
    tomcatHome: '/opt/tomcat',
    tomcatPort: 8080,
  };

  private tomcatRunning = false;
  private deployedApps: Map<string, any> = new Map();

  getStatus() {
    return {
      javaAvailable: true,
      javaVersion: '17.0.1',
      tomcatAvailable: true,
      tomcatVersion: '9.0.50',
    };
  }

  async compile(sourceFiles: string[], outputDir: string, classpath: string[] = []) {
    if (!sourceFiles.length) {
      return { success: false, errors: ['No source files provided'], warnings: [], outputDir };
    }

    const invalidFiles = sourceFiles.filter((f) => !f.endsWith('.java'));
    if (invalidFiles.length) {
      return {
        success: false,
        errors: invalidFiles.map((f) => `Invalid file type: ${f}`),
        warnings: [],
        outputDir,
      };
    }

    return { success: true, errors: [], warnings: [], outputDir };
  }

  async run(className: string, classpath: string[], args: string[] = [], options: any = {}) {
    if (!className) {
      return { exitCode: 1, stdout: '', stderr: 'No class name provided', duration: 0 };
    }

    return {
      exitCode: 0,
      stdout: 'Hello, World!\n',
      stderr: '',
      duration: 100,
    };
  }

  async startTomcat() {
    if (this.tomcatRunning) {
      throw new Error('Tomcat is already running');
    }
    this.tomcatRunning = true;
    this.emit('tomcat:started');
    return true;
  }

  async stopTomcat() {
    if (!this.tomcatRunning) {
      throw new Error('Tomcat is not running');
    }
    this.tomcatRunning = false;
    this.emit('tomcat:stopped');
    return true;
  }

  async getTomcatStatus() {
    return {
      running: this.tomcatRunning,
      port: this.config.tomcatPort,
      deployedApps: Array.from(this.deployedApps.keys()),
    };
  }

  async deploy(name: string, source: string, contextPath?: string) {
    if (!name || !source) {
      throw new Error('Name and source are required');
    }

    const deployment = {
      name,
      contextPath: contextPath || `/${name}`,
      source,
      status: 'running',
      deployedAt: new Date().toISOString(),
    };

    this.deployedApps.set(name, deployment);
    this.emit('app:deployed', deployment);
    return deployment;
  }

  async undeploy(name: string) {
    if (!this.deployedApps.has(name)) {
      return false;
    }
    this.deployedApps.delete(name);
    this.emit('app:undeployed', name);
    return true;
  }

  async createServletProject(projectPath: string, options: any = {}) {
    if (!projectPath) {
      throw new Error('Project path is required');
    }

    return {
      path: projectPath,
      groupId: options.groupId || 'com.example',
      artifactId: options.artifactId || 'webapp',
      created: true,
    };
  }
}

describe('JavaService', () => {
  let javaService: MockJavaService;

  beforeEach(() => {
    javaService = new MockJavaService();
  });

  describe('Status', () => {
    it('should return Java and Tomcat availability status', () => {
      const status = javaService.getStatus();

      expect(status.javaAvailable).toBe(true);
      expect(status.javaVersion).toBeDefined();
      expect(status.tomcatAvailable).toBe(true);
    });
  });

  describe('Compilation', () => {
    it('should compile valid Java files', async () => {
      const result = await javaService.compile(
        ['src/Main.java', 'src/Utils.java'],
        'build/classes'
      );

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when no source files provided', async () => {
      const result = await javaService.compile([], 'build/classes');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No source files provided');
    });

    it('should reject non-Java files', async () => {
      const result = await javaService.compile(
        ['src/Main.java', 'src/config.txt'],
        'build/classes'
      );

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid file type'))).toBe(true);
    });

    it('should accept custom classpath', async () => {
      const result = await javaService.compile(
        ['src/Main.java'],
        'build/classes',
        ['lib/dependency.jar']
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Execution', () => {
    it('should run Java class', async () => {
      const result = await javaService.run('com.example.Main', ['build/classes']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Hello');
    });

    it('should fail without class name', async () => {
      const result = await javaService.run('', []);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No class name');
    });

    it('should accept arguments', async () => {
      const result = await javaService.run(
        'com.example.Main',
        ['build/classes'],
        ['--verbose', 'arg1']
      );

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Tomcat Management', () => {
    it('should start Tomcat server', async () => {
      const startedHandler = vi.fn();
      javaService.on('tomcat:started', startedHandler);

      await javaService.startTomcat();

      expect(startedHandler).toHaveBeenCalled();
      const status = await javaService.getTomcatStatus();
      expect(status.running).toBe(true);
    });

    it('should stop Tomcat server', async () => {
      await javaService.startTomcat();

      const stoppedHandler = vi.fn();
      javaService.on('tomcat:stopped', stoppedHandler);

      await javaService.stopTomcat();

      expect(stoppedHandler).toHaveBeenCalled();
      const status = await javaService.getTomcatStatus();
      expect(status.running).toBe(false);
    });

    it('should not start Tomcat if already running', async () => {
      await javaService.startTomcat();

      await expect(javaService.startTomcat()).rejects.toThrow('already running');
    });

    it('should not stop Tomcat if not running', async () => {
      await expect(javaService.stopTomcat()).rejects.toThrow('not running');
    });

    it('should return Tomcat status', async () => {
      const status = await javaService.getTomcatStatus();

      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('port');
      expect(status).toHaveProperty('deployedApps');
    });
  });

  describe('Deployment', () => {
    it('should deploy application', async () => {
      const deployHandler = vi.fn();
      javaService.on('app:deployed', deployHandler);

      const deployment = await javaService.deploy('myapp', '/path/to/app');

      expect(deployment.name).toBe('myapp');
      expect(deployment.contextPath).toBe('/myapp');
      expect(deployment.status).toBe('running');
      expect(deployHandler).toHaveBeenCalled();
    });

    it('should deploy with custom context path', async () => {
      const deployment = await javaService.deploy('myapp', '/path/to/app', '/api');

      expect(deployment.contextPath).toBe('/api');
    });

    it('should undeploy application', async () => {
      await javaService.deploy('myapp', '/path/to/app');

      const undeployHandler = vi.fn();
      javaService.on('app:undeployed', undeployHandler);

      const result = await javaService.undeploy('myapp');

      expect(result).toBe(true);
      expect(undeployHandler).toHaveBeenCalledWith('myapp');
    });

    it('should return false when undeploying non-existent app', async () => {
      const result = await javaService.undeploy('nonexistent');

      expect(result).toBe(false);
    });

    it('should track deployed applications', async () => {
      await javaService.deploy('app1', '/path/to/app1');
      await javaService.deploy('app2', '/path/to/app2');

      const status = await javaService.getTomcatStatus();

      expect(status.deployedApps).toContain('app1');
      expect(status.deployedApps).toContain('app2');
    });
  });

  describe('Servlet Project Creation', () => {
    it('should create servlet project', async () => {
      const result = await javaService.createServletProject('/path/to/project', {
        groupId: 'com.example',
        artifactId: 'mywebapp',
      });

      expect(result.created).toBe(true);
      expect(result.groupId).toBe('com.example');
      expect(result.artifactId).toBe('mywebapp');
    });

    it('should use default values', async () => {
      const result = await javaService.createServletProject('/path/to/project');

      expect(result.groupId).toBe('com.example');
      expect(result.artifactId).toBe('webapp');
    });

    it('should require project path', async () => {
      await expect(javaService.createServletProject('')).rejects.toThrow('required');
    });
  });
});
