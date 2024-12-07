import { FaEthereum } from "react-icons/fa";
import { Link } from "react-router-dom";
import WalletWrapper from "@/helpers/WalletWrapper";
import { SUPPORTED_CHAINS } from "../providers";
import { useState, useEffect } from "react";

export function Navbar() {
  const [currentNetwork, setCurrentNetwork] = useState<string>("base");

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("current_network");
    if (stored) setCurrentNetwork(stored);
  }, []);

  const handleNetworkChange = (network: string) => {
    setCurrentNetwork(network);
    localStorage.setItem("current_network", network);

    // Switch the network in the wallet
    const chainId =
      SUPPORTED_CHAINS[network as keyof typeof SUPPORTED_CHAINS].id;

    console.log(chainId);
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <FaEthereum className="text-green text-2xl" />
              Khoj
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-green">
              Hunts
            </Link>
            <Link to="/profile" className="text-gray-700 hover:text-green">
              Profile
            </Link>

            {/* Network Selector Dropdown */}
            <select
              aria-label="Select network"
              value={currentNetwork}
              onChange={(e) => handleNetworkChange(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="moonbeam">Moonbeam Testnet</option>
              <option value="bnb">BNB Testnet</option>
              <option value="base">Base Sepolia</option>
            </select>
          </div>

          {/* Wallet Connect */}
          <div className="flex items-center text-black">
            <WalletWrapper
              className="bg-yellow/80 border border-black text-black rounded-2xl hover:bg-yellow/80"
              text="Connect Wallet"
              withWalletAggregator={true}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
