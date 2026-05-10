import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WorkCase from "./pages/WorkCase";
import PictureBookExperience from "./pages/PictureBookExperience";
import SockDetectiveBook from "./pages/SockDetectiveBook";
import Posters from "./pages/Posters";
import { LanguageProvider } from "./i18n";
import { ThemeProvider } from "./theme";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/posters" element={<Posters />} />
            <Route path="/works/socks-detective/read" element={<SockDetectiveBook />} />
            <Route path="/sock-detective-book" element={<Navigate to="/works/socks-detective/read" replace />} />
            <Route path="/works/:slug/read" element={<PictureBookExperience />} />
            <Route path="/works/:slug" element={<WorkCase />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;