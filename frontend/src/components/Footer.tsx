import { Link } from "react-router-dom";
import { User, Map } from "lucide-react";

export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex justify-around items-center">
        <Link
          to="/"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green"
        >
          <Map className="w-6 h-6" />
          <span className="text-sm">Hunts</span>
        </Link>
        <Link 
          to="/profile"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-green"
        >
          <User className="w-6 h-6" />
          <span className="text-sm">Profile</span>
        </Link>
      </div>
    </div>
  );
}