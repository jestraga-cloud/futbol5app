"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      containerStyle={{ bottom: 80 }}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "14px",
        },
        success: {
          duration: 3000,
          style: {
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
          },
        },
        error: {
          duration: 4000,
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          },
        },
      }}
    />
  );
}
