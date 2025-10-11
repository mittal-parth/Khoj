import { Link } from "react-router-dom";
import WalletWrapper from "@/components/WalletWrapper";
import { SUPPORTED_CHAINS, getNetworkByChainId } from "../lib/utils";
import { useState, useEffect } from "react";
import { useActiveWalletChain } from "thirdweb/react";

export function Navbar() {
  const [currentNetwork, setCurrentNetwork] = useState<string>(
    Object.keys(SUPPORTED_CHAINS)[0]
  );
  
  // Get the active wallet chain from thirdweb
  const activeWalletChain = useActiveWalletChain();

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("current_network");
    if (stored && SUPPORTED_CHAINS[stored as keyof typeof SUPPORTED_CHAINS])
      setCurrentNetwork(stored);
  }, []);

  // Sync with wallet chain changes
  useEffect(() => {
    if (activeWalletChain) {
      const networkName = getNetworkByChainId(activeWalletChain.id);
      
      if (networkName && networkName !== currentNetwork) {
        setCurrentNetwork(networkName);
        localStorage.setItem("current_network", networkName);
      }
    }
  }, [activeWalletChain, currentNetwork]);

  return (
    <nav className="fixed top-0 w-full bg-white z-50 border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold flex items-center gap-2 text-black hover:text-green transition-colors">
              <img 
                src="/khoj-logo-no-bg.png" 
                alt="Khoj Logo" 
                className="h-16 object-contain"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-black hover:text-green font-medium transition-colors">
              Hunts
            </Link>
            <Link to="/profile" className="text-black hover:text-green font-medium transition-colors">
              Profile
            </Link>
            <Link
              to="/hunt/create"
              className="text-black hover:text-green font-medium transition-colors"
            >
              Create Hunt
            </Link>
          </div>

          {/* Wallet Connect */}
          <div className="flex items-center text-black ml-1 md:ml-2">
            <WalletWrapper
              className="bg-yellow border-2 border-black text-black rounded-md
                hover:bg-orange hover:border-orange px-3 py-2 text-xs md:text-sm font-semibold
                transition-all duration-300 transform hover:scale-105"
              text="Get Started"
              withWalletAggregator={true}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
