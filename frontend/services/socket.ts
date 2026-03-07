import { io, Socket } from "socket.io-client";

export interface StatusChangePayload {
  complaintId: string; ticketNumber: string;
  oldStatus: string;   newStatus: string;
  updatedBy: string;   timestamp: string;
}
export interface NotificationPayload {
  notificationId: string; recipientId: string;
  type: string;           title: string;
  message: string;        ticketNumber: string;
  complaintId: string;    createdAt: string;
}

let socket: Socket | null = null;

export function initSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:5000", {
    auth: { token }, transports: ["websocket","polling"],
    reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 2000,
  });

  socket.on("connect",       () => console.info("[Socket] Connected:", socket!.id));
  socket.on("connect_error", (e) => console.error("[Socket] Error:", e.message));
  socket.on("disconnect",    (r) => console.warn("[Socket] Disconnected:", r));

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null { return socket; }

export function subscribeToComplaint(id: string)   { socket?.emit("subscribe:complaint",   id); }
export function unsubscribeFromComplaint(id: string){ socket?.emit("unsubscribe:complaint", id); }

export function onStatusChange(cb: (p: StatusChangePayload) => void): () => void {
  socket?.on("complaint:statusChanged", cb);
  return () => socket?.off("complaint:statusChanged", cb);
}
export function onNewNotification(cb: (p: NotificationPayload) => void): () => void {
  socket?.on("notification:new", cb);
  return () => socket?.off("notification:new", cb);
}
export function onUnreadCountUpdate(cb: (p: { count: number }) => void): () => void {
  socket?.on("notification:unreadCount", cb);
  return () => socket?.off("notification:unreadCount", cb);
}