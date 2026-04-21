import VideoCallToolbar from "./subComponent/VideoCallToolbar";
import VideoScreen from "./subComponent/VideoScreen";
import { useSocket } from "../../context/SocketProvider";
import React, { useEffect, useRef, useState } from "react";

const VideoCallSection = ({ roomIdVCS, isInterviewMode }) => {
  const socket = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  const [micDisable, setMicDisable] = useState(true);
  const [camDisable, setCamDisable] = useState(true);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [remoteMicOff, setRemoteMicOff] = useState(false);
  // const [remoteCamOn, setRemoteCamOn] = useState(true);

  // const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const start = async () => {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      socket.emit("join-room", roomIdVCS);

      socket.on("all-users", async (users) => {
        if (users.length > 0) {
          createPeer(users[0], true);
        }
        // users.forEach((userId) => {
        //   createPeer(userId, true);  // true => I am the caller
        // });
      });

      socket.on("user-joined", (userId) => {
        console.log("New user joined:", userId);

        //  //
        // createPeer(userId,true); // true => isCaller
        // setIsRemoteConnected(true);
        // //
      });

      socket.on("offer", async ({ sdp, caller }) => {
        await createPeer(caller, false, sdp);
      });

      socket.on("answer", async ({ sdp }) => {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.error("Error adding received ice candidate", err);
        }
      });

      socket.on("media-toggled", (data) => {
        console.log("Remote media toggled received", data);
        setRemoteMicOff(!data.mic); // mic === true means it's ON
        // setRemoteCamOn(data.cam); // data.cam === true means camera is on
      });

      socket.on("user-left", () => {
        console.log("User disconnected");
        setIsRemoteConnected(false);
      });
    };

    start();

    return () => {
      socket.off("user-joined");
      peerConnection.current?.close();
    };
  }, [roomIdVCS, socket]);

  const createPeer = async (targetId, isCaller, remoteSdp = null) => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          target: targetId,
          candidate: e.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    if (isCaller) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("offer", { target: targetId, sdp: offer });
    } else if (remoteSdp) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(remoteSdp)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer", { target: targetId, sdp: answer });
    }
  };

  const toggleMic = () => {
    const enabled = !micDisable;
    localStream.current.getAudioTracks()[0].enabled = enabled;
    setMicDisable(enabled);
    socket.emit("media-toggled", {
      room: roomIdVCS,
      mic: enabled,
      cam: camDisable,
    });
  };

  const toggleCam = () => {
    const enabled = !camDisable;
    localStream.current.getVideoTracks()[0].enabled = enabled;
    setCamDisable(enabled);
    socket.emit("media-toggled", {
      room: roomIdVCS,
      mic: micDisable,
      cam: enabled,
    });
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      const newMuted = !remoteVideoRef.current.muted;
      remoteVideoRef.current.muted = newMuted;
      setSpeakerOff(newMuted);
    }
  };

  const toggleEndCall = () => {
    peerConnection.current?.close();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    window.location.href = "/dashboard";
  };

  return (
    <div className={`flex flex-col py-3 px-3 h-full `}>
      {/* Video Screen's */}
      <div className="flex flex-col gap-1 sm:gap-2 md:gap-3">
        {/*Guest Video*/}
        <VideoScreen
          isHost={false}
          isInterviewMode={isInterviewMode}
          videoRef={remoteVideoRef}
          micStaus={!remoteMicOff}
          displayName={"Guest"}
          />
          {/*Host Video*/}
        <VideoScreen
          isHost={true}
          isInterviewMode={isInterviewMode}
          videoRef={localVideoRef}
          micStaus={micDisable}
          displayName={"Host (You)"}
        />
      </div>

      {/* Video Call Toolbar */}
      <VideoCallToolbar
        micDisable={micDisable}
        camDisable={camDisable}
        speakerOff={speakerOff}
        toggleMic={toggleMic}
        toggleCam={toggleCam}
        toggleSpeaker={toggleSpeaker}
        toggleEndCall={toggleEndCall}
      />
    </div>
  );
};

export default VideoCallSection;