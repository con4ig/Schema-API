import React from "react";
import Dashboard from "./components/Dashboard";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Dashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1e293b", // slate-800
            color: "#fff",
            borderRadius: "0.5rem", // rounded-lg
            border: "1px solid #334155", // slate-700
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#10b981", // emerald-500
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444", // red-500
              secondary: "#fff",
            },
          },
        }}
      />
    </>
  );
}

export default App;
