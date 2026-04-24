import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  getFolderStructure,
  createFile,
  createFolder,
  readFile,
  updateFile,
  deleteNode,
  renameNode,
  copyNode,
  getFileStats,
} from '../services/fileOperations.js';

const router = express.Router();

/**
 * File Operations Routes
 * All routes require authentication
 */

/**
 * Get folder structure (tree view)
 * GET /api/files/structure/:projectId
 */
router.get('/structure/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const structure = await getFolderStructure(projectId);
    res.json({ success: true, data: structure });
  } catch (error) {
    console.error('Get structure error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Create file
 * POST /api/files/create-file
 * Body: { projectId, filePath, content? }
 */
router.post('/create-file', verifyToken, async (req, res) => {
  try {
    const { projectId, filePath, content = '' } = req.body;

    if (!projectId || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, filePath',
      });
    }

    const result = await createFile(projectId, filePath, content);
    res.json(result);
  } catch (error) {
    console.error('Create file error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Create folder
 * POST /api/files/create-folder
 * Body: { projectId, folderPath }
 */
router.post('/create-folder', verifyToken, async (req, res) => {
  try {
    const { projectId, folderPath } = req.body;

    if (!projectId || !folderPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, folderPath',
      });
    }

    const result = await createFolder(projectId, folderPath);
    res.json(result);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Read file content
 * GET /api/files/read/:projectId
 * Query: filePath
 */
router.get('/read/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query: filePath',
      });
    }

    const result = await readFile(projectId, filePath);
    res.json(result);
  } catch (error) {
    console.error('Read file error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Update file content
 * PUT /api/files/update
 * Body: { projectId, filePath, content }
 */
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { projectId, filePath, content } = req.body;

    if (!projectId || !filePath || content === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, filePath, content',
      });
    }

    const result = await updateFile(projectId, filePath, content);
    res.json(result);
  } catch (error) {
    console.error('Update file error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Delete file or folder
 * DELETE /api/files/delete
 * Body: { projectId, nodePath }
 */
router.delete('/delete', verifyToken, async (req, res) => {
  try {
    const { projectId, nodePath } = req.body;

    if (!projectId || !nodePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, nodePath',
      });
    }

    const result = await deleteNode(projectId, nodePath);
    res.json(result);
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Rename file or folder
 * PATCH /api/files/rename
 * Body: { projectId, oldPath, newName }
 */
router.patch('/rename', verifyToken, async (req, res) => {
  try {
    const { projectId, oldPath, newName } = req.body;

    if (!projectId || !oldPath || !newName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, oldPath, newName',
      });
    }

    const result = await renameNode(projectId, oldPath, newName);
    res.json(result);
  } catch (error) {
    console.error('Rename node error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Copy file or folder
 * POST /api/files/copy
 * Body: { projectId, sourcePath, destinationPath }
 */
router.post('/copy', verifyToken, async (req, res) => {
  try {
    const { projectId, sourcePath, destinationPath } = req.body;

    if (!projectId || !sourcePath || !destinationPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, sourcePath, destinationPath',
      });
    }

    const result = await copyNode(projectId, sourcePath, destinationPath);
    res.json(result);
  } catch (error) {
    console.error('Copy node error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Get file statistics
 * GET /api/files/stats/:projectId
 * Query: filePath
 */
router.get('/stats/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query: filePath',
      });
    }

    const result = await getFileStats(projectId, filePath);
    res.json(result);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
