import { GiOpenTreasureChest } from "react-icons/gi";
import { cn } from "../../lib/utils";

interface LoaderProps {
  text?: string;
  subtext?: string;
  showAnimation?: boolean;
  className?: string;
}

export function Loader({ 
  text = "Loading...", 
  subtext,
  showAnimation = true,
  className 
}: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-32 px-4", className)}>
      <div className="relative mb-8">
        <GiOpenTreasureChest 
          className={cn(
            "w-32 h-32 text-gray-400 opacity-50",
            showAnimation && "animate-bounce"
          )} 
        />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          {text}
        </h2>
        {subtext && (
          <p className="text-sm text-gray-600 mb-6 italic">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
