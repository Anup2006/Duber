"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket;

export function getSocket() {

  if (!socket) {

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL,{
      autoConnect: false,
    });

  }

  return socket;
} 