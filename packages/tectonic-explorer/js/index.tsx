import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/app";
import * as THREE from "three";
import initRollbar from "./init-rollbar";

initRollbar();

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
// Useful for debugging, e.g. it's possible to create new THREE.Vector3 instances that are used internally.
window.THREE = THREE;

