import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

/**
 * Professional-grade file operations service
 * Handles file system operations with proper error handling and validation
 */

const BASE_PROJECT_DIR = process.env.PROJECT_FILES_DIR || '/tmp/syncodex-projects';

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw new Error(`Failed to create directory`);
  }
}

/**
 * Get safe path - prevent directory traversal attacks
 */
function getSafePath(basePath, relativePath) {
  const fullPath = path.join(basePath, relativePath);
  const realBase = path.resolve(basePath);
  const realFull = path.resolve(fullPath);

  if (!realFull.startsWith(realBase)) {
    throw new Error('Invalid path - directory traversal attempt detected');
  }

  return realFull;
}

/**
 * Get project root directory
 */
function getProjectDir(projectId) {
  return path.join(BASE_PROJECT_DIR, projectId);
}

/**
 * Create a new file
 */
async function createFile(projectId, filePath, content = '') {
  try {
    const projectDir = getProjectDir(projectId);
    const safePath = getSafePath(projectDir, filePath);

    // Ensure parent directory exists
    await ensureDir(path.dirname(safePath));

    // Check if file already exists
    try {
      await fs.stat(safePath);
      throw new Error('File already exists');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Create file with content
    await fs.writeFile(safePath, content, 'utf8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Create file error:', error);
    throw error;
  }
}

/**
 * Create a new folder
 */
async function createFolder(projectId, folderPath) {
  try {
    const projectDir = getProjectDir(projectId);
    const safePath = getSafePath(projectDir, folderPath);

    // Ensure directory exists
    await ensureDir(safePath);
    return { success: true, path: folderPath };
  } catch (error) {
    console.error('Create folder error:', error);
    throw error;
  }
}

/**
 * Read file content
 */
async function readFile(projectId, filePath) {
  try {
    const projectDir = getProjectDir(projectId);
    const safePath = getSafePath(projectDir, filePath);

    const content = await fs.readFile(safePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    console.error('Read file error:', error);
    if (error.code === 'ENOENT') {
      throw new Error('File not found');
    }
    throw error;
  }
}

/**
 * Update file content
 */
async function updateFile(projectId, filePath, content) {
  try {
    const projectDir = getProjectDir(projectId);
    const safePath = getSafePath(projectDir, filePath);

    // Verify file exists
    await fs.stat(safePath);

    // Write updated content
    await fs.writeFile(safePath, content, 'utf8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Update file error:', error);
    if (error.code === 'ENOENT') {
      throw new Error('File not found');
    }
    throw error;
  }
}

/**
 * Delete file or folder
 */
async function deleteNode(projectId, nodePath) {
  try {
    const projectDir = getProjectDir(projectId);
    const safePath = getSafePath(projectDir, nodePath);

    const stats = await fs.stat(safePath);

    if (stats.isDirectory()) {
      // Recursively remove directory
      await removeDirectory(safePath);
    } else {
      // Remove file
      await fs.unlink(safePath);
    }

    return { success: true, path: nodePath };
  } catch (error) {
    console.error('Delete node error:', error);
    if (error.code === 'ENOENT') {
      throw new Error('Path not found');
    }
    throw error;
  }
}

/**
 * Recursively remove directory
 */
async function removeDirectory(dirPath) {
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      await removeDirectory(filePath);
    } else {
      await fs.unlink(filePath);
    }
  }

  await fs.rmdir(dirPath);
}

/**
 * Rename file or folder
 */
async function renameNode(projectId, oldPath, newName) {
  try {
    const projectDir = getProjectDir(projectId);
    const safeOldPath = getSafePath(projectDir, oldPath);
    const dirName = path.dirname(oldPath);
    const newPath = path.join(dirName === '.' ? '' : dirName, newName).replace(/\\/g, '/');
    const safeNewPath = getSafePath(projectDir, newPath);

    // Verify source exists
    await fs.stat(safeOldPath);

    // Verify new name doesn't exist
    try {
      await fs.stat(safeNewPath);
      throw new Error('File or folder already exists with that name');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Rename
    await fs.rename(safeOldPath, safeNewPath);
    return { success: true, newPath };
  } catch (error) {
    console.error('Rename node error:', error);
    throw error;
  }
}

/**
 * Get folder structure (recursive tree)
 */
async function getFolderStructure(projectId, folderPath = '') {
  try {
    const projectDir = getProjectDir(projectId);
    const safePath = folderPath
      ? getSafePath(projectDir, folderPath)
      : projectDir;

    // Ensure project directory exists
    await ensureDir(projectDir);

    return await buildTree(safePath, '');
  } catch (error) {
    console.error('Get folder structure error:', error);
    throw error;
  }
}

/**
 * Recursively build folder tree
 */
async function buildTree(dirPath, relativePath) {
  const children = [];

  try {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      // Skip hidden files
      if (file.startsWith('.')) continue;

      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      const relPath = relativePath ? `${relativePath}/${file}` : file;

      if (stats.isDirectory()) {
        children.push({
          id: `folder-${relPath}`,
          type: 'folder',
          name: file,
          path: `/${relPath}`,
          children: await buildTree(filePath, relPath),
        });
      } else {
        children.push({
          id: `file-${relPath}`,
          type: 'file',
          name: file,
          path: `/${relPath}`,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${dirPath}:`, error);
  }

  return children;
}

/**
 * Copy file or folder
 */
async function copyNode(projectId, sourcePath, destinationPath) {
  try {
    const projectDir = getProjectDir(projectId);
    const safeSrc = getSafePath(projectDir, sourcePath);
    const safeDst = getSafePath(projectDir, destinationPath);

    const stats = await fs.stat(safeSrc);

    if (stats.isDirectory()) {
      await copyDirectory(safeSrc, safeDst);
    } else {
      await ensureDir(path.dirname(safeDst));
      await fs.copyFile(safeSrc, safeDst);
    }

    return { success: true, destinationPath };
  } catch (error) {
    console.error('Copy node error:', error);
    throw error;
  }
}

/**
 * Recursively copy directory
 */
async function copyDirectory(src, dst) {
  await ensureDir(dst);

  const files = await fs.readdir(src);

  for (const file of files) {
    const srcFile = path.join(src, file);
    const dstFile = path.join(dst, file);
    const stats = await fs.stat(srcFile);

    if (stats.isDirectory()) {
      await copyDirectory(srcFile, dstFile);
    } else {
      await fs.copyFile(srcFile, dstFile);
    }
  }
}

/**
 * Get file statistics
 */
async function getFileStats(projectId, filePath) {
  try {
    const projectDir = getProjectDir(projectId);
    const safePath = getSafePath(projectDir, filePath);

    const stats = await fs.stat(safePath);

    return {
      success: true,
      stats: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      },
    };
  } catch (error) {
    console.error('Get file stats error:', error);
    throw error;
  }
}

export {
  createFile,
  createFolder,
  readFile,
  updateFile,
  deleteNode,
  renameNode,
  getFolderStructure,
  copyNode,
  getFileStats,
  getProjectDir,
  ensureDir,
};
