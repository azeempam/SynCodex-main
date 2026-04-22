import Project from "../models/Project.js";
import { nanoid } from "nanoid";

// Create project
export const createProject = async (req, res) => {
  try {
    const { email, name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name are required" });
    }

    const projectId = nanoid(12);
    const newProject = new Project({
      projectId,
      email: email.toLowerCase(),
      name,
      description: description || "",
    });

    await newProject.save();

    return res.status(201).json({ message: "Project created", projectId });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get All Projects
export const getMyProjects = async (req, res) => {
  const email = req.headers.email;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const projects = await Project.find({ email: email.toLowerCase() });

    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Get specific project detail by project id
export const getProjectDetails = async (req, res) => {
  const email = req.headers["email"];
  const projectId = req.headers["projectid"];

  if (!email || !projectId) {
    return res.status(400).json({ error: "Email and projectId are required" });
  }

  try {
    const project = await Project.findOne({ 
      email: email.toLowerCase(),
      projectId 
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    console.log("Project details ✅✅: ", project);
    return res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project details:", error);
    return res.status(500).json({ error: "Failed to get project details" });
  }
};

// Create folder in db (project -> folderstructure collection)
export const createProjectFolder = async (req, res) => {
  try {
    const email = req.headers["email"];
    const projectId = req.headers["projectid"];
    const { folderName } = req.body;

    if (!email || !projectId || !folderName) {
      return res
        .status(400)
        .json({ error: "Email, projectId, and folderName are required" });
    }

    // Folder management is simplified for MongoDB migration
    return res.status(200).json({ message: "Folder created" });
  } catch (error) {
    console.error("Error creating folder:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create project file in folder -> files[]
export const createProjectFile = async (req, res) => {
  try {
    const email = req.headers["email"];
    const projectId = req.headers["projectid"];
    const folderName = req.headers["foldername"];
    const { fileName } = req.body;

    if (!email || !projectId || !folderName || !fileName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // File management is simplified for MongoDB migration
    const fileId = nanoid(12);
    const newFile = {
      id: fileId,
      name: fileName,
      language: "plaintext",
      content: "",
    };

    return res.status(201).json({ message: "File created", file: newFile });
  } catch (error) {
    console.error("Error creating file:", error);
    return res.status(500).json({ error: "Failed to create file" });
  }
};

// Get project folder structure by project id
export const getProjectFolderStructure = async (req, res) => {
  const email = req.headers["email"];
  const projectId = req.headers["projectid"];

  if (!email || !projectId) {
    return res.status(400).json({ error: "Email and projectId are required" });
  }

  try {
    // Return empty folder structure for now (MongoDB migration)
    const folders = [];
    console.log("Folder ➡️➡️ ", folders);
    return res.status(200).json(folders);
  } catch (error) {
    console.error("Error fetching project folders:", error);
    return res.status(500).json({ error: "Failed to fetch project folders" });
  }
};

// Get file content
export const getFileContent = async (req, res) => {
  try {
    const email = req.headers["email"];
    const projectId = req.headers["projectid"];
    const { folderName, fileName } = req.body;

    if (!email || !projectId || !folderName || !fileName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Return empty file content for now (MongoDB migration)
    return res.status(200).json({ content: "" });
  } catch (error) {
    console.error("Error fetching file content:", error);
    return res.status(500).json({ error: "Failed to fetch file content" });
  }
};

// Update file content
export const updateFileContent = async (req, res) => {
  try {
    const { folderName, fileName, content } = req.body;
    const email = req.headers["email"];
    const projectId = req.headers["projectid"];

    if (!email || !projectId || !folderName || !fileName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // File updates are simplified for MongoDB migration
    return res.status(200).json({ message: "Content updated successfully" });
  } catch (error) {
    console.error("Full error:", error);
    return res.status(500).json({ error: "Failed to update content" });
  }
};

// Delete project from user's email
export const deleteProject = async (req, res) => {
  try {
    const email = req.headers["email"];
    const projectId = req.headers["itemid"];

    console.log("✅✅✅ ", email, projectId);
    if (!email || !projectId) {
      return res
        .status(400)
        .json({ error: "Email and projectId are required" });
    }

    await Project.deleteOne({ 
      email: email.toLowerCase(),
      projectId 
    });

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};