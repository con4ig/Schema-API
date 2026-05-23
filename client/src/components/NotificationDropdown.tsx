import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle, Trash2, BellOff } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import type { NotificationDropdownProps } from "../types";

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  setUnreadCount,
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on Escape or Click Outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      const removedNotif = notifications.find((n) => n._id === id);
      if (removedNotif && !removedNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await axios.delete("http://localhost:5000/api/notifications");
      setNotifications([]);
      setUnreadCount(0);
      setIsConfirmingClear(false);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-[72px] sm:top-full sm:mt-4 w-auto sm:w-96 bg-slate-900/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-60 overflow-hidden select-none"
        >
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              Notifications
            </h3>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  {isConfirmingClear ? (
                    <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">
                        Clear?
                      </span>
                      <button
                        onClick={handleClearAll}
                        className="text-[10px] font-black text-red-500 hover:text-red-400 cursor-pointer"
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setIsConfirmingClear(false)}
                        className="text-[10px] font-black text-slate-400 hover:text-white cursor-pointer"
                      >
                        NO
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingClear(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <BellOff size={12} /> Clear All
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                aria-label="Close notifications"
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-slate-500 text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`group p-4 hover:bg-white/5 transition-all relative ${!notif.read ? "bg-sky-500/5" : ""}`}
                  >
                    <div className="flex gap-3 pr-8">
                      <div
                        className={`mt-0.5 p-1.5 rounded-lg h-fit ${notif.type === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}
                      >
                        {notif.type === "warning" ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm ${!notif.read ? "text-slate-100 font-medium" : "text-slate-400"}`}
                        >
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="absolute right-2 top-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif._id)}
                          aria-label="Mark notification as read"
                          className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif._id)}
                        aria-label="Delete notification"
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
