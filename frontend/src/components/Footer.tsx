import { Link } from "react-router-dom";
import { User, Map } from "lucide-react";

export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black py-2 px-4">
      <div className="flex justify-around items-center">
        <Link
          to="/hunts"
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-green"
        >
          <Map className="w-5 h-5" />
          <span className="text-xs">Hunts</span>
        </Link>
        <Link 
          to="/profile"
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-green"
        >
          <User className="w-5 h-5" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  );
}