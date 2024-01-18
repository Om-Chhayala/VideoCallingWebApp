import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import { Container, Input, Button, Heading } from "@chakra-ui/react";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <Container>
      <div>
        <Heading noOfLines={1}>Lobby</Heading>
        <form style={{ position:"absolute", top:"50%", left: "50%", transform: "translate(-50%, 100%)" }}>
          <div
            style={{
              display: "flex",
              width: "400px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label htmlFor="email">Email ID</label>
            <Input
              placeholder="Enter your email address"
              size="md"
              width="300px"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <br />
          <div
            style={{
              display: "flex",
              width: "400px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label htmlFor="room">Room Id</label>
            <Input
              placeholder="Enter the room Id"
              size="md"
              width="300px"
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <br />
          <Button onClick={handleSubmitForm} colorScheme="teal" size="md">
            Join
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default LobbyScreen;
