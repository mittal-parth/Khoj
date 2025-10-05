import { Navbar } from "./components/Navbar";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router";
import { Hunts } from "./components/Hunts";
import { Clue } from "./components/Clue";
import { Rewards } from "./components/Rewards";
import { HuntEnd } from "./components/HuntEnd";
import { HuntDetails } from "./components/HuntDetails";
import { Footer } from "./components/Footer";
import { About } from "./components/About";
import { Create } from "./components/Create";

function App() {
  return (
      <BrowserRouter>
        <div className="min-h-screen bg-yellow/10">
          <Navbar />
          <Routes>
            <Route path="/" element={<Hunts />} />
            <Route path="/hunt/:huntId/clue/:clueId" element={<Clue />} />
            <Route path="/hunt/:huntId/end" element={<HuntEnd />} />
            <Route path="/hunt/:huntId" element={<HuntDetails />} />
            <Route path="/profile" element={<Rewards />} />
            <Route path="/about" element={<About />} />
            <Route path="/hunt/create" element={<Create />} />
          </Routes>
          <div className="md:hidden">
            <Footer />
          </div>
        </div>
      </BrowserRouter>
  );
}

export default App;
