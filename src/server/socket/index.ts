import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.NEXTAUTH_URL ?? "http://localhost:3000" },
  });

  io.on("connection", (socket) => {
    console.log("[Socket] client connected:", socket.id);

    // 점주가 특정 가게 룸에 참가
    socket.on("join-store", (storeId: string) => {
      socket.join(`store:${storeId}`);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] client disconnected:", socket.id);
    });
  });

  return io;
}

/** 새 주문 발생 시 점주에게 브로드캐스트 */
export function emitNewOrder(io: SocketIOServer, storeId: string, order: unknown) {
  io.to(`store:${storeId}`).emit("new-order", order);
}
