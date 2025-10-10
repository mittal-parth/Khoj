import { SiPolkadot, SiCoinbase } from "react-icons/si";
import { Link } from "react-router-dom";
import WalletWrapper from "@/components/WalletWrapper";
import { SUPPORTED_CHAINS, getChainByNetwork, getNetworkByChainId } from "../lib/utils";
import { useState, useEffect } from "react";
import { useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";

// Mapping for user-friendly labels and icons
const NETWORK_META: Record<string, { label: string; icon: JSX.Element }> = {
  moonbeam: {
    label: "Moonbeam",
    icon: <SiPolkadot className="w-5 h-5 text-pink-600" />,
  },
  base: {
    label: "Base",
    icon: <SiCoinbase className="w-5 h-5 text-blue-500" />,
  },
  flow: {
    label: "Flow",
    icon: (
      <img
        src="/flow.svg"
        alt="Flow Logo"
        className="w-5 h-5"
        style={{ display: "inline-block", verticalAlign: "middle" }}
      />
    ),
  },
  assetHub: {
    label: "Paseo AssetHub",
    icon: <SiPolkadot className="w-5 h-5 text-pink-600" />,
  },
};

export function Navbar() {
  const [currentNetwork, setCurrentNetwork] = useState<string>(
    Object.keys(SUPPORTED_CHAINS)[0]
  );
  
  // Get the active wallet chain and switch function from thirdweb
  const activeWalletChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("current_network");
    if (stored && SUPPORTED_CHAINS[stored as keyof typeof SUPPORTED_CHAINS])
      setCurrentNetwork(stored);
  }, []);

  // Sync dropdown with wallet chain changes
  useEffect(() => {
    if (activeWalletChain) {
      const networkName = getNetworkByChainId(activeWalletChain.id);
      
      if (networkName && networkName !== currentNetwork) {
        setCurrentNetwork(networkName);
        localStorage.setItem("current_network", networkName);
      }
    }
  }, [activeWalletChain, currentNetwork]);

  const handleNetworkChange = async (network: string) => {
    setCurrentNetwork(network);
    localStorage.setItem("current_network", network);

    // Switch the network in the wallet
    try {
      const chain = getChainByNetwork(network);
      await switchChain(chain);
      console.log("Switched to chain:", chain.name);
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  const renderSelectedNetwork = () => {
    return (
      NETWORK_META[currentNetwork]?.icon || (
        <SiPolkadot className="w-5 h-5 text-blue-500" />
      )
    );
  };

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

          {/* Navigation Links and Network Selector */}
          <div className="flex items-center gap-2 md:gap-4">
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

            {/* Custom Network Selector */}
            <div className="relative group">
              <select
                aria-label="Select network"
                value={currentNetwork}
                onChange={(e) => handleNetworkChange(e.target.value)}
                className="appearance-none bg-white border-2 border-black rounded-md 
                  w-28 h-10 pl-10 pr-8
                  hover:border-green focus:outline-none focus:border-green 
                  cursor-pointer font-medium text-sm transition-all duration-200
                  hover:shadow-md hover:scale-105"
              >
                {Object.keys(SUPPORTED_CHAINS).map((key) => (
                  <option key={key} value={key} className="text-black">
                    {NETWORK_META[key]?.label || key}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {renderSelectedNetwork()}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg 
                  className="w-4 h-4 text-black group-hover:text-green transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
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
