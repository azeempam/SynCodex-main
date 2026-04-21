import { db } from "../config/firebase.js";

// For checking room is available or not by roomid
export const checkRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    const roomRef = db.collection("allRooms").doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      return res.status(404).json({ message: "Room not found" });
    }

    const { email: ownerEmail ,isInterviewMode } = roomSnap.data();

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

    console.log("✅✅✅✅ ",email,roomId,creatorEmail);

    if (!roomId || !email || !creatorEmail) {
      return res.status(400).json({ error: "Room ID, creator email, and user email are required" });
    }

    // Step 1: Get room data from creator's document
    const creatorRoomRef = db
      .collection("users")
      .doc(creatorEmail)
      .collection("rooms")
      .doc(roomId);

    const creatorRoomSnap = await creatorRoomRef.get();

    if (!creatorRoomSnap.exists) {
      return res.status(404).json({ error: "Room not found in creator's account" });
    }

    const roomData = creatorRoomSnap.data();

    // Step 2: Copy room data to joining user's document
    const joinerRef = db.collection("users").doc(email);
    const joinerSnap = await joinerRef.get();

    if (!joinerSnap.exists) {
      return res.status(404).json({ error: "Joining user not found" });
    }

    await joinerRef
      .collection("rooms")
      .doc(roomId)
      .set({ ...roomData, joinedAt: new Date().toISOString() });

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