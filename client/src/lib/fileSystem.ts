import type { FileNode } from "@/components/layout/FileTree";

const STORAGE_KEY = "kate-ide-file-system";

// Initialize with default files if localStorage is empty
const defaultFileSystem: FileNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      {
        id: "main.c",
        name: "main.c",
        type: "file",
        language: "c",
        content: `#include <stdio.h>

int main() {
    // Print a greeting message
    printf("Hello from Kate IDE!\\n");
    
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    
    printf("Sum of 1-10: %d\\n", sum);
    return 0;
}`,
      },
      {
        id: "utils.cpp",
        name: "utils.cpp",
        type: "file",
        language: "cpp",
        content: `#include <iostream>
#include <vector>

namespace utils {
    void log(const std::string& msg) {
        std::cout << msg << std::endl;
    }
    
    template<typename T>
    void printVector(const std::vector<T>& vec) {
        for (const auto& item : vec) {
            std::cout << item << " ";
        }
        std::cout << std::endl;
    }
}`,
      },
      {
        id: "database",
        name: "database",
        type: "folder",
        children: [
          {
            id: "schema.sql",
            name: "schema.sql",
            type: "file",
            language: "sql",
            content: `-- User Management Schema
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);`,
          },
        ],
      },
    ],
  },
  {
    id: "replicode",
    name: "replicode",
    type: "folder",
    children: [
      {
        id: "test.replicode",
        name: "test.replicode",
        type: "file",
        language: "plaintext",
        content: `!class entity {
    !attr name:string;
    !attr value:number;
    !attr active:boolean;
}

!def create_entity(n:string v:number) -> entity {
    !return !new entity(name:n value:v active:true);
}`,
      },
    ],
  },
  {
    id: "README.md",
    name: "README.md",
    type: "file",
    language: "markdown",
    content: `# Kate IDE Project

A modern web-based code editor inspired by Kate Desktop IDE.

## Features
- Multi-tab file editing
- Syntax highlighting for C, C++, SQL, and Replicode
- Find and replace functionality
- Integrated color picker
- Dark Matter theme

## Getting Started
Open files from the explorer on the left.`,
  },
];

export class FileSystemService {
  private files: FileNode[];
  private initialized: boolean = false;

  constructor() {
    this.files = [];
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.files = this.loadFromLocalStorage();
      this.initialized = true;
    }
  }

  private loadFromLocalStorage(): FileNode[] {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return JSON.parse(JSON.stringify(defaultFileSystem));
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load file system from localStorage:", error);
    }
    return JSON.parse(JSON.stringify(defaultFileSystem));
  }

  private saveToLocalStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.files));
    } catch (error) {
      console.error("Failed to save file system to localStorage:", error);
    }
  }

  getFiles(): FileNode[] {
    this.ensureInitialized();
    return JSON.parse(JSON.stringify(this.files));
  }

  findFileById(id: string, nodes?: FileNode[]): FileNode | null {
    this.ensureInitialized();
    const searchNodes = nodes || this.files;
    for (const node of searchNodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findFileById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }

  updateFileContent(fileId: string, content: string): boolean {
    this.ensureInitialized();
    const file = this.findFileById(fileId);
    if (file && file.type === "file") {
      file.content = content;
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  createFile(parentId: string | null, name: string, language: string = "plaintext"): FileNode | null {
    this.ensureInitialized();
    const extension = name.split(".").pop()?.toLowerCase() || "";
    const languageMap: Record<string, string> = {
      c: "c",
      cpp: "cpp",
      cc: "cpp",
      cxx: "cpp",
      h: "c",
      hpp: "cpp",
      sql: "sql",
      replicode: "plaintext",
      md: "markdown",
      txt: "plaintext",
      js: "javascript",
      ts: "typescript",
      tsx: "typescript",
      jsx: "javascript",
    };

    const newFile: FileNode = {
      id: `file-${Date.now()}`,
      name,
      type: "file",
      language: languageMap[extension] || language,
      content: "",
    };

    if (parentId === null) {
      // Add to root
      this.files.push(newFile);
    } else {
      const parent = this.findFileById(parentId);
      if (parent && parent.type === "folder") {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(newFile);
      } else {
        return null;
      }
    }

    this.saveToLocalStorage();
    return newFile;
  }

  createFolder(parentId: string | null, name: string): FileNode | null {
    this.ensureInitialized();
    const newFolder: FileNode = {
      id: `folder-${Date.now()}`,
      name,
      type: "folder",
      children: [],
    };

    if (parentId === null) {
      this.files.push(newFolder);
    } else {
      const parent = this.findFileById(parentId);
      if (parent && parent.type === "folder") {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(newFolder);
      } else {
        return null;
      }
    }

    this.saveToLocalStorage();
    return newFolder;
  }

  deleteFile(fileId: string): boolean {
    this.ensureInitialized();
    const deleteFromArray = (nodes: FileNode[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === fileId) {
          nodes.splice(i, 1);
          return true;
        }
        if (nodes[i].children) {
          if (deleteFromArray(nodes[i].children!)) {
            return true;
          }
        }
      }
      return false;
    };

    if (deleteFromArray(this.files)) {
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  renameFile(fileId: string, newName: string): boolean {
    this.ensureInitialized();
    const file = this.findFileById(fileId);
    if (file) {
      file.name = newName;
      
      // Update language based on new extension if it's a file
      if (file.type === "file") {
        const extension = newName.split(".").pop()?.toLowerCase() || "";
        const languageMap: Record<string, string> = {
          c: "c",
          cpp: "cpp",
          cc: "cpp",
          cxx: "cpp",
          h: "c",
          hpp: "cpp",
          sql: "sql",
          replicode: "plaintext",
          md: "markdown",
          txt: "plaintext",
          js: "javascript",
          ts: "typescript",
          tsx: "typescript",
          jsx: "javascript",
        };
        file.language = languageMap[extension] || file.language;
      }
      
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  resetToDefault(): void {
    this.ensureInitialized();
    this.files = JSON.parse(JSON.stringify(defaultFileSystem));
    this.saveToLocalStorage();
  }
}

export const fileSystem = new FileSystemService();
