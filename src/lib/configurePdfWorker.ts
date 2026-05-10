import { GlobalWorkerOptions } from "pdfjs-dist";
import { pdfjs } from "react-pdf";

try {
  const workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
  GlobalWorkerOptions.workerSrc = workerSrc;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
} catch (e) {
  console.warn("[configurePdfWorker]", e);
}
