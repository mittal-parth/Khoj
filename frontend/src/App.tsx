import { Navbar } from './components/Navbar';
import './App.css'
import '@coinbase/onchainkit/styles.css';
import { BrowserRouter, Routes, Route } from "react-router";
import { Hunts } from "./components/Hunts";
import { Clue } from "./components/Clue";
import { Rewards } from "./components/Rewards";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-yellow/10">
        <Navbar />
        <Routes>
          <Route path="/" element={<Hunts />} />
          <Route path="/hunt/:huntId/clue/:clueId" element={<Clue />} />
          <Route path="/profile" element={<Rewards />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
