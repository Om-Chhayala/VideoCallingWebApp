import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import {
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Container,
  Spinner,
  Button,
  Card,
  CardBody,
  Center,
  Divider,
  Box,
} from "@chakra-ui/react";
const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <>
    <div style={{ display: "flex", flexDirection:"column", alignItems:"center"}}>
      <Container>
        <Heading margin="20px" noOfLines={1}>
          Room
        </Heading>
        {remoteSocketId ? (
          <Alert status="success">
            <AlertIcon />
            Connected Successfully ! <br/>
            Click Send Stream To send Stream to the Other End...
          </Alert>
        ) : (
          <>
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>No one Connected Yet! </AlertTitle>
              <AlertDescription>
                Ask Other Side to Join the Room
              </AlertDescription>
            </Alert>
            <Spinner margin="25px" color="red.500" />
          </>
        )}
        {myStream && (
          <Button
            marginX="5px"
            marginY="10px"
            colorScheme="teal"
            variant="solid"
            onClick={sendStreams}
          >
            Send Stream
          </Button>
        )}
        {remoteSocketId && (
          <Button
            marginX="5px"
            marginY="10px"
            colorScheme="teal"
            variant="solid"
            onClick={handleCallUser}
          >
            CALL
          </Button>
        )}
      </Container>

      <div
        style={{
          width: "70%",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
          {myStream && (
            <>
              <Heading size="md" margin="20px" noOfLines={1}>
                Your Video
              </Heading>
              <ReactPlayer
                playing
                height="300px"
                width="300px"
                url={myStream}
              />
            </>
          )}
        </Box>

        <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
          {remoteStream && (
            <>
              <Heading size="md" margin="20px" noOfLines={1}>
                Remote Video
              </Heading>
              <ReactPlayer
                playing
                height="300px"
                width="300px"
                url={remoteStream}
              />
            </>
          )}
        </Box>
      </div>
      </div>
    </>
  );
};

export default RoomPage;
