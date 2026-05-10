import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { RootErrorBoundary } from "./components/RootErrorBoundary";
import "./polyfills/mapGetOrInsert";
import "./lib/configurePdfWorker";
import "./index.css";

// 配置 @react-three/drei 的 useGLTF 使用本地 Draco 解码器
import { useGLTF } from "@react-three/drei";
useGLTF.setDecoderPath("/draco/");

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Missing #root — check index.html');
}

createRoot(rootEl).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);
