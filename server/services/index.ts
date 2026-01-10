/**
 * Server Services - Barrel Export
 *
 * Central export point for all server services
 */

export { aiService } from './ai-service';
export { debugAdapterManager, type DebugConfiguration } from './debug-service';
export { GitService } from './git-service';
export { getI18nService } from './i18n-service';
export { kateService } from './kate-service';
export { KateBridge } from './kate-bridge';
export { lspService } from './lsp-service';
export { getLSPConfigForLanguage, type LSPServerConfig } from './lsp-configs';
export { terminalService } from './terminal-service';
export { ExtensionHost } from './extension-host';
export { LargeFileManager } from './large-file-manager';
export { getSettingsManager } from './settings-manager';
export { javaService } from './java-service';
export type {
  JavaConfig,
  CompilationResult,
  ExecutionResult,
  TomcatStatus,
  ServletDeployment,
  JavaVersion
} from './java-service';
export { openscadService, OPENSCAD_PRIMITIVES, OPENSCAD_TEMPLATES } from './openscad-service';
export type {
  OpenSCADConfig,
  RenderOptions as OpenSCADRenderOptions,
  RenderResult as OpenSCADRenderResult,
  OpenSCADVersion,
  CameraSettings
} from './openscad-service';
