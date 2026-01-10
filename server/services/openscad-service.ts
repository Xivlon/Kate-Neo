/**
 * OpenSCAD Service
 *
 * Provides OpenSCAD compilation, rendering, and preview capabilities
 * Supports parametric 3D modeling with syntax highlighting and live preview
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as crypto from 'crypto';

// Types
interface OpenSCADConfig {
  executablePath?: string;
  tempDir?: string;
  defaultOutputFormat?: 'stl' | 'off' | 'amf' | '3mf' | 'csg' | 'dxf' | 'svg' | 'png';
  previewSize?: { width: number; height: number };
  cameraSettings?: CameraSettings;
}

interface CameraSettings {
  translate?: [number, number, number];
  rotate?: [number, number, number];
  distance?: number;
}

interface RenderOptions {
  outputFormat?: 'stl' | 'off' | 'amf' | '3mf' | 'csg' | 'dxf' | 'svg' | 'png';
  outputPath?: string;
  parameters?: Record<string, number | string | boolean>;
  camera?: CameraSettings;
  imageSize?: { width: number; height: number };
  colorScheme?: string;
}

interface RenderResult {
  success: boolean;
  outputPath?: string;
  previewImage?: string; // Base64 encoded PNG
  errors: string[];
  warnings: string[];
  renderTime: number;
  geometryInfo?: {
    vertices?: number;
    facets?: number;
    volume?: number;
    surfaceArea?: number;
  };
}

interface OpenSCADVersion {
  version: string;
  year?: string;
  features: string[];
}

interface SyntaxError {
  line: number;
  column?: number;
  message: string;
  type: 'error' | 'warning' | 'deprecated';
}

// OpenSCAD primitives and functions for autocomplete
const OPENSCAD_PRIMITIVES = [
  // 3D Primitives
  'cube', 'sphere', 'cylinder', 'polyhedron',
  // 2D Primitives
  'square', 'circle', 'polygon', 'text',
  // Transformations
  'translate', 'rotate', 'scale', 'mirror', 'multmatrix', 'color', 'offset', 'hull', 'minkowski',
  // Boolean Operations
  'union', 'difference', 'intersection',
  // Modifiers
  'linear_extrude', 'rotate_extrude', 'surface', 'projection',
  // Control Flow
  'for', 'if', 'let', 'assert', 'echo', 'function', 'module',
  // Math Functions
  'abs', 'sign', 'sin', 'cos', 'tan', 'acos', 'asin', 'atan', 'atan2',
  'floor', 'round', 'ceil', 'ln', 'log', 'pow', 'sqrt', 'exp', 'max', 'min',
  // String Functions
  'str', 'chr', 'ord', 'len', 'concat', 'search',
  // Vector Functions
  'norm', 'cross', 'lookup',
  // Special Variables
  '$fn', '$fa', '$fs', '$t', '$vpr', '$vpt', '$vpd', '$vpf', '$children',
];

// Template library
const OPENSCAD_TEMPLATES: Record<string, string> = {
  basic: `// Basic OpenSCAD Template
// Customize parameters below

// Parameters
size = 10;
height = 20;
rounded = true;

// Main model
if (rounded) {
    minkowski() {
        cube([size, size, height - 2], center = true);
        sphere(r = 1, $fn = 20);
    }
} else {
    cube([size, size, height], center = true);
}
`,

  parametric: `// Parametric Box with Lid
// All dimensions are in mm

// === Parameters ===
box_width = 50;
box_depth = 40;
box_height = 30;
wall_thickness = 2;
lid_clearance = 0.3;
corner_radius = 3;

// === Modules ===
module rounded_box(w, d, h, r) {
    hull() {
        for (x = [r, w-r])
            for (y = [r, d-r])
                translate([x, y, 0])
                    cylinder(h = h, r = r, $fn = 32);
    }
}

module box_base() {
    difference() {
        rounded_box(box_width, box_depth, box_height, corner_radius);
        translate([wall_thickness, wall_thickness, wall_thickness])
            rounded_box(
                box_width - 2*wall_thickness,
                box_depth - 2*wall_thickness,
                box_height,
                corner_radius - wall_thickness/2
            );
    }
}

module box_lid() {
    lid_w = box_width + 2*wall_thickness + lid_clearance;
    lid_d = box_depth + 2*wall_thickness + lid_clearance;
    lid_h = box_height * 0.3;

    difference() {
        rounded_box(lid_w, lid_d, lid_h, corner_radius);
        translate([wall_thickness, wall_thickness, wall_thickness])
            rounded_box(
                lid_w - 2*wall_thickness,
                lid_d - 2*wall_thickness,
                lid_h,
                corner_radius - wall_thickness/2
            );
    }
}

// === Render ===
box_base();
translate([box_width + 10, 0, 0])
    box_lid();
`,

  gear: `// Parametric Gear
// Based on involute gear profile

// === Parameters ===
teeth = 20;
module = 2;  // Metric module (pitch diameter / teeth)
pressure_angle = 20;
thickness = 5;
bore_diameter = 6;
hub_diameter = 15;
hub_height = 8;

// === Calculated Values ===
pitch_diameter = teeth * module;
base_diameter = pitch_diameter * cos(pressure_angle);
outer_diameter = pitch_diameter + 2 * module;
root_diameter = pitch_diameter - 2.5 * module;

// === Modules ===
module gear_tooth() {
    linear_extrude(height = thickness) {
        polygon([
            [root_diameter/2, 0],
            [outer_diameter/2, 0],
            for (i = [0:5])
                let(a = i * 360 / teeth / 12)
                [outer_diameter/2 * cos(a), outer_diameter/2 * sin(a)],
            [root_diameter/2 * cos(360/teeth/2), root_diameter/2 * sin(360/teeth/2)]
        ]);
    }
}

module gear() {
    difference() {
        union() {
            // Gear body
            cylinder(d = root_diameter, h = thickness, $fn = teeth * 4);

            // Teeth
            for (i = [0:teeth-1])
                rotate([0, 0, i * 360 / teeth])
                    gear_tooth();

            // Hub
            cylinder(d = hub_diameter, h = hub_height, $fn = 32);
        }

        // Bore
        translate([0, 0, -1])
            cylinder(d = bore_diameter, h = hub_height + 2, $fn = 32);
    }
}

// === Render ===
gear();
`,

  enclosure: `// Electronics Enclosure
// Parametric enclosure for PCB mounting

// === Parameters ===
pcb_width = 100;
pcb_depth = 60;
pcb_height = 1.6;  // Standard PCB thickness
wall_thickness = 2;
bottom_clearance = 5;
top_clearance = 25;
standoff_diameter = 6;
standoff_hole = 3;  // M3 screws
mounting_holes = [[5, 5], [5, pcb_depth-5], [pcb_width-5, 5], [pcb_width-5, pcb_depth-5]];

// === Calculated ===
inner_width = pcb_width + 4;
inner_depth = pcb_depth + 4;
total_height = bottom_clearance + pcb_height + top_clearance;

// === Modules ===
module standoff(h) {
    difference() {
        cylinder(d = standoff_diameter, h = h, $fn = 6);
        translate([0, 0, -0.1])
            cylinder(d = standoff_hole, h = h + 0.2, $fn = 16);
    }
}

module enclosure_base() {
    difference() {
        // Outer shell
        cube([inner_width + 2*wall_thickness, inner_depth + 2*wall_thickness, total_height/2 + wall_thickness]);

        // Inner cavity
        translate([wall_thickness, wall_thickness, wall_thickness])
            cube([inner_width, inner_depth, total_height]);
    }

    // PCB standoffs
    for (pos = mounting_holes)
        translate([wall_thickness + 2 + pos[0], wall_thickness + 2 + pos[1], wall_thickness])
            standoff(bottom_clearance);
}

module enclosure_lid() {
    lid_height = total_height/2 + wall_thickness;
    lip_height = 3;
    lip_clearance = 0.3;

    difference() {
        union() {
            // Main lid
            cube([inner_width + 2*wall_thickness, inner_depth + 2*wall_thickness, wall_thickness]);

            // Inner lip
            translate([wall_thickness + lip_clearance, wall_thickness + lip_clearance, wall_thickness])
                difference() {
                    cube([inner_width - 2*lip_clearance, inner_depth - 2*lip_clearance, lip_height]);
                    translate([wall_thickness, wall_thickness, -0.1])
                        cube([inner_width - 2*wall_thickness - 2*lip_clearance, inner_depth - 2*wall_thickness - 2*lip_clearance, lip_height + 0.2]);
                }
        }

        // Ventilation holes
        for (x = [10:10:inner_width-10])
            for (y = [10:10:inner_depth-10])
                translate([wall_thickness + x, wall_thickness + y, -0.1])
                    cylinder(d = 3, h = wall_thickness + 0.2, $fn = 16);
    }
}

// === Render ===
enclosure_base();
translate([0, inner_depth + 20, 0])
    enclosure_lid();
`,
};

class OpenSCADService extends EventEmitter {
  private config: OpenSCADConfig;
  private version: OpenSCADVersion | null = null;
  private renderQueue: Map<string, ChildProcess> = new Map();

  constructor(config: OpenSCADConfig = {}) {
    super();
    this.config = {
      executablePath: config.executablePath || this.findOpenSCAD(),
      tempDir: config.tempDir || path.join(os.tmpdir(), 'kate-neo-openscad'),
      defaultOutputFormat: config.defaultOutputFormat || 'stl',
      previewSize: config.previewSize || { width: 800, height: 600 },
      cameraSettings: config.cameraSettings || {
        translate: [0, 0, 0],
        rotate: [55, 0, 25],
        distance: 140,
      },
    };
  }

  /**
   * Find OpenSCAD executable
   */
  private findOpenSCAD(): string {
    const platform = os.platform();

    const possiblePaths: string[] = [];

    if (platform === 'win32') {
      possiblePaths.push(
        'C:\\Program Files\\OpenSCAD\\openscad.exe',
        'C:\\Program Files (x86)\\OpenSCAD\\openscad.exe',
      );
    } else if (platform === 'darwin') {
      possiblePaths.push(
        '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD',
        '/usr/local/bin/openscad',
      );
    } else {
      possiblePaths.push(
        '/usr/bin/openscad',
        '/usr/local/bin/openscad',
        '/snap/bin/openscad',
      );
    }

    // Try to find in PATH
    try {
      const which = platform === 'win32' ? 'where' : 'which';
      const result = require('child_process').execSync(`${which} openscad`, { encoding: 'utf8' });
      if (result.trim()) {
        return result.trim().split('\n')[0];
      }
    } catch {
      // Not in PATH
    }

    // Return first possible path (may not exist)
    return possiblePaths[0] || 'openscad';
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<boolean> {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.config.tempDir!, { recursive: true });

      // Detect version
      this.version = await this.detectVersion();
      this.emit('initialized', this.version);
      return true;
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      return false;
    }
  }

  /**
   * Detect OpenSCAD version
   */
  private async detectVersion(): Promise<OpenSCADVersion> {
    return new Promise((resolve, reject) => {
      exec(`"${this.config.executablePath}" --version`, (error, stdout, stderr) => {
        const output = stdout || stderr;

        if (error && !output) {
          reject(new Error('OpenSCAD not found. Please install OpenSCAD.'));
          return;
        }

        // Parse version (format: "OpenSCAD version 2021.01")
        const versionMatch = output.match(/OpenSCAD version (\d+\.\d+)/);
        const yearMatch = output.match(/(\d{4})/);

        resolve({
          version: versionMatch?.[1] || 'unknown',
          year: yearMatch?.[1],
          features: this.detectFeatures(output),
        });
      });
    });
  }

  /**
   * Detect available features based on version
   */
  private detectFeatures(versionOutput: string): string[] {
    const features: string[] = ['csg', 'stl', 'off', 'dxf', 'svg', 'png'];

    // Newer versions support more formats
    if (versionOutput.includes('2021') || versionOutput.includes('2022') || versionOutput.includes('2023')) {
      features.push('3mf', 'amf');
    }

    return features;
  }

  /**
   * Render an OpenSCAD file
   */
  async render(
    sourceCode: string,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const startTime = Date.now();
    const renderId = crypto.randomUUID();

    const {
      outputFormat = this.config.defaultOutputFormat,
      parameters = {},
      camera = this.config.cameraSettings,
      imageSize = this.config.previewSize,
      colorScheme = 'Tomorrow Night',
    } = options;

    // Create temp files
    const inputFile = path.join(this.config.tempDir!, `${renderId}.scad`);
    const outputFile = options.outputPath ||
      path.join(this.config.tempDir!, `${renderId}.${outputFormat}`);
    const previewFile = path.join(this.config.tempDir!, `${renderId}_preview.png`);

    try {
      // Write source to temp file
      await fs.writeFile(inputFile, sourceCode);

      // Build command arguments
      const args: string[] = [
        '-o', outputFile,
      ];

      // Add parameters
      for (const [key, value] of Object.entries(parameters)) {
        if (typeof value === 'string') {
          args.push('-D', `${key}="${value}"`);
        } else {
          args.push('-D', `${key}=${value}`);
        }
      }

      // Add camera settings for PNG output
      if (outputFormat === 'png' || true) { // Always generate preview
        const camArgs = [
          camera?.translate?.join(',') || '0,0,0',
          camera?.rotate?.join(',') || '55,0,25',
          camera?.distance?.toString() || '140',
        ].join(',');

        args.push('--camera', camArgs);
        args.push('--imgsize', `${imageSize?.width},${imageSize?.height}`);
        args.push('--colorscheme', colorScheme);
      }

      args.push(inputFile);

      // Execute OpenSCAD
      const result = await this.executeOpenSCAD(args, renderId);

      // Generate preview image
      let previewImage: string | undefined;
      if (outputFormat !== 'png') {
        const previewArgs = [
          '-o', previewFile,
          '--camera', [
            camera?.translate?.join(',') || '0,0,0',
            camera?.rotate?.join(',') || '55,0,25',
            camera?.distance?.toString() || '140',
          ].join(','),
          '--imgsize', `${imageSize?.width},${imageSize?.height}`,
          '--colorscheme', colorScheme,
          inputFile,
        ];

        await this.executeOpenSCAD(previewArgs, `${renderId}-preview`);

        try {
          const imageData = await fs.readFile(previewFile);
          previewImage = `data:image/png;base64,${imageData.toString('base64')}`;
        } catch {
          // Preview generation failed
        }
      } else {
        // Output is already PNG
        try {
          const imageData = await fs.readFile(outputFile);
          previewImage = `data:image/png;base64,${imageData.toString('base64')}`;
        } catch {
          // Failed to read output
        }
      }

      // Parse geometry info from output
      const geometryInfo = this.parseGeometryInfo(result.output);

      const renderResult: RenderResult = {
        success: result.exitCode === 0,
        outputPath: outputFile,
        previewImage,
        errors: result.errors,
        warnings: result.warnings,
        renderTime: Date.now() - startTime,
        geometryInfo,
      };

      this.emit('rendered', renderResult);
      return renderResult;
    } catch (error) {
      const errorResult: RenderResult = {
        success: false,
        errors: [(error as Error).message],
        warnings: [],
        renderTime: Date.now() - startTime,
      };

      this.emit('error', { type: 'render', error });
      return errorResult;
    } finally {
      // Cleanup temp input file
      try {
        await fs.unlink(inputFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Execute OpenSCAD command
   */
  private async executeOpenSCAD(
    args: string[],
    renderId: string
  ): Promise<{ exitCode: number; output: string; errors: string[]; warnings: string[] }> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      const process = spawn(this.config.executablePath!, args);
      this.renderQueue.set(renderId, process);

      process.stdout.on('data', (data) => {
        stdout += data.toString();
        this.emit('output', { renderId, type: 'stdout', data: data.toString() });
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        this.emit('output', { renderId, type: 'stderr', data: data.toString() });
      });

      process.on('close', (code) => {
        this.renderQueue.delete(renderId);

        const output = stdout + stderr;
        const { errors, warnings } = this.parseOutput(output);

        resolve({
          exitCode: code || 0,
          output,
          errors,
          warnings,
        });
      });
    });
  }

  /**
   * Parse OpenSCAD output for errors and warnings
   */
  private parseOutput(output: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('ERROR:') || line.includes('TRACE:')) {
        errors.push(line.trim());
      } else if (line.includes('WARNING:') || line.includes('DEPRECATED:')) {
        warnings.push(line.trim());
      }
    }

    return { errors, warnings };
  }

  /**
   * Parse geometry information from render output
   */
  private parseGeometryInfo(output: string): RenderResult['geometryInfo'] {
    const info: RenderResult['geometryInfo'] = {};

    // Try to extract geometry stats
    const verticesMatch = output.match(/(\d+)\s*vertices/i);
    const facetsMatch = output.match(/(\d+)\s*(?:facets|triangles)/i);
    const volumeMatch = output.match(/volume\s*[:=]\s*([\d.]+)/i);
    const areaMatch = output.match(/surface\s*area\s*[:=]\s*([\d.]+)/i);

    if (verticesMatch) info.vertices = parseInt(verticesMatch[1]);
    if (facetsMatch) info.facets = parseInt(facetsMatch[1]);
    if (volumeMatch) info.volume = parseFloat(volumeMatch[1]);
    if (areaMatch) info.surfaceArea = parseFloat(areaMatch[1]);

    return Object.keys(info).length > 0 ? info : undefined;
  }

  /**
   * Validate OpenSCAD syntax
   */
  async validateSyntax(sourceCode: string): Promise<SyntaxError[]> {
    const errors: SyntaxError[] = [];
    const renderId = crypto.randomUUID();
    const inputFile = path.join(this.config.tempDir!, `${renderId}_validate.scad`);
    const outputFile = path.join(this.config.tempDir!, `${renderId}_validate.echo`);

    try {
      await fs.writeFile(inputFile, sourceCode);

      const result = await this.executeOpenSCAD(
        ['-o', outputFile, inputFile],
        renderId
      );

      // Parse errors with line numbers
      const errorRegex = /(?:ERROR|WARNING|DEPRECATED):\s*(?:.*?):(\d+)(?::(\d+))?:\s*(.+)/g;
      let match;

      while ((match = errorRegex.exec(result.output)) !== null) {
        errors.push({
          line: parseInt(match[1]),
          column: match[2] ? parseInt(match[2]) : undefined,
          message: match[3].trim(),
          type: match[0].startsWith('ERROR') ? 'error' :
                match[0].startsWith('WARNING') ? 'warning' : 'deprecated',
        });
      }
    } finally {
      try {
        await fs.unlink(inputFile);
        await fs.unlink(outputFile);
      } catch {
        // Ignore cleanup errors
      }
    }

    return errors;
  }

  /**
   * Cancel a render in progress
   */
  cancelRender(renderId: string): boolean {
    const process = this.renderQueue.get(renderId);
    if (process) {
      process.kill();
      this.renderQueue.delete(renderId);
      this.emit('cancelled', renderId);
      return true;
    }
    return false;
  }

  /**
   * Get available templates
   */
  getTemplates(): Record<string, string> {
    return OPENSCAD_TEMPLATES;
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(prefix: string): string[] {
    const lowerPrefix = prefix.toLowerCase();
    return OPENSCAD_PRIMITIVES.filter(p => p.toLowerCase().startsWith(lowerPrefix));
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    version: OpenSCADVersion | null;
    executablePath: string;
    activeRenders: number;
  } {
    return {
      initialized: this.version !== null,
      version: this.version,
      executablePath: this.config.executablePath || 'not found',
      activeRenders: this.renderQueue.size,
    };
  }
}

// Singleton instance
export const openscadService = new OpenSCADService();

// Export types and constants
export {
  OpenSCADService,
  OPENSCAD_PRIMITIVES,
  OPENSCAD_TEMPLATES,
};
export type {
  OpenSCADConfig,
  RenderOptions,
  RenderResult,
  OpenSCADVersion,
  SyntaxError as OpenSCADSyntaxError,
  CameraSettings,
};
