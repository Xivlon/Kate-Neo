/**
 * LSP Server Configurations
 * 
 * Defines how to start and communicate with various language servers.
 * Users need to install language servers separately.
 */

export interface LSPServerConfig {
  /** Command to start the language server */
  command: string;
  
  /** Command-line arguments */
  args: string[];
  
  /** Supported language IDs */
  languages: string[];
  
  /** Optional environment variables */
  env?: Record<string, string>;
  
  /** Optional working directory */
  cwd?: string;
  
  /** Server initialization options */
  initializationOptions?: any;
}

/**
 * Pre-configured language servers
 * 
 * To use these, install the corresponding language server:
 * - TypeScript: npm install -g typescript-language-server
 * - Python: pip install python-lsp-server
 * - Rust: rustup component add rust-analyzer
 * - Go: go install golang.org/x/tools/gopls@latest
 * - Java: Download from https://download.eclipse.org/jdtls/
 */
export const LSP_CONFIGS: Record<string, LSPServerConfig> = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    initializationOptions: {
      preferences: {
        quotePreference: 'single',
        importModuleSpecifierPreference: 'relative'
      }
    }
  },

  python: {
    command: 'pylsp',
    args: [],
    languages: ['python'],
    initializationOptions: {
      pylsp: {
        plugins: {
          pycodestyle: { enabled: true },
          pylint: { enabled: true },
          jedi_completion: { enabled: true },
          jedi_hover: { enabled: true },
          jedi_definition: { enabled: true },
          jedi_references: { enabled: true }
        }
      }
    }
  },

  rust: {
    command: 'rust-analyzer',
    args: [],
    languages: ['rust'],
    initializationOptions: {
      checkOnSave: {
        command: 'clippy'
      },
      cargo: {
        allFeatures: true
      }
    }
  },

  go: {
    command: 'gopls',
    args: ['serve'],
    languages: ['go'],
    initializationOptions: {
      usePlaceholders: true,
      completionDocumentation: true,
      deepCompletion: true
    }
  },

  java: {
    command: 'jdtls',
    args: [],
    languages: ['java'],
    env: {
      JAVA_HOME: process.env.JAVA_HOME || ''
    }
  },

  cpp: {
    command: 'clangd',
    args: ['--background-index', '--clang-tidy'],
    languages: ['c', 'cpp', 'objective-c', 'objective-cpp'],
    initializationOptions: {
      clangdFileStatus: true,
      fallbackFlags: ['-std=c++17']
    }
  },

  csharp: {
    command: 'omnisharp',
    args: ['--languageserver'],
    languages: ['csharp']
  },

  ruby: {
    command: 'solargraph',
    args: ['stdio'],
    languages: ['ruby'],
    initializationOptions: {
      diagnostics: true,
      formatting: true
    }
  },

  php: {
    command: 'intelephense',
    args: ['--stdio'],
    languages: ['php']
  },

  html: {
    command: 'vscode-html-language-server',
    args: ['--stdio'],
    languages: ['html']
  },

  css: {
    command: 'vscode-css-language-server',
    args: ['--stdio'],
    languages: ['css', 'scss', 'less']
  },

  json: {
    command: 'vscode-json-language-server',
    args: ['--stdio'],
    languages: ['json', 'jsonc']
  },

  yaml: {
    command: 'yaml-language-server',
    args: ['--stdio'],
    languages: ['yaml']
  },

  bash: {
    command: 'bash-language-server',
    args: ['start'],
    languages: ['shellscript', 'bash', 'sh']
  },

  dockerfile: {
    command: 'docker-langserver',
    args: ['--stdio'],
    languages: ['dockerfile']
  },

  vue: {
    command: 'vls',
    args: [],
    languages: ['vue']
  },

  lua: {
    command: 'lua-language-server',
    args: [],
    languages: ['lua']
  },

  elm: {
    command: 'elm-language-server',
    args: ['--stdio'],
    languages: ['elm']
  },

  kotlin: {
    command: 'kotlin-language-server',
    args: [],
    languages: ['kotlin']
  },

  scala: {
    command: 'metals',
    args: [],
    languages: ['scala']
  },

  swift: {
    command: 'sourcekit-lsp',
    args: [],
    languages: ['swift']
  },

  dart: {
    command: 'dart',
    args: ['language-server', '--protocol=lsp'],
    languages: ['dart']
  },

  sql: {
    command: 'sql-language-server',
    args: ['up', '--method', 'stdio'],
    languages: ['sql']
  }
};

/**
 * Get LSP configuration for a language ID
 */
export function getLSPConfigForLanguage(languageId: string): LSPServerConfig | null {
  for (const [_key, config] of Object.entries(LSP_CONFIGS)) {
    if (config.languages.includes(languageId)) {
      return config;
    }
  }
  return null;
}

/**
 * Get all supported language IDs
 */
export function getSupportedLanguages(): string[] {
  const languages = new Set<string>();
  for (const config of Object.values(LSP_CONFIGS)) {
    for (const lang of config.languages) {
      languages.add(lang);
    }
  }
  return Array.from(languages).sort();
}

/**
 * Check if a language server is available (command exists)
 */
export async function isLanguageServerAvailable(config: LSPServerConfig): Promise<boolean> {
  try {
    const { spawn } = await import('child_process');
    return new Promise((resolve) => {
      const process = spawn(config.command, ['--version'], {
        stdio: 'ignore',
        shell: true
      });
      
      process.on('error', () => resolve(false));
      process.on('exit', (code) => resolve(code === 0));
      
      // Timeout after 2 seconds
      setTimeout(() => {
        process.kill();
        resolve(false);
      }, 2000);
    });
  } catch {
    return false;
  }
}
