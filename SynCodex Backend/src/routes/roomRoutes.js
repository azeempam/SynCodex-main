import express from "express";
import {
  createRoom,
  getMyRooms,
  getRoomDetails,
  createRoomFolder,
  createRoomFile,
  getRoomFolderStructure,
  updateRoomFileContent,
  deleteRoom
} from "../controllers/createRoomController.js";
import { checkRoom, joinRoom } from "../controllers/joinRoomController.js";

const router = express.Router();

// Get all rooms (collab + interview)
router.get("/my-rooms", getMyRooms);
// ✅ create new room (c+i)
router.post("/create-room", createRoom);

// Get Specific Room Details
router.get("/room-details", getRoomDetails);

// create room folder
router.post("/create-room-folder", createRoomFolder);

// create room file
router.post("/create-room-file", createRoomFile);

// Get room folder structure
router.get("/room-folder-structure", getRoomFolderStructure);

//update room file content
router.put("/update-file-content", updateRoomFileContent);

// Join Room (joiner email -> roomId & owner email = data copy (room copy in joiner "rooms"))
router.post("/join-room", joinRoom);

// Check room 
router.post("/check-room", checkRoom);

// Delete room 
router.delete("/delete-room", deleteRoom);

export default router;
