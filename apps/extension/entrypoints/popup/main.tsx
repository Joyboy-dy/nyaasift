import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";

import "./style.css";

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable dans popup/index.html");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
