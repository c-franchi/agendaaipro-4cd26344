// Capture password-recovery intent before Supabase initializes.
import "./lib/password-recovery";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
