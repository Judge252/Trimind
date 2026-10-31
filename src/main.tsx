import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import RouteBoundary from './components/RouteBoundary';
import "./styles.css";
import './visual-polish.css';
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouteBoundary><App /></RouteBoundary>
  </StrictMode>,
);
