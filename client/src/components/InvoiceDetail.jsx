import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Building2,
  Tag,
  FileText as FileTextIcon,
  RotateCcw,
  Save,
  Trash,
} from "lucide-react";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import axios from "axios";
import toast from "react-hot-toast";

const InvoiceDetail = ({ invoice, onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    vendor_name: "",
    date: "",
    category: "",
    total_net: "",
    total_gross: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        vendor_name: invoice.vendor_name || "",
        date: invoice.date || "",
        category: invoice.category || "",
        total_net: invoice.total_net || "",
        total_gross: invoice.total_gross || "",
      });
    }
  }, [invoice]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/settings");
        if (res.data && res.data.custom_categories) {
          setCategories(res.data.custom_categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "total_net") {
      const netVal = parseFloat(value);
      const grossVal = isNaN(netVal) ? "" : (netVal * 1.23).toFixed(2);

      setFormData((prev) => ({
        ...prev,
        total_net: value,
        total_gross: grossVal,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    const net = parseFloat(formData.total_net);
    const gross = parseFloat(formData.total_gross);

    if (!isNaN(net) && !isNaN(gross) && net === gross && net > 0) {
      toast.error(
        "Net and gross amounts cannot be identical. Please correct the data.",
      );
      return;
    }

    const toastId = toast.loading("Saving changes...");
    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/invoices/${invoice._id}`,
        formData,
      );
      if (onUpdate) onUpdate(res.data);
      toast.success("Changes saved!", { id: toastId });
    } catch (error) {
      console.error("Error saving invoice:", error);
      const errorMsg = error.response?.data?.msg || "Error saving changes.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    const toastId = toast.loading("Restoring invoice...");
    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/invoices/${invoice._id}/restore`,
      );
      if (onUpdate) onUpdate(res.data);
      toast.success("Invoice restored!", { id: toastId });
    } catch (error) {
      console.error("Error restoring invoice:", error);
      toast.error("Restore error.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateGross = () => {
    const netVal = parseFloat(formData.total_net);
    if (!isNaN(netVal)) {
      const grossVal = (netVal * 1.23).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        total_gross: grossVal,
      }));
      toast.success("Gross amount recalculated (+23% VAT)");
    }
  };

  const handleApprove = async () => {
    const net = parseFloat(formData.total_net);
    const gross = parseFloat(formData.total_gross);

    if (!isNaN(net) && !isNaN(gross) && net === gross && net > 0) {
      toast.error(
        "Cannot approve invoice with identical net and gross amounts.",
      );
      return;
    }

    const toastId = toast.loading("Approving...");
    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/invoices/${invoice._id}/approve`,
        formData,
      );
      if (onUpdate) onUpdate(res.data);
      toast.success("Invoice approved!", { id: toastId });
    } catch (error) {
      console.error("Error approving invoice:", error);
      const errorMsg = error.response?.data?.msg || "Approval error.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this invoice?"))
      return;

    const toastId = toast.loading("Deleting invoice...");
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/invoices/${invoice._id}`);
      toast.success("Invoice deleted", { id: toastId });
      onClose();
      // We need to trigger a refresh in the parent, but onUpdate expects an invoice.
      // We might need to handle this differently in Dashboard, but for now closing is key.
      // Ideally onUpdate would handle deletion or we pass onDelete prop.
      // Assuming onUpdate maps to fetchInvoices or similar refresh in parent when passed null/deleted.
      // Actually Dashboard passes `handleInvoiceUpdate` which updates state.
      // We should probably reload the dashboard. Let's rely on manual refresh for now?
      // No, better to force refresh.
      window.location.reload(); // Simple but effective for MVP deletion to ensure sync.
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Deletion error.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-modal rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col h-[95vh] sm:h-[85vh] w-[95vw] sm:w-full max-w-5xl shadow-2xl shadow-sky-900/20"
    >
      {/* Header - Fixed */}
      <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${invoice.anomaly_detected ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
            {invoice.anomaly_detected ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-[150px] sm:max-w-md">
              {invoice.vendor_name || "Invoice Details"}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-mono">
              ID: {invoice._id}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0 bg-slate-950/30">
        {/* Left: Image (or Top on Mobile) */}
        <div className="w-full lg:w-1/2 bg-slate-950 relative p-4 flex flex-col justify-center items-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 h-64 sm:h-80 lg:h-auto shrink-0 lg:shrink">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950"></div>

        {invoice.image_data ? (
          <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={`data:${invoice.mime_type || "image/jpeg"};base64,${invoice.image_data}`}
              className="max-w-full max-h-full rounded-lg shadow-2xl object-contain border border-white/10"
              alt="Invoice"
            />
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-2xl text-center max-w-sm relative z-10">
            <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-sky-500/10">
              <FileTextIcon className="w-10 h-10 text-sky-400" />
            </div>
            <h3 className="text-white font-bold text-xl">Original</h3>
            <p className="text-slate-400 text-sm mt-3 font-mono">
              {invoice.original_filename}
            </p>
          </div>
        )}
      </div>

        {/* Right Side: Editable Form */}
        <div className="w-full lg:w-1/2 p-5 sm:p-8 lg:p-10 flex-1">
          {/* Anomaly Alert Box */}
          {(invoice.anomaly_detected ||
            (parseFloat(formData.total_net) ===
              parseFloat(formData.total_gross) &&
              parseFloat(formData.total_net) > 0)) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-bold mb-1">
                    {parseFloat(formData.total_net) ===
                      parseFloat(formData.total_gross) &&
                    parseFloat(formData.total_net) > 0
                      ? "VAT Validation Error"
                      : "Anomaly Detected"}
                  </h4>
                  <p className="text-red-300/80 text-xs">
                    {parseFloat(formData.total_net) ===
                      parseFloat(formData.total_gross) &&
                    parseFloat(formData.total_net) > 0
                      ? "Net and gross amounts are identical. Please correct the data."
                      : invoice.anomaly_detected}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {parseFloat(formData.total_net) ===
                  parseFloat(formData.total_gross) &&
                  parseFloat(formData.total_net) > 0 && (
                    <button
                      onClick={handleRecalculateGross}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold transition-all border border-sky-500/30 active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Recalculate VAT
                    </button>
                  )}
              </div>
            </div>
          )}

        {/* Anomaly Alert Box */}
        {(invoice.anomaly_detected ||
          (parseFloat(formData.total_net) ===
            parseFloat(formData.total_gross) &&
            parseFloat(formData.total_net) > 0)) && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-start gap-4">
            <div className="flex-1">
              <h4 className="text-red-400 font-bold flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5" />{" "}
                {parseFloat(formData.total_net) ===
                  parseFloat(formData.total_gross) &&
                parseFloat(formData.total_net) > 0
                  ? "Critical Error: VAT"
                  : "Anomaly Detected"}
              </h4>
              <p className="text-red-300/80 text-sm">
                {parseFloat(formData.total_net) ===
                  parseFloat(formData.total_gross) &&
                parseFloat(formData.total_net) > 0
                  ? "Net and gross amounts are identical. This invoice cannot be approved. You can recalculate gross automatically or correct net manually."
                  : invoice.anomaly_detected}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full">
              {parseFloat(formData.total_net) ===
                parseFloat(formData.total_gross) &&
                parseFloat(formData.total_net) > 0 && (
                  <button
                    onClick={handleRecalculateGross}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm font-bold transition-all border border-sky-500/30 active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recalculate Gross (VAT 23%)
                  </button>
                )}
              {invoice.status === "pending" && (
                <button
                  onClick={handleApprove}
                  disabled={
                    loading ||
                    (parseFloat(formData.total_net) ===
                      parseFloat(formData.total_gross) &&
                      parseFloat(formData.total_net) > 0)
                  }
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    parseFloat(formData.total_net) ===
                      parseFloat(formData.total_gross) &&
                    parseFloat(formData.total_net) > 0
                      ? "bg-white/5 text-white/20 border-white/10 cursor-not-allowed"
                      : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 cursor-pointer"
                  }`}
                >
                  {parseFloat(formData.total_net) ===
                    parseFloat(formData.total_gross) &&
                  parseFloat(formData.total_net) > 0
                    ? "Approval Blocked"
                    : "Understood, ignore error"}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none cursor-text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {cat}
                  </option>
                ))}
                {!categories.includes(formData.category) &&
                  formData.category && (
                    <option value={formData.category} className="bg-slate-900">
                      {formData.category}
                    </option>
                  )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Vendor
            </label>
            <input
              type="text"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none cursor-text"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Net
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  name="total_net"
                  value={formData.total_net}
                  onChange={handleChange}
                  className="w-full pl-8 p-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white font-bold tracking-wide focus:border-sky-500 outline-none transition-all cursor-text"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between items-center">
                <span>Gross</span>
                {parseFloat(formData.total_net) ===
                  parseFloat(formData.total_gross) &&
                  parseFloat(formData.total_net) > 0 && (
                    <button
                      onClick={handleRecalculateGross}
                      className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Recalculate automatically (VAT 23%)"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Recalc
                    </button>
                  )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  name="total_gross"
                  value={formData.total_gross}
                  readOnly
                  className="w-full pl-8 p-3 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-400 font-bold tracking-wide outline-none cursor-not-allowed"
                  title="Value calculated automatically (Net + 23% VAT)"
                />
              </div>
            </div>
          </div>
        </div>

        </div> {/* End of Form Scrollable Content */}
      </div> {/* End of Main Content Area */}

      {/* Footer - Fixed */}
      <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/90 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 z-20">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 group"
        >
          <Trash size={18} className="opacity-50 group-hover:opacity-100" />
          Delete
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={invoice.isArchived ? handleRestore : handleSave}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sky-950 bg-sky-400 hover:bg-sky-300 shadow-lg shadow-sky-900/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {invoice.isArchived ? <RotateCcw size={18} /> : <Save size={18} />}
            {loading ? "Processing..." : (invoice.isArchived ? "Restore" : "Save Changes")}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoiceDetail;
