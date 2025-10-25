/**
 * Git Service
 * 
 * Provides Git version control operations for the IDE.
 * Handles repository management, file status tracking, and git operations.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * File status in git
 */
export enum GitFileStatus {
  UNTRACKED = 'untracked',
  MODIFIED = 'modified',
  ADDED = 'added',
  DELETED = 'deleted',
  RENAMED = 'renamed',
  COPIED = 'copied',
  UNMERGED = 'unmerged',
}

/**
 * Git file change
 */
export interface GitFileChange {
  path: string;
  status: GitFileStatus;
  staged: boolean;
}

/**
 * Git branch information
 */
export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

/**
 * Git commit information
 */
export interface GitCommit {
  hash: string;
  author: string;
  date: Date;
  message: string;
}

/**
 * Git Service
 * Manages git operations for a repository
 */
export class GitService extends EventEmitter {
  private repoPath: string;
  private isInitialized = false;

  constructor(repoPath: string) {
    super();
    this.repoPath = repoPath;
  }

  /**
   * Initialize git service and check if repository exists
   */
  async initialize(): Promise<boolean> {
    try {
      await this.execGit('rev-parse --git-dir');
      this.isInitialized = true;
      console.log(`[GitService] Initialized for repository: ${this.repoPath}`);
      return true;
    } catch (error) {
      console.log(`[GitService] Not a git repository: ${this.repoPath}`);
      return false;
    }
  }

  /**
   * Get the status of all files
   */
  async getStatus(): Promise<GitFileChange[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const { stdout } = await this.execGit('status --porcelain -u');
      
      const changes: GitFileChange[] = [];
      const lines = stdout.trim().split('\n').filter(line => line.length > 0);
      
      for (const line of lines) {
        const statusCode = line.substring(0, 2);
        const filePath = line.substring(3);
        
        const change = this.parseStatusLine(statusCode, filePath);
        if (change) {
          changes.push(change);
        }
      }
      
      return changes;
    } catch (error) {
      console.error('[GitService] Error getting status:', error);
      return [];
    }
  }

  /**
   * Parse git status line
   */
  private parseStatusLine(statusCode: string, filePath: string): GitFileChange | null {
    const staged = statusCode[0] !== ' ' && statusCode[0] !== '?';
    let status: GitFileStatus;
    
    const code = staged ? statusCode[0] : statusCode[1];
    
    switch (code) {
      case 'M':
        status = GitFileStatus.MODIFIED;
        break;
      case 'A':
        status = GitFileStatus.ADDED;
        break;
      case 'D':
        status = GitFileStatus.DELETED;
        break;
      case 'R':
        status = GitFileStatus.RENAMED;
        break;
      case 'C':
        status = GitFileStatus.COPIED;
        break;
      case 'U':
        status = GitFileStatus.UNMERGED;
        break;
      case '?':
        status = GitFileStatus.UNTRACKED;
        break;
      default:
        return null;
    }
    
    return {
      path: filePath,
      status,
      staged,
    };
  }

  /**
   * Get diff for a file
   */
  async getFileDiff(filePath: string, staged = false): Promise<string> {
    if (!this.isInitialized) {
      return '';
    }

    try {
      const stagedFlag = staged ? '--cached' : '';
      const { stdout } = await this.execGit(`diff ${stagedFlag} -- "${filePath}"`);
      return stdout;
    } catch (error) {
      console.error('[GitService] Error getting diff:', error);
      return '';
    }
  }

  /**
   * Stage a file
   */
  async stageFile(filePath: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.execGit(`add "${filePath}"`);
      this.emit('statusChanged');
      return true;
    } catch (error) {
      console.error('[GitService] Error staging file:', error);
      return false;
    }
  }

  /**
   * Unstage a file
   */
  async unstageFile(filePath: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.execGit(`reset HEAD "${filePath}"`);
      this.emit('statusChanged');
      return true;
    } catch (error) {
      console.error('[GitService] Error unstaging file:', error);
      return false;
    }
  }

  /**
   * Commit staged changes
   */
  async commit(message: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.execGit(`commit -m "${message.replace(/"/g, '\\"')}"`);
      this.emit('statusChanged');
      this.emit('committed', message);
      return true;
    } catch (error) {
      console.error('[GitService] Error committing:', error);
      return false;
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<GitBranch[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const { stdout } = await this.execGit('branch -a');
      
      const branches: GitBranch[] = [];
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const current = line.startsWith('*');
        const name = line.replace(/^\*?\s+/, '').trim();
        
        if (name) {
          branches.push({
            name,
            current,
            remote: name.startsWith('remotes/') ? name : undefined,
          });
        }
      }
      
      return branches;
    } catch (error) {
      console.error('[GitService] Error getting branches:', error);
      return [];
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const { stdout } = await this.execGit('rev-parse --abbrev-ref HEAD');
      return stdout.trim();
    } catch (error) {
      console.error('[GitService] Error getting current branch:', error);
      return null;
    }
  }

  /**
   * Checkout a branch
   */
  async checkoutBranch(branchName: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.execGit(`checkout "${branchName}"`);
      this.emit('branchChanged', branchName);
      return true;
    } catch (error) {
      console.error('[GitService] Error checking out branch:', error);
      return false;
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string, checkout = true): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const checkoutFlag = checkout ? '-b' : '';
      await this.execGit(`${checkout ? 'checkout' : 'branch'} ${checkoutFlag} "${branchName}"`);
      this.emit('branchCreated', branchName);
      return true;
    } catch (error) {
      console.error('[GitService] Error creating branch:', error);
      return false;
    }
  }

  /**
   * Get commit history
   */
  async getCommitHistory(limit = 50): Promise<GitCommit[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const { stdout } = await this.execGit(
        `log --pretty=format:"%H|%an|%ad|%s" --date=iso -n ${limit}`
      );
      
      const commits: GitCommit[] = [];
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const [hash, author, date, message] = line.split('|');
        if (hash) {
          commits.push({
            hash,
            author,
            date: new Date(date),
            message,
          });
        }
      }
      
      return commits;
    } catch (error) {
      console.error('[GitService] Error getting commit history:', error);
      return [];
    }
  }

  /**
   * Execute git command
   */
  private async execGit(command: string): Promise<{ stdout: string; stderr: string }> {
    return execAsync(`git -C "${this.repoPath}" ${command}`);
  }
}
