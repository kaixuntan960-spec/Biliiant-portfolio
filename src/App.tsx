import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { lazyRetry } from "./utils/lazyRetry";
import Index from "./pages/Index";
import SockDetectiveBook from "./pages/SockDetectiveBook";
import Posters from "./pages/Posters";
import { LanguageProvider } from "./i18n";
import { ThemeProvider } from "./theme";

const WorkCase = lazyRetry(() => import("./pages/WorkCase"));
const PictureBookExperience = lazyRetry(() => import("./pages/PictureBookExperience"));

const queryClient = new QueryClient();

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--background)" }} />}>
    {children}
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/posters" element={<Posters />} />
            <Route path="/works" element={<Navigate to="/" replace />} />
            <Route path="/works/socks-detective" element={<Navigate to="/works/socks-detective/read" replace />} />
            <Route path="/works/socks-detective/read" element={<SockDetectiveBook />} />
            <Route path="/sock-detective-book" element={<Navigate to="/works/socks-detective/read" replace />} />
            <Route path="/works/:slug/read" element={<LazyLoad><PictureBookExperience /></LazyLoad>} />
            <Route path="/works/:slug" element={<LazyLoad><WorkCase /></LazyLoad>} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;