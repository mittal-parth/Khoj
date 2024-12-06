import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown, 
  WalletDropdownDisconnect, 
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
} from '@coinbase/onchainkit/identity';
import { color } from '@coinbase/onchainkit/theme';
import { FaEthereum } from "react-icons/fa";
import { Link } from 'react-router-dom';

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
          <div className="flex items-center">
            <Wallet>
              <ConnectWallet className='bg-green hover:bg-green/80 transition-colors duration-300'>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6" />
                  <Name />
                </div>
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address className={color.primary} />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </div>
    </nav>
  );
} 