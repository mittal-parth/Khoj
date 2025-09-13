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
  icon: JSX.Element;
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
