import Room from "../models/Room.js";

// For checking room is available or not by roomid
export const checkRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const { email: ownerEmail, isInterviewMode } = room;

    return res.status(200).json({
      message: "Room found",
      ownerEmail,
      isInterviewMode,
    });
  } catch (error) {
    console.error("Error checking room:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Join room
export const joinRoom = async (req, res) => {
  try {
    const { roomId, email, creatorEmail } = req.body;

    console.log("✅✅✅✅ ", email, roomId, creatorEmail);

    if (!roomId || !email || !creatorEmail) {
      return res.status(400).json({ error: "Room ID, creator email, and user email are required" });
    }

    // Verify room exists
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    return res.status(200).json({
      message: "Room joined successfully",
      roomId,
      creatorEmail,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};