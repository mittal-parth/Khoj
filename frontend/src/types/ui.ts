import React from "react";

// Import ButtonProps from the button component
type ButtonProps = any; // We'll define this properly when needed

export interface TransactionButtonProps {
  contractAddress: string;
  abi: any;
  functionName: string;
  args: any[];
  text: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onClick?: () => boolean | void;
}

export interface ConfettiButtonProps extends ButtonProps {
  options?: any; // ConfettiOptions & ConfettiGlobalOptions & { canvas?: HTMLCanvasElement };
  children?: React.ReactNode;
}

export interface RewardCard {
  code: string;
  description: string;
  isExpired: boolean;
  expiryDate?: string;
  icon: React.ReactElement;
}

export interface Riddle {
  riddle: string;
  answer: string;
  hint: string;
}

export interface ChartContextProps {
  config: any; // ChartConfig type from chart component
}

// Confetti types
export type Api = {
  fire: (options?: any) => void;
};

export type ConfettiProps = React.ComponentPropsWithRef<"canvas"> & {
  options?: any;
  globalOptions?: any;
  manualstart?: boolean;
  children?: React.ReactNode;
};

export type ConfettiRef = Api | null;
export type ToasterProps = React.ComponentProps<typeof import("sonner").Toaster>;

export const bgColors = ["green", "orange", "yellow", "pink", "red"];
export const bgColorClasses = {
  green: "bg-green-700",
  orange: "bg-orange-600", 
  yellow: "bg-yellow-600",
  pink: "bg-pink-600",
  red: "bg-red-600"
};
export const textColorClasses = {
  green: "text-green-700",
  orange: "text-orange-600", 
  yellow: "text-yellow-600",
  pink: "text-pink-600",
  red: "text-red-600"
};
