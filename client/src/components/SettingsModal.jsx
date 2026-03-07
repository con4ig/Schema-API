import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { X, Check, Building, Tag } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const SettingsModal = ({ isOpen, onClose }) => {
  const [nip, setNip] = useState("");
  const [vatRate, setVatRate] = useState(0.23);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/settings");
      setNip(res.data.company_nip || "");
      setVatRate(res.data.default_vat_rate || 0.23);
      setCategories(res.data.custom_categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Saving settings...");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/settings", {
        company_nip: nip,
        default_vat_rate: vatRate,
        custom_categories: categories,
      });
      setSuccess(true);
      toast.success("Settings saved!", { id: toastId });
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Error saving settings.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeCategory = (cat) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-modal w-full max-w-lg rounded-2xl border border-white/10 p-6 relative z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Building className="text-sky-400" /> Profile Settings
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              {/* NIP Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Company NIP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="e.g. 5252528085"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Used to automatically verify the buyer on invoices.
                </p>
              </div>

              {/* VAT Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Default VAT Rate (decimal)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value))}
                    placeholder="e.g. 0.23"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Used to verify the gross amount (e.g. 0.23 for 23% VAT).
                </p>
              </div>

              {/* Categories Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Custom Categories
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addCategory())
                    }
                    placeholder="New category..."
                    className="w-full sm:flex-1 bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="w-full sm:w-auto bg-sky-500/20 text-sky-400 px-4 py-2 rounded-lg hover:bg-sky-500/30 transition-colors text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 border border-white/5 rounded-full text-xs text-slate-300"
                    >
                      <Tag size={12} className="text-slate-400" />
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                                        flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all
                                        ${success ? "bg-emerald-500 text-white" : "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20"}
                                    `}
                >
                  {loading ? (
                    "Saving..."
                  ) : success ? (
                    <>
                      <Check size={16} /> Saved
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
