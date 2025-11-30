import { Navbar } from "./components/Navbar";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Hunts } from "./components/Hunts";
import { Clue } from "./components/Clue";
import { Rewards } from "./components/Rewards";
import { HuntEnd } from "./components/HuntEnd";
import { HuntDetails } from "./components/HuntDetails";
import { Footer } from "./components/Footer";
import { About } from "./components/About";
import { Create } from "./components/Create";
import { RouteGuard } from "./components/RouteGuard";
import { LandingPage } from "./components/LandingPage";

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-yellow/10">
      {!isLanding && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/hunts" element={<Hunts />} />
        <Route 
          path="/hunt/:huntId/clue/:clueId" 
          element={
            <RouteGuard>
              <Clue />
            </RouteGuard>
          } 
        />
        <Route path="/hunt/:huntId/end" element={<HuntEnd />} />
        <Route path="/hunt/:huntId" element={<HuntDetails />} />
        <Route path="/profile" element={<Rewards />} />
        <Route path="/about" element={<About />} />
        <Route path="/hunt/create" element={<Create />} />
      </Routes>
      <div className="md:hidden">
        {!isLanding && <Footer />}
      </div>
    </div>
  );
}

function App() {
  return (
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
  );
}

export default App;
