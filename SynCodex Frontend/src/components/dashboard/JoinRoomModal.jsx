import { X } from "lucide-react";
import { toast } from "react-toastify";
import {useState} from "react";
import axios from "axios";

export default function JoinRoomModal({ onClose }) {
  const [joinRoomId, setJoinRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitButton, setSubmitButton] = useState("Check Room");
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [roomAvail, setRoomAvail] = useState(false);
  const [hostEmail, setHostEmail] = useState(null);

  const checkRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error("Please Enter Room ID To Join.");
      return;
    }
    
    setSubmitButton("Checking room...");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/rooms/check-room",
        {roomId: joinRoomId }
      );

      if (res.status === 404) {
        setSubmitButton("Check Room");
        toast.error("Room Not Found.");
        return;
      }
      if (res.status === 200) {
        setSubmitButton("Join Room");
        setRoomAvail(true);
        setHostEmail(res.data.ownerEmail);
        setIsInterviewMode(res.data.isInterviewMode);
        console.log("Room found :: ", res.data);
      }
    } catch (error) {
      console.error("Room Checking Failed:", error);
      toast.error("Failed to check room. It may not exist.");
      setSubmitButton("Check Room");
    } 
  };

   const joinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error("Please Enter Room ID To Join.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/rooms/join-room",
        {
          roomId: joinRoomId.trim(),
          email: localStorage.getItem("email"),
          creatorEmail: hostEmail,
        }
      );

      if (res.status === 200) {
        toast.success("Room Joined Successfully!");
        setSubmitButton("Check Room");
        if (isInterviewMode) {
          localStorage.setItem(
            "collabActions",
            JSON.stringify({
              ...JSON.parse(localStorage.getItem("collabActions") || "{}"),
              [joinRoomId]: { action: "joined", hostEmail: hostEmail },
            })
          );

          window.open("/interview-guidelines", "_blank");
        } else {
          localStorage.setItem(
            "collabActions",
            JSON.stringify({
              ...JSON.parse(localStorage.getItem("collabActions") || "{}"),
              [joinRoomId]: { action: "joined", hostEmail: hostEmail },
            })
          );

          window.open(`/collab-editor/${joinRoomId}`, "_blank");
        }
      }
    } catch (error) {
      console.error("Room Join Failed:", error);
      toast.error("Failed to join room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#00000093] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#3D415A] p-6 rounded-2xl shadow-4xl w-94 text-white">
        <div className="flex items-center gap-20 justify-end">
          <h2 className="text-2xl font-Chakra font-bold mb-4 ml-10">Join Room</h2>
          <button className="p-2rounded mb-4 cursor-pointer" onClick={onClose}><X size={25} /></button>
        </div>
        <label className="block font-open-sans mb-2">Room ID</label>
        <input type="text" value={joinRoomId} onChange={(e)=> setJoinRoomId(e.target.value)} placeholder="Enter Room ID" className="w-full p-2 mb-3 rounded-lg bg-[#21232f] text-white outline-none" />
        <label className="block font-open-sans mb-2">Password</label>
        <input type="password" readOnly placeholder="Password" className="w-full p-2 mb-4 rounded-lg bg-[#21232f] text-white outline-none" />
        {isInterviewMode && (
          <>
            <p className="text-xs text-red-400 mb-2">
              * Note - This is an Interview Room. You can’t change tabs. If you
              minimize the screen or go back to files, the session will be ended
              automatically.
            </p>
            <p className="text-sm text-green-300 italic text-center mb-4">
              "Wishing you all the best for your interview!"
            </p>
          </>
        )}
        <button
          onClick={roomAvail ? joinRoom : checkRoom}
          className="p-2 bg-gradient-to-b from-[#94FFF2] to-[#506DFF] cursor-pointer hover:opacity-90 w-full flex rounded-lg items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 my-0.5 border-white border-t-transparent rounded-full animate-spin items-center justify-center"></div>
          ) : (
            submitButton
          )}
        </button>
      </div>
    </div>
  );
}