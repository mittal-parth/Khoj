
import { FaEthereum } from "react-icons/fa";
import { Link } from 'react-router-dom';
import WalletWrapper from '@/helpers/WalletWrapper';

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <FaEthereum className="text-green text-2xl" />
              ETH Hunt
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
          </div>

          {/* Wallet Connect */}
          <div className="flex items-center text-black">
          <WalletWrapper
              className="bg-green text-white rounded-2xl hover:bg-green/80"
              text="Connect Wallet"
              withWalletAggregator={true}
            />
          </div>
        </div>
      </div>
    </nav>
  );
} 