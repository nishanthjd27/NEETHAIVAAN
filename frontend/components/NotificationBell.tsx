import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { onNewNotification, onUnreadCountUpdate, NotificationPayload } from "../services/socket";

interface Notification {
  _id: string; type: string; title: string; message: string;
  ticketNumber: string; complaintId: string; isRead: boolean; createdAt: string;
}

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const typeColor: Record<string, string> = {
  status_change:"#3b82f6", escalation:"#ef4444", resolution:"#22c55e",
  rejection:"#f97316", assignment:"#8b5cf6", general:"#6b7280",
};

const NotificationBell: React.FC<{ token: string }> = ({ token }) => {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const headers = { Authorization: `Bearer ${token}` };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/notifications?limit=15`, { headers });
      if (data.success) { setNotifications(data.data.notifications); setUnreadCount(data.data.unreadCount); }
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetch();
    const offNew = onNewNotification((p: NotificationPayload) => {
      setNotifications(prev => [
        { _id: p.notificationId, type: p.type, title: p.title, message: p.message,
          ticketNumber: p.ticketNumber, complaintId: p.complaintId, isRead: false, createdAt: p.createdAt },
        ...prev.slice(0, 14),
      ]);
      setUnreadCount(n => n + 1);
    });
    const offCount = onUnreadCountUpdate(({ count }) => setUnreadCount(count));
    return () => { offNew(); offCount(); };
  }, [fetch]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markAll = async () => {
    await axios.put(`${API}/api/notifications/mark-read`, {}, { headers });
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOne = async (id: string) => {
    await axios.put(`${API}/api/notifications/mark-read`, { notificationIds: [id] }, { headers });
    setNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return (
    <div style={{ position:"relative", display:"inline-block" }} ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background:"none", border:"none", cursor:"pointer", position:"relative",
                 padding:"8px", borderRadius:"50%", display:"flex" }} aria-label="Notifications">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{ position:"absolute", top:"2px", right:"2px", background:"#ef4444",
            color:"#fff", fontSize:"10px", fontWeight:700, borderRadius:"50%",
            minWidth:"18px", height:"18px", display:"flex", alignItems:"center",
            justifyContent:"center", padding:"0 3px" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:"360px",
          background:"#fff", borderRadius:"12px", boxShadow:"0 10px 40px rgba(0,0,0,0.15)",
          zIndex:1000, overflow:"hidden", border:"1px solid #e5e7eb" }}>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 16px", borderBottom:"1px solid #f3f4f6" }}>
            <span style={{ fontWeight:700, fontSize:"15px", color:"#111827" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft:"8px", background:"#eff6ff", color:"#3b82f6",
                  borderRadius:"12px", padding:"1px 8px", fontSize:"12px", fontWeight:600 }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAll} style={{ background:"none", border:"none",
                color:"#3b82f6", fontSize:"13px", cursor:"pointer", fontWeight:500 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight:"400px", overflowY:"auto" }}>
            {loading ? <div style={{ padding:"32px", textAlign:"center", color:"#9ca3af" }}>Loading…</div>
            : notifications.length === 0
              ? <div style={{ padding:"40px 16px", textAlign:"center", color:"#9ca3af" }}>
                  <div style={{ fontSize:"32px", marginBottom:"8px" }}>🔔</div>
                  <div style={{ fontSize:"14px" }}>No notifications yet</div>
                </div>
              : notifications.map(n => (
                  <div key={n._id} onClick={() => !n.isRead && markOne(n._id)}
                    style={{ display:"flex", gap:"12px", padding:"12px 16px",
                      background: n.isRead ? "#fff" : "#f0f9ff",
                      borderBottom:"1px solid #f9fafb",
                      cursor: n.isRead ? "default" : "pointer" }}>
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%",
                      background: typeColor[n.type] ?? "#6b7280", marginTop:"6px", flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize:"13px",
                        color:"#111827", marginBottom:"2px", whiteSpace:"nowrap",
                        overflow:"hidden", textOverflow:"ellipsis" }}>{n.title}</div>
                      <div style={{ fontSize:"12px", color:"#6b7280", marginBottom:"4px" }}>{n.message}</div>
                      <div style={{ fontSize:"11px", color:"#9ca3af" }}>
                        {n.ticketNumber} · {timeAgo(n.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;