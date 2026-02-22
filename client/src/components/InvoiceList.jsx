import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Calendar,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";

const InvoiceList = ({ invoices, onSelect }) => {
  if (!invoices.length)
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
          <Tag className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-slate-400 text-lg font-medium">No data</p>
        <p className="text-slate-600 text-sm mt-1">
          The system is waiting for the first files.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col border border-white/5 rounded-2xl bg-slate-900/20 overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <div className="col-span-4 lg:col-span-3">Vendor</div>
        <div className="col-span-2 hidden lg:block">Date</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2 text-right">Net</div>
        <div className="col-span-3 lg:col-span-2 text-center">Status</div>
        <div className="col-span-1"></div>
      </div>

      {/* Invoice List */}
      <div className="divide-y divide-white/5">
        {invoices.map((inv, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={inv._id}
            onClick={() => onSelect(inv)}
            className="group hover:bg-white/2 transition-colors duration-200 cursor-pointer p-5 md:px-8 md:py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 items-start md:items-center relative"
          >
            {/* Mobile Title Row */}
            <div className="flex justify-between items-center w-full md:hidden mb-2">
              <div className="font-bold text-slate-200 truncate pr-4">
                {inv.vendor_name || "N/A"}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-sky-400" />
            </div>

            {/* Vendor (Desktop) & ID */}
            <div className="col-span-4 lg:col-span-3 w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start mb-2 md:mb-0">
              <div className="hidden md:block font-bold text-slate-200 group-hover:text-sky-400 transition-colors truncate w-full">
                {inv.vendor_name || "N/A"}
              </div>
              <div className="text-xs text-slate-600 font-mono opacity-80 md:opacity-50 flex items-center gap-2">
                 <span className="md:hidden">ID:</span> {inv._id.slice(-6)}
              </div>
              {/* Mobile Date */}
              <div className="md:hidden flex items-center gap-1.5 text-slate-400 text-xs">
                <Calendar className="w-3.5 h-3.5 opacity-50" />
                {inv.date || "-"}
              </div>
            </div>

            {/* Date (Desktop) */}
            <div className="col-span-2 hidden lg:flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-3.5 h-3.5 opacity-50" />
              {inv.date || "-"}
            </div>

            {/* Category */}
            <div className="col-span-2 w-full md:w-auto flex items-center justify-between md:justify-start mt-2 md:mt-0">
              <span className="md:hidden text-xs text-slate-500 uppercase tracking-widest font-bold">Category</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                {inv.category || "Other"}
              </span>
            </div>

            {/* Net Amount */}
            <div className="col-span-2 text-right w-full md:w-auto flex items-center justify-between md:justify-end mt-2 md:mt-0">
               <span className="md:hidden text-xs text-slate-500 uppercase tracking-widest font-bold">Net Amount</span>
              <span className="font-mono font-bold text-slate-200">
                {inv.total_net?.toFixed(2)} PLN
              </span>
            </div>

            {/* Status */}
            <div className="col-span-3 lg:col-span-2 text-center w-full md:w-auto flex items-center justify-between md:justify-center mt-3 md:mt-0 border-t border-white/5 md:border-t-0 pt-3 md:pt-0">
              <span className="md:hidden text-xs text-slate-500 uppercase tracking-widest font-bold">Status</span>
              {inv.anomaly_detected ? (
                <span
                  title={inv.anomaly_detected}
                  className="cursor-help flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20"
                >
                  <AlertTriangle className="w-3 h-3" /> Anomaly
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" /> Valid
                </span>
              )}
            </div>

            {/* Action Arrow (Desktop) */}
            <div className="col-span-1 hidden md:flex justify-end pr-2">
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-sky-400 transform group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceList;
