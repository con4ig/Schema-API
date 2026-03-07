import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Upload from "./Upload";
import InvoiceList from "./InvoiceList";
import Stats from "./Stats";
import SettingsModal from "./SettingsModal";
import {
  LayoutDashboard,
  FileText,
  Settings as SettingsIcon,
  Bell,
  Check,
  AlertTriangle,
  X,
  Download,
  Archive,
  Loader,
  FileSpreadsheet,
} from "lucide-react";
import InvoiceDetail from "./InvoiceDetail";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars

import NotificationDropdown from "./NotificationDropdown";

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchInvoices = React.useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/analyze");

      // Filter based on showArchived toggle
      const filteredInvoices = response.data.filter((inv) => {
        const isArchived = inv.isArchived || false;
        return showArchived ? isArchived : !isArchived;
      });

      setInvoices(filteredInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }, [showArchived]);

  const handleExport = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/invoices/export",
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `faktury_eksport_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful!");
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Invoice export error.");
    }
  };

  const handleArchive = async () => {
    const invoicesToArchive = invoices.filter(
      (inv) => inv.status === "approved" && !inv.isArchived,
    );
    const invoiceIds = invoicesToArchive.map((inv) => inv._id);

    if (invoiceIds.length === 0) {
      toast.error("No approved invoices to archive.");
      return;
    }

    const toastId = toast.loading("Archiving...");
    setArchiving(true);
    try {
      await axios.put("http://localhost:5000/api/invoices/archive", {
        invoiceIds,
      });

      setInvoices((prevInvoices) =>
        prevInvoices.filter((inv) => !invoiceIds.includes(inv._id)),
      );

      fetchInvoices();
      toast.success(`Archived ${invoiceIds.length} invoices.`, {
        id: toastId,
      });
    } catch (err) {
      console.error("Archive failed", err);
      toast.error("An error occurred during archiving.", { id: toastId });
    } finally {
      setArchiving(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchInvoices, fetchNotifications]);

  const handleUploadSuccess = (newInvoice) => {
    setInvoices([newInvoice, ...invoices]);
    fetchNotifications();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-20 bg-[#020617]">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Navbar Container */}
      <div className="sticky top-0 z-50 w-full px-4 sm:px-6 py-2 sm:py-4">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto glass-panel rounded-2xl border border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl backdrop-blur-md bg-slate-900/40"
        >
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-sky-500 p-2 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] group-hover:scale-110 transition-transform duration-300">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0 leading-none">
                  Profit Lens
                </h1>
                <span className="hidden sm:block text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em] mt-1 opacity-80">
                  Enterprise AI
                </span>
              </div>
            </div>

            {/* Nav Links (Desktop) */}
            <div className="hidden md:flex items-center gap-1">
              <button className="px-4 py-2 rounded-lg bg-white/5 text-sky-400 text-sm font-medium border border-sky-500/20">
                Dashboard
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-sky-400 shadow-lg select-none"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,1)]"></span>
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                fetchNotifications={fetchNotifications}
                setNotifications={setNotifications}
                setUnreadCount={setUnreadCount}
              />
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:text-sky-400 text-slate-400 transition-all active:scale-95 shadow-lg cursor-pointer select-none"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            {/* Vertical Divider */}
            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">
                  Open Source User
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                  Manager
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 p-[1.5px] shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-[9px] bg-slate-950 flex items-center justify-center text-xs font-black text-white">
                  OS
                </div>
              </div>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Main Content Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8"
      >
        {/* 1. Drag & Drop Zone */}
        <motion.section variants={itemVariants}>
          <Upload onUploadSuccess={handleUploadSuccess} />
        </motion.section>

        {/* 2. Stats Overview */}
        <motion.section variants={itemVariants}>
          <Stats invoices={invoices} />
        </motion.section>

        {/* 3. List & Detail View */}
        <motion.section
          variants={itemVariants}
          className="relative min-h-[500px]"
        >
          <AnimatePresence mode="wait">
            {selectedInvoice ? (
              <InvoiceDetail
                key="detail"
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onUpdate={(updatedInvoice) => {
                  fetchInvoices();
                  if (updatedInvoice) setSelectedInvoice(updatedInvoice);
                }}
              />
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel rounded-2xl overflow-hidden"
              >
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-400" />
                    Recent Analysis
                  </h3>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-xs font-bold uppercase tracking-wide ${showArchived ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white cursor-pointer"}`}
                    >
                      <Archive size={16} />{" "}
                      {showArchived ? "Hide Archive" : "Show Archive"}
                    </button>

                    {!showArchived && (
                      <>
                        <button
                          onClick={handleExport}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold uppercase tracking-wide cursor-pointer"
                        >
                          <FileSpreadsheet size={16} /> Export CSV
                        </button>
                        <button
                          onClick={handleArchive}
                          disabled={archiving}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wide disabled:opacity-50 cursor-pointer"
                        >
                          {archiving ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <Archive size={16} />
                          )}
                          {archiving ? "Archiving..." : "Archive"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <InvoiceList
                  invoices={invoices}
                  onSelect={setSelectedInvoice}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Dashboard;
