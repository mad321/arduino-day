import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EdgeScanner from "./EdgeScanner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EdgeScanner />
  </StrictMode>
);
