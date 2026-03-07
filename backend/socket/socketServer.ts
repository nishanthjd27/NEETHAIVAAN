import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

export interface AuthenticatedSocket extends Socket {
  userId?:   string;
  userRole?: string;
}
export interface StatusChangePayload {
  complaintId: string; ticketNumber: string;
  oldStatus:   string; newStatus:    string;
  updatedBy:   string; timestamp:    string;
}
export interface NotificationPayload {
  notificationId: string; recipientId:  string;
  type:           string; title:        string;
  message:        string; ticketNumber: string;
  complaintId:    string; createdAt:    string;
}

let io: SocketIOServer | null = null;
const userSocketMap = new Map<string, Set<string>>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.CLIENT_URL ?? "http://localhost:3000",
            methods: ["GET","POST"], credentials: true },
    pingTimeout: 60000, pingInterval: 25000,
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers?.authorization as string | undefined)
        ?.replace("Bearer ", "");

    if (!token) return next(new Error("Authentication token missing."));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "changeme")
        as { id: string; role: string };
      socket.userId   = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch { next(new Error("Invalid or expired token.")); }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
    userSocketMap.get(userId)!.add(socket.id);
    socket.join(`user:${userId}`);
    console.info(`[Socket] Connected | user=${userId} role=${socket.userRole}`);

    socket.on("subscribe:complaint",   (id: string) => socket.join(`complaint:${id}`));
    socket.on("unsubscribe:complaint", (id: string) => socket.leave(`complaint:${id}`));
    socket.on("disconnect", () => {
      userSocketMap.get(userId)?.delete(socket.id);
      if (userSocketMap.get(userId)?.size === 0) userSocketMap.delete(userId);
    });
  });

  console.info("[Socket] Initialised.");
  return io;
}

export function emitStatusChange(p: StatusChangePayload, recipientId?: string): void {
  if (!io) return;
  io.to(`complaint:${p.complaintId}`).emit("complaint:statusChanged", p);
  if (recipientId) io.to(`user:${recipientId}`).emit("complaint:statusChanged", p);
}
export function emitNotification(recipientId: string, n: NotificationPayload): void {
  if (!io) return;
  io.to(`user:${recipientId}`).emit("notification:new", n);
}
export function emitUnreadCount(recipientId: string, count: number): void {
  if (!io) return;
  io.to(`user:${recipientId}`).emit("notification:unreadCount", { count });
}
export function getIO(): SocketIOServer | null { return io; }