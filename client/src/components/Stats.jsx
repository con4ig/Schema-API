import React from "react";
import { Files, TrendingUp, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";

const Stats = ({ invoices }) => {
  const totalNet = invoices.reduce((sum, inv) => sum + (inv.total_net || 0), 0);
  const totalVAT = invoices.reduce(
    (sum, inv) => sum + ((inv.total_gross || 0) - (inv.total_net || 0)),
    0,
  );
  const anomalies = invoices.filter((inv) => inv.anomaly_detected).length;

  const cardVariants = {
    hover: { y: -5, transition: { duration: 0.2 } },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1 */}
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className="glass-panel p-6 rounded-2xl flex items-center justify-between"
      >
        <div>
          <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">
            Total VAT
          </h3>
          <p className="text-3xl font-bold text-white">
            {totalVAT.toLocaleString("pl-PL", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-sm font-normal text-slate-500 ml-1">PLN</span>
          </p>
        </div>
        <div className="p-3 bg-slate-800 rounded-xl border border-white/5">
          <Files className="w-6 h-6 text-slate-400" />
        </div>
      </motion.div>

      {/* Card 2 */}
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className="glass-panel p-6 rounded-2xl flex items-center justify-between relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <h3 className="text-sky-500/70 text-xs uppercase font-bold tracking-widest mb-1">
            Total Net
          </h3>
          <p className="text-3xl font-bold text-white tracking-tight">
            {totalNet.toLocaleString("pl-PL", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-sm font-normal text-slate-500 ml-1">PLN</span>
          </p>
        </div>
        <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 relative z-10">
          <TrendingUp className="w-6 h-6 text-sky-400" />
        </div>
      </motion.div>

      {/* Card 3 */}
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className="glass-panel p-6 rounded-2xl flex items-center justify-between"
      >
        <div>
          <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">
            Anomalies
          </h3>
          <p
            className={`text-3xl font-bold ${anomalies > 0 ? "text-red-400" : "text-white"}`}
          >
            {anomalies}
          </p>
        </div>
        <div
          className={`p-3 rounded-xl border ${anomalies > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}
        >
          <AlertOctagon
            className={`w-6 h-6 ${anomalies > 0 ? "text-red-400" : "text-emerald-400"}`}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Stats;
