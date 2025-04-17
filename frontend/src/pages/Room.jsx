import React, { useCallback, useEffect, useState } from "react";
import { UseSocket } from "../providers/Socket";
import { UsePeer } from "../providers/Peer";

const RoomPage = () => {
  const [myStream, setMyStream] = useState(null);
  const [connectedUser, setConnectedUser] = useState(null);
  const [mediaError, setMediaError] = useState(null);

  const socket = UseSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
    remoteStream,
  } = UsePeer();

  // Handle new user joining
  const handleNewUserJoin = useCallback(
    async (data) => {
      const { emailId } = data;
      console.log(`User ${emailId} joined the room.`);
      const offer = await createOffer();
      socket.emit("call-user", { offer, emailId });
      setConnectedUser(emailId);
    },
    [createOffer, socket]
  );

  // Handle incoming call
  const handleIncomingCall = useCallback(
    async (data) => {
      const { offer, from } = data;
      console.log(`User ${from} is making a call.`);
      const answer = await createAnswer(offer);
      socket.emit("call-accepted", { answer, emailId: from });
      console.log("Answered the call");
      setConnectedUser(from);
    },
    [createAnswer, socket]
  );

  // Handle accepted call (receive remote answer)
  const handleAcceptedCall = useCallback(
    async (data) => {
      const { answer } = data;
      console.log(`Received answer from remote user`);
      await setRemoteAnswer(answer);
      console.log("Set remote description");
    },
    [setRemoteAnswer]
  );

  // Get local media stream with proper error handling
  const getUserMediaStream = useCallback(async () => {
    try {
      // First try to get both audio and video
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      sendStream(stream);
      setMyStream(stream);
      setMediaError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error accessing media devices.", error);

      // If device is in use, try with only audio
      if (error.name === "NotReadableError" || error.name === "AbortError") {
        try {
          console.log("Trying with audio only...");
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });

          sendStream(audioOnlyStream);
          setMyStream(audioOnlyStream);
          setMediaError({
            type: "video",
            message:
              "Could not access camera (device in use). Audio only mode enabled.",
          });
        } catch (audioError) {
          // If even audio fails, show a comprehensive error
          console.error("Failed to get even audio stream", audioError);
          setMediaError({
            type: "all",
            message:
              "Could not access camera or microphone. Please ensure no other applications are using these devices and try again.",
          });
        }
      } else if (error.name === "NotAllowedError") {
        setMediaError({
          type: "permission",
          message:
            "Camera/microphone access denied. Please allow access in your browser settings and refresh the page.",
        });
      } else {
        setMediaError({
          type: "unknown",
          message: `Media error: ${
            error.message || "Unknown error accessing your camera/microphone"
          }`,
        });
      }
    }
  }, [sendStream]);

  // Register socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", handleNewUserJoin);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleAcceptedCall);

    return () => {
      socket.off("user-joined", handleNewUserJoin);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleAcceptedCall);
    };
  }, [socket, handleNewUserJoin, handleIncomingCall, handleAcceptedCall]);

  // Run on mount to get user media
  useEffect(() => {
    getUserMediaStream();

    // Cleanup function to release media tracks when component unmounts
    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [getUserMediaStream]);

  // Handle negotiation (ICE candidates, etc.)
  const handleNegotiation = useCallback(async () => {
    if (connectedUser) {
      const offer = await createOffer();
      socket.emit("call-user", { emailId: connectedUser, offer });
    }
  }, [connectedUser, createOffer, socket]);

  useEffect(() => {
    if (!peer) return;

    peer.addEventListener("negotiationneeded", handleNegotiation);

    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [peer, handleNegotiation]);

  // Handle retry for media access
  const handleRetryMediaAccess = () => {
    setMediaError(null);
    getUserMediaStream();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-200 to-blue-200">
      <div className="text-center p-6 max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-purple-700">
          Welcome to the Room
        </h1>

        {/* Media Error Alert */}
        {mediaError && (
          <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded shadow">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p>{mediaError.message}</p>
            </div>
            <button
              onClick={handleRetryMediaAccess}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Access
            </button>
          </div>
        )}

        {connectedUser ? (
          <h4 className="mt-2 text-lg text-gray-700">
            You are connected to: {connectedUser}
          </h4>
        ) : (
          <p className="mt-4 text-lg text-gray-700">
            Waiting for other users to join...
          </p>
        )}

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          {myStream && (
            <div className="flex-1">
              <h3 className="mb-2 font-medium">You (Local)</h3>
              <video
                autoPlay
                muted
                playsInline
                ref={(video) => {
                  if (video && !video.srcObject) {
                    video.srcObject = myStream;
                  }
                }}
                className="rounded-lg w-full shadow-lg"
              />
              <div className="mt-2 text-sm text-gray-500">
                {myStream.getVideoTracks().length === 0
                  ? "Audio only"
                  : `Camera active: ${myStream.getVideoTracks()[0].label}`}
              </div>
            </div>
          )}

          {remoteStream && (
            <div className="flex-1">
              <h3 className="mb-2 font-medium">Remote User</h3>
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && !video.srcObject) {
                    video.srcObject = remoteStream;
                  }
                }}
                className="rounded-lg w-full shadow-lg"
              />
              <div className="mt-2 text-sm text-gray-500">
                {remoteStream.getVideoTracks().length === 0
                  ? "Audio only"
                  : "Video and audio connected"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
