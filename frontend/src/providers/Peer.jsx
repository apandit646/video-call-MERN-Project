import React, { useCallback, useEffect, useMemo, useState } from "react";

const PeerContext = React.createContext(null);
export const UsePeer = () => React.useContext(PeerContext);

export const PeerProvider = (props) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const peer = useMemo(() => {
    return new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302", // Default public STUN server
        },
      ],
    });
  }, []);

  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAnswer = async (answer) => {
    await peer.setRemoteDescription(answer);
  };

  const sendStream = async (stream) => {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      peer.addTrack(track, stream);
    }
  };
  const handleListener = useCallback((ev) => {
    const streams = ev.streams;
    setRemoteStream(streams[0]);
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handleListener);

    return () => {
      peer.removeEventListener("track", handleListener);
    };
  }, [handleListener, peer]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};

export default PeerContext;
