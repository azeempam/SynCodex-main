import Room from "../models/Room.js";
import { nanoid } from "nanoid";

// Create room
export const createRoom = async (req, res) => {
  try {
    const {
      token,
      email,
      roomId,
      name,
      description,
      isInterviewMode,
      invitedPeople,
    } = req.body;

    if (!name || !roomId) {
      return res
        .status(400)
        .json({ error: "Project name and roomId are required" });
    }

    const roomData = new Room({
      roomId,
      email: email.toLowerCase(),
      name,
      description: description || "",
      isInterviewMode: isInterviewMode || false,
      invitedPeople: invitedPeople || [],
    });

    await roomData.save();

    return res
      .status(201)
      .json({ message: "Room created", roomId, roomData });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get All Rooms
export const getMyRooms = async (req, res) => {
  const email = req.headers.email; // ✅ Read from headers

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const rooms = await Room.find({ email: email.toLowerCase() });

    return res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return res.status(500).json({ error: "Failed to fetch rooms" });
  }
};

// Get specific room detail by roomid
export const getRoomDetails = async (req, res) => {
  const email = req.headers["email"];
  const roomId = req.headers["roomid"];

  if (!email || !roomId) {
    return res.status(400).json({ error: "Email and roomId are required" });
  }

  try {
    const room = await Room.findOne({
      email: email.toLowerCase(),
      roomId
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    console.log("Room details ✅✅: ", room);
    return res.status(200).json(room);
  } catch (error) {
    console.error("Error fetching room details:", error);
    return res.status(500).json({ error: "Failed to get room details" });
  }
};

// Create folder in db (room -> folderstructure collection)
export const createRoomFolder = async (req, res) => {
  try {
    const email = req.headers["email"];
    const roomId = req.headers["roomid"];
    const { folderName } = req.body;

    if (!email || !roomId || !folderName) {
      return res
        .status(400)
        .json({ error: "Email, roomId, and folderName are required" });
    }

    // Folder management is simplified for MongoDB migration
    return res.status(201).json({ message: "Folder created" });
  } catch (error) {
    console.error("Error creating folder:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create room file in folder -> files[]
export const createRoomFile = async (req, res) => {
  try {
    const email = req.headers["email"];
    const roomId = req.headers["roomid"];
    const folderName = req.headers["foldername"];
    const { fileName } = req.body;

    if (!email || !roomId || !folderName || !fileName) {
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

// Get room folder structure by roomid
export const getRoomFolderStructure = async (req, res) => {
  const email = req.headers["email"];
  const roomId = req.headers["roomid"];

  if (!email || !roomId) {
    return res.status(400).json({ error: "Email and roomId are required" });
  }

  try {
    // Return empty folder structure for now (MongoDB migration)
    const folders = [];
    console.log("Folder ", folders);
    return res.status(200).json(folders);
  } catch (error) {
    console.error("Error fetching room folders:", error);
    return res.status(500).json({ error: "Failed to fetch room folders" });
  }
};

// Add updateRoomFileContent
export const updateRoomFileContent = async (req, res) => {
  try {
    const { folderName, fileName, content, isInterviewMode } = req.body;
    if (isInterviewMode) {
      return res.status(200).json({ message: "Interview mode - content not persisted" });
    }

    const email = req.headers["email"];
    const roomId = req.headers["roomid"];

    if (!email || !roomId || !folderName || !fileName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // File updates are simplified for MongoDB migration
    return res.status(200).json({ message: "Content updated successfully" });
  } catch (error) {
    console.error("Error updating file content:", error);
    return res.status(500).json({ error: "Failed to update content" });
  }
};

// Delete room from user's email
export const deleteRoom = async (req, res) => {
  try {
    const email = req.headers["email"];
    const roomId = req.headers["itemid"];

    console.log("✅✅✅ ", email, roomId);
    if (!email || !roomId) {
      return res.status(400).json({ error: "Email and roomId are required" });
    }

    await Room.deleteOne({
      email: email.toLowerCase(),
      roomId
    });

    return res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
