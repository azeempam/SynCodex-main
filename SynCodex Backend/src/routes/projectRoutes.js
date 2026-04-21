import express from 'express';
import {
  createProjectFolder,
  createProject,
  createProjectFile,
  getMyProjects,
  getProjectDetails,
  getProjectFolderStructure,
  getFileContent,
  updateFileContent,
  deleteProject
} from '../controllers/createProjectController.js';
const router = express.Router();

// Get all projects
router.get('/my-projects', getMyProjects);
// This matches '/api/projects/create-project'
router.post('/create-project', createProject);


// Get Specific Project Details
router.get('/project-details', getProjectDetails);
// create project folder
router.post('/create-project-folder', createProjectFolder);
// create project file
router.post('/create-project-file', createProjectFile);
// Get project folder structure
router.get('/project-folder-structure', getProjectFolderStructure);

// New file content endpoints
router.post('/get-file-content', getFileContent);
router.put('/update-file-content', updateFileContent);

// Delete project
router.delete("/delete-project", deleteProject);

export default router;
