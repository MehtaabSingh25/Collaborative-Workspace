"use client";

import { useEffect } from "react";
import { socket } from "../src/lib/socket";

export default function Home() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>Hello</div>;
}
