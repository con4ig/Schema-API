import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { UploadCloud, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { UploadProps } from "../types";

const Upload: React.FC<UploadProps> = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("invoice", file);

      try {
        const response = await axios.post(
          "http://localhost:5000/api/analyze/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        toast.success("Invoice analyzed successfully!");

        onUploadSuccess(response.data.data);
      } catch (err) {
        console.error(err);
        const errMsg =
          axios.isAxiosError(err)
            ? err.response?.data?.error ?? "Upload failed"
            : "Upload failed";
        toast.error(`Error: ${errMsg}`);
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [onUploadSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  return (
    <div className="w-full">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="mb-8"
      >
        <div
          {...getRootProps()}
          className={`group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer glass-panel
            ${isDragActive ? "border-sky-500 bg-sky-500/10" : "border-slate-700 hover:border-sky-500/50 hover:bg-slate-800/50"}`}
        >
          <input {...getInputProps()} />

        <div className="relative py-12 flex flex-col items-center justify-center text-center px-4">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-sky-500/10 rounded-full mb-4 relative">
                <div className="absolute inset-0 bg-sky-500/20 rounded-full animate-ping"></div>
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-white">
                AI Processing...
              </h3>
              <p className="text-sky-400 font-medium mt-1 text-sm">
                Analyzing document structure
              </p>
            </div>
          ) : (
            <>
              <div
                className={`p-4 rounded-full mb-4 transition-all duration-300 ${isDragActive ? "bg-sky-500/20" : "bg-slate-800 group-hover:bg-slate-700"}`}
              >
                <UploadCloud
                  className={`w-8 h-8 ${isDragActive ? "text-sky-400" : "text-slate-400 group-hover:text-sky-400"}`}
                />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors flex items-center gap-2">
                Upload Invoice
                <Sparkles className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-slate-500 mt-2 text-sm">JPG, PNG up to 5MB</p>
            </>
          )}
        </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 text-red-400 rounded-xl text-sm text-center border border-red-500/20 flex items-center justify-center gap-2"
        >
          <span className="font-bold">Error:</span> {error}
        </motion.div>
      )}
    </div>
  );
};

export default Upload;
