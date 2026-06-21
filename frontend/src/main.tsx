import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#111827",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            borderRadius: "10px",
          },
          success: { iconTheme: { primary: "#9333ea", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
