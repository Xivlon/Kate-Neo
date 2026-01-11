/**
 * Java Runtime Service
 *
 * Provides Java compilation, execution, and Apache Tomcat servlet container integration
 * for running Java web applications within Kate Neo IDE
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

// Types
interface JavaConfig {
  javaHome?: string;
  tomcatHome?: string;
  tomcatPort?: number;
  debugPort?: number;
  maxMemory?: string;
  compilerOptions?: string[];
}

interface CompilationResult {
  success: boolean;
  output: string;
  errors: string[];
  warnings: string[];
  classFiles: string[];
}

interface ExecutionResult {
  success: boolean;
  output: string;
  exitCode: number;
  duration: number;
}

interface TomcatStatus {
  running: boolean;
  pid?: number;
  port?: number;
  webapps: string[];
  version?: string;
}

interface ServletDeployment {
  name: string;
  contextPath: string;
  warFile?: string;
  status: 'deploying' | 'deployed' | 'failed' | 'stopped';
  url?: string;
}

interface JavaVersion {
  version: string;
  vendor: string;
  vmName: string;
  javaHome: string;
}

// Java Service Class
class JavaService extends EventEmitter {
  private config: JavaConfig;
  private javaVersion: JavaVersion | null = null;
  private tomcatProcess: ChildProcess | null = null;
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private deployments: Map<string, ServletDeployment> = new Map();

  constructor(config: JavaConfig = {}) {
    super();
    this.config = {
      javaHome: config.javaHome || process.env.JAVA_HOME,
      tomcatHome: config.tomcatHome || process.env.CATALINA_HOME,
      tomcatPort: config.tomcatPort || 8080,
      debugPort: config.debugPort || 5005,
      maxMemory: config.maxMemory || '512m',
      compilerOptions: config.compilerOptions || ['-Xlint:all'],
    };
  }

  /**
   * Initialize the Java service and detect Java installation
   */
  async initialize(): Promise<boolean> {
    try {
      this.javaVersion = await this.detectJavaVersion();
      this.emit('initialized', this.javaVersion);
      return true;
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      return false;
    }
  }

  /**
   * Detect Java version and configuration
   */
  private async detectJavaVersion(): Promise<JavaVersion> {
    return new Promise((resolve, reject) => {
      const javaPath = this.getJavaExecutable();

      exec(`"${javaPath}" -version 2>&1`, (error, stdout, stderr) => {
        const output = stderr || stdout;

        if (error && !output) {
          reject(new Error('Java not found. Please install JDK and set JAVA_HOME'));
          return;
        }

        // Parse Java version output
        const versionMatch = output.match(/version "([^"]+)"/);
        const vendorMatch = output.match(/(OpenJDK|Java\(TM\)|GraalVM|Amazon Corretto)/i);
        const vmMatch = output.match(/(64-Bit Server VM|Client VM|HotSpot)/i);

        resolve({
          version: versionMatch?.[1] || 'unknown',
          vendor: vendorMatch?.[1] || 'unknown',
          vmName: vmMatch?.[1] || 'unknown',
          javaHome: this.config.javaHome || process.env.JAVA_HOME || '',
        });
      });
    });
  }

  /**
   * Get Java executable path
   */
  private getJavaExecutable(name: string = 'java'): string {
    if (this.config.javaHome) {
      const ext = os.platform() === 'win32' ? '.exe' : '';
      return path.join(this.config.javaHome, 'bin', name + ext);
    }
    return name;
  }

  /**
   * Compile Java source files
   */
  async compile(
    sourceFiles: string[],
    outputDir: string,
    classpath: string[] = []
  ): Promise<CompilationResult> {
    const javacPath = this.getJavaExecutable('javac');

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const args: string[] = [
      '-d', outputDir,
      ...this.config.compilerOptions || [],
    ];

    if (classpath.length > 0) {
      args.push('-cp', classpath.join(path.delimiter));
    }

    args.push(...sourceFiles);

    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      const process = spawn(javacPath, args);

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', async (code) => {
        const output = stdout + stderr;
        const errors: string[] = [];
        const warnings: string[] = [];

        // Parse compiler output
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.includes('error:')) {
            errors.push(line.trim());
          } else if (line.includes('warning:')) {
            warnings.push(line.trim());
          }
        }

        // Find generated class files
        let classFiles: string[] = [];
        try {
          classFiles = await this.findClassFiles(outputDir);
        } catch {
          // Ignore errors finding class files
        }

        const result: CompilationResult = {
          success: code === 0,
          output,
          errors,
          warnings,
          classFiles,
        };

        this.emit('compiled', { ...result, duration: Date.now() - startTime });
        resolve(result);
      });
    });
  }

  /**
   * Find all .class files in a directory
   */
  private async findClassFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.name.endsWith('.class')) {
          files.push(fullPath);
        }
      }
    }

    await walk(dir);
    return files;
  }

  /**
   * Run a Java class
   */
  async run(
    className: string,
    classpath: string[],
    args: string[] = [],
    options: { debug?: boolean; timeout?: number } = {}
  ): Promise<ExecutionResult> {
    const javaPath = this.getJavaExecutable();

    const javaArgs: string[] = [
      `-Xmx${this.config.maxMemory}`,
    ];

    if (options.debug) {
      javaArgs.push(
        `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:${this.config.debugPort}`
      );
    }

    javaArgs.push('-cp', classpath.join(path.delimiter));
    javaArgs.push(className);
    javaArgs.push(...args);

    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      const process = spawn(javaPath, javaArgs);
      const processId = `run-${Date.now()}`;
      this.runningProcesses.set(processId, process);

      // Set timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          process.kill();
        }, options.timeout);
      }

      process.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        this.emit('output', { processId, type: 'stdout', data: text });
      });

      process.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        this.emit('output', { processId, type: 'stderr', data: text });
      });

      process.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        this.runningProcesses.delete(processId);

        const result: ExecutionResult = {
          success: code === 0,
          output: stdout + stderr,
          exitCode: code || 0,
          duration: Date.now() - startTime,
        };

        this.emit('finished', { processId, ...result });
        resolve(result);
      });
    });
  }

  /**
   * Start Apache Tomcat server
   */
  async startTomcat(): Promise<boolean> {
    if (!this.config.tomcatHome) {
      throw new Error('CATALINA_HOME not set. Please configure Tomcat path.');
    }

    if (this.tomcatProcess) {
      throw new Error('Tomcat is already running');
    }

    const startupScript = os.platform() === 'win32'
      ? path.join(this.config.tomcatHome, 'bin', 'startup.bat')
      : path.join(this.config.tomcatHome, 'bin', 'startup.sh');

    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        JAVA_HOME: this.config.javaHome,
        CATALINA_HOME: this.config.tomcatHome,
        CATALINA_OPTS: `-Xmx${this.config.maxMemory}`,
      };

      this.tomcatProcess = spawn(startupScript, [], {
        env,
        shell: true,
        detached: true,
      });

      this.tomcatProcess.stdout?.on('data', (data) => {
        this.emit('tomcat:output', data.toString());
      });

      this.tomcatProcess.stderr?.on('data', (data) => {
        this.emit('tomcat:error', data.toString());
      });

      // Wait a bit for Tomcat to start
      setTimeout(async () => {
        const status = await this.getTomcatStatus();
        if (status.running) {
          this.emit('tomcat:started', status);
          resolve(true);
        } else {
          reject(new Error('Tomcat failed to start'));
        }
      }, 5000);
    });
  }

  /**
   * Stop Apache Tomcat server
   */
  async stopTomcat(): Promise<boolean> {
    if (!this.config.tomcatHome) {
      throw new Error('CATALINA_HOME not set');
    }

    const shutdownScript = os.platform() === 'win32'
      ? path.join(this.config.tomcatHome, 'bin', 'shutdown.bat')
      : path.join(this.config.tomcatHome, 'bin', 'shutdown.sh');

    return new Promise((resolve) => {
      const shutdownEnv = {
        ...process.env,
        JAVA_HOME: this.config.javaHome,
        CATALINA_HOME: this.config.tomcatHome,
      };

      const shutdownProcess = spawn(shutdownScript, [], {
        env: shutdownEnv,
        shell: true,
      });

      shutdownProcess.on('close', () => {
        this.tomcatProcess = null;
        this.emit('tomcat:stopped');
        resolve(true);
      });
    });
  }

  /**
   * Get Tomcat server status
   */
  async getTomcatStatus(): Promise<TomcatStatus> {
    const port = this.config.tomcatPort || 8080;

    // Check if Tomcat is responding
    let running = false;
    try {
      const response = await fetch(`http://localhost:${port}/`);
      running = response.ok || response.status === 404;
    } catch {
      running = false;
    }

    // Get deployed webapps
    let webapps: string[] = [];
    if (this.config.tomcatHome) {
      const webappsDir = path.join(this.config.tomcatHome, 'webapps');
      try {
        const entries = await fs.readdir(webappsDir, { withFileTypes: true });
        webapps = entries
          .filter(e => e.isDirectory())
          .map(e => e.name);
      } catch {
        // Ignore errors reading webapps
      }
    }

    return {
      running,
      port,
      webapps,
      version: await this.getTomcatVersion(),
    };
  }

  /**
   * Get Tomcat version
   */
  private async getTomcatVersion(): Promise<string | undefined> {
    if (!this.config.tomcatHome) return undefined;

    const versionScript = os.platform() === 'win32'
      ? path.join(this.config.tomcatHome, 'bin', 'version.bat')
      : path.join(this.config.tomcatHome, 'bin', 'version.sh');

    return new Promise((resolve) => {
      exec(`"${versionScript}"`, (error, stdout) => {
        if (error) {
          resolve(undefined);
          return;
        }

        const match = stdout.match(/Server version:\s*(.+)/);
        resolve(match?.[1]?.trim());
      });
    });
  }

  /**
   * Deploy a WAR file or directory to Tomcat
   */
  async deploy(
    name: string,
    source: string,
    contextPath?: string
  ): Promise<ServletDeployment> {
    if (!this.config.tomcatHome) {
      throw new Error('CATALINA_HOME not set');
    }

    const deployment: ServletDeployment = {
      name,
      contextPath: contextPath || `/${name}`,
      status: 'deploying',
    };

    this.deployments.set(name, deployment);
    this.emit('deployment:started', deployment);

    try {
      const webappsDir = path.join(this.config.tomcatHome, 'webapps');
      const targetPath = path.join(webappsDir, name);

      const sourceStats = await fs.stat(source);

      if (sourceStats.isFile() && source.endsWith('.war')) {
        // Copy WAR file
        deployment.warFile = source;
        await fs.copyFile(source, path.join(webappsDir, `${name}.war`));
      } else if (sourceStats.isDirectory()) {
        // Copy directory
        await this.copyDirectory(source, targetPath);
      } else {
        throw new Error('Source must be a WAR file or directory');
      }

      deployment.status = 'deployed';
      deployment.url = `http://localhost:${this.config.tomcatPort}${deployment.contextPath}`;

      this.emit('deployment:completed', deployment);
      return deployment;
    } catch (error) {
      deployment.status = 'failed';
      this.emit('deployment:failed', { deployment, error });
      throw error;
    }
  }

  /**
   * Undeploy a webapp from Tomcat
   */
  async undeploy(name: string): Promise<boolean> {
    if (!this.config.tomcatHome) {
      throw new Error('CATALINA_HOME not set');
    }

    const webappsDir = path.join(this.config.tomcatHome, 'webapps');
    const targetPath = path.join(webappsDir, name);
    const warPath = path.join(webappsDir, `${name}.war`);

    try {
      // Remove directory
      await fs.rm(targetPath, { recursive: true, force: true });
      // Remove WAR file
      await fs.rm(warPath, { force: true });

      this.deployments.delete(name);
      this.emit('deployment:removed', name);
      return true;
    } catch (error) {
      this.emit('error', { type: 'undeploy', error });
      return false;
    }
  }

  /**
   * Create a new servlet project structure
   */
  async createServletProject(
    projectPath: string,
    options: {
      name: string;
      packageName?: string;
      servletName?: string;
    }
  ): Promise<void> {
    const {
      name,
      packageName = 'com.example',
      servletName = 'HelloServlet'
    } = options;

    // Create directory structure
    const srcDir = path.join(projectPath, 'src', 'main', 'java', ...packageName.split('.'));
    const webInfDir = path.join(projectPath, 'src', 'main', 'webapp', 'WEB-INF');
    const classesDir = path.join(projectPath, 'target', 'classes');

    await fs.mkdir(srcDir, { recursive: true });
    await fs.mkdir(webInfDir, { recursive: true });
    await fs.mkdir(classesDir, { recursive: true });

    // Create servlet class
    const servletContent = `package ${packageName};

import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/${servletName.toLowerCase()}")
public class ${servletName} extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html");
        PrintWriter out = response.getWriter();
        out.println("<html>");
        out.println("<head><title>${name}</title></head>");
        out.println("<body>");
        out.println("<h1>Hello from ${servletName}!</h1>");
        out.println("<p>Servlet is running successfully.</p>");
        out.println("</body>");
        out.println("</html>");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}
`;

    await fs.writeFile(path.join(srcDir, `${servletName}.java`), servletContent);

    // Create web.xml
    const webXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
         http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">
    <display-name>${name}</display-name>
    <welcome-file-list>
        <welcome-file>index.html</welcome-file>
    </welcome-file-list>
</web-app>
`;

    await fs.writeFile(path.join(webInfDir, 'web.xml'), webXmlContent);

    // Create index.html
    const indexContent = `<!DOCTYPE html>
<html>
<head>
    <title>${name}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    <h1>Welcome to ${name}</h1>
    <p>Your servlet application is ready!</p>
    <p><a href="${servletName.toLowerCase()}">Go to ${servletName}</a></p>
</body>
</html>
`;

    await fs.writeFile(path.join(projectPath, 'src', 'main', 'webapp', 'index.html'), indexContent);

    this.emit('project:created', { projectPath, name });
  }

  /**
   * Copy a directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Kill all running Java processes
   */
  async killAll(): Promise<void> {
    for (const [id, proc] of Array.from(this.runningProcesses.entries())) {
      proc.kill();
      this.runningProcesses.delete(id);
    }

    if (this.tomcatProcess) {
      await this.stopTomcat();
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    javaVersion: JavaVersion | null;
    runningProcesses: number;
    deployments: ServletDeployment[];
  } {
    return {
      initialized: this.javaVersion !== null,
      javaVersion: this.javaVersion,
      runningProcesses: this.runningProcesses.size,
      deployments: Array.from(this.deployments.values()),
    };
  }
}

// Singleton instance
export const javaService = new JavaService();

// Export types
export type {
  JavaConfig,
  CompilationResult,
  ExecutionResult,
  TomcatStatus,
  ServletDeployment,
  JavaVersion
};
