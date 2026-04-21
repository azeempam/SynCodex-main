import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { X, UserPlus, Copy } from "lucide-react";
import ToggleButton from "../toggleButton";
import axios from "axios";

export default function CreateRoomModal({ onClose }) {
  const [sessionName, setSessionName] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [interviewMode, setInterviewMode] = useState(false);

  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const roomIdRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const handleRoomCreation = async () => {
    if (!sessionName.trim()) {
      toast.error("Session name is required.");
      return;
    }

    const sessionData = {
      token: localStorage.getItem("token"),
      email: localStorage.getItem("email"),
      roomId: roomId,
      name: sessionName,
      description: sessionDescription,
      isInterviewMode: interviewMode,
    };

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/rooms/create-room",
        sessionData
      );

      console.log("Session Data :: ", res.data);
      if (res.status === 201) {
        toast.success("Room created successfully!");
         if (interviewMode) {
          sessionStorage.setItem("roomId", roomId);
          localStorage.setItem(
            "collabActions",
            JSON.stringify({
              ...JSON.parse(localStorage.getItem("collabActions") || "{}"),
              [roomId]: {
                action: "created",
                hostEmail: localStorage.getItem("email"),
              },
            })
          );
          window.open("/interview-guidelines", "_blank");
        } else {
          localStorage.setItem(
            "collabActions",
            JSON.stringify({
              ...JSON.parse(localStorage.getItem("collabActions") || "{}"),
              [roomId]: {
                action: "created",
                hostEmail: localStorage.getItem("email"),
              },
            })
          );
          window.open(`/collab-editor/${roomId}`, "_blank");
        }
      }
    } catch (error) {
      console.error("Room Creation Failed :", error);
      toast.error("Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const generateRoomId = useCallback(() => {
    let room = "";
    let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 1; i <= 8; i++) {
      let char = Math.floor(Math.random() * str.length);
      room += str.charAt(char);
    }
    setRoomId(room);
  }, []);

  const copyRoomToClipBoard = useCallback(() => {
    if (roomIdRef.current) {
      roomIdRef.current.select();
      navigator.clipboard.writeText(roomId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }, [roomId]);

  useEffect(() => {
    generateRoomId();
  }, [generateRoomId]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#00000093]">
      <div className="bg-[#3D415A] p-6 rounded-2xl shadow-4xl w-94 text-white">
        <div className="flex items-center gap-10 justify-end">
          <h2 className="text-2xl font-Chakra font-bold mb-4 ml-10">
            Create New Room
          </h2>
          <button className="p-2rounded mb-4 cursor-pointer" onClick={onClose}>
            <X size={25} />
          </button>
        </div>
        <label className="block font-open-sans mb-2">Enter Session Name</label>
        <input
          className="w-full p-2 mb-3 bg-[#21232f] text-white outline-none rounded-lg"
          type="text"
          placeholder="My New Session"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
        <label className="block font-open-sans mb-2">
          Description (optional)
        </label>
        <textarea
          type="text"
          value={sessionDescription}
          onChange={(e) => setSessionDescription(e.target.value)}
          className="w-full p-2 mb-2 bg-[#21232f] text-white  outline-none rounded-lg"
          placeholder="Description (optional)"
        ></textarea>
        <label className="block font-open-sans mb-2">Room ID</label>
        <div className="flex items-center justify-between">
          <input
            className="w-[85%] p-2 mb-3 bg-[#21232f] text-white  outline-none rounded-lg"
            type="text"
            value={roomId}
            ref={roomIdRef}
            readOnly
            placeholder="Random Room ID"
          />
          <div className="relative group flex items-center justify-center h-10 w-10 rounded-lg p-[1.6px] mb-3 bg-gradient-to-b  from-[#94FFF2] to-[#506DFF] cursor-pointer">
            <div
              onClick={copyRoomToClipBoard}
              className="flex items-center justify-center h-full w-full bg-[#21232f] rounded-[calc(8px-1.2px)]"
            >
              <Copy size={20} />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-sm px-2 py-1 rounded shadow z-10 whitespace-nowrap">
              Copy
            </div>
            {/* Copied message */}
            {copied && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 group-focus-within:block bg-black text-white text-sm px-2 py-1 rounded shadow z-10 whitespace-nowrap">
                Copied!
              </div>
            )}
          </div>
        </div>
        <label className="block font-open-sans mb-2">Invite People</label>
        <div className="flex items-center justify-between">
          <input
            className="w-[85%] p-2 mb-3 bg-[#21232f] text-white  outline-none rounded-lg"
            type="email"
            placeholder="Person's Email Address"
          />
          <div className="relative group flex items-center justify-center h-10 w-10 rounded-lg p-[1.6px] mb-3 bg-gradient-to-b  from-[#94FFF2] to-[#506DFF] cursor-pointer">
            <div className="flex items-center justify-center h-full w-full bg-[#21232f] rounded-[calc(8px-1.2px)]">
              <UserPlus size={20} />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-sm px-2 py-1 rounded shadow z-10 whitespace-nowrap">
              Add
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg">Interview Mode</span>
          <ToggleButton
            isToggled={interviewMode}
            setIsToggled={setInterviewMode}
          />
        </div>
        <button
          onClick={handleRoomCreation}
          className="p-2 bg-gradient-to-b from-[#94FFF2] to-[#506DFF] cursor-pointer hover:opacity-90 w-full flex rounded-lg items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 my-0.5 border-white border-t-transparent rounded-full animate-spin items-center justify-center"></div>
          ) : (
            "Create Room"
          )}
        </button>
      </div>
    </div>
  );
}
