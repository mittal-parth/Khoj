// Common button styles

export const buttonStyles = {
  // Primary action button (like "Manage" and "Start Hunt")
  primary: "bg-green/90 border border-green text-white font-semibold hover:bg-green hover:border-green shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300",
  
  // Secondary action button (like "Register")
  secondary: "bg-yellow/70 border border-black text-white font-semibold hover:bg-yellow-600 hover:border-yellow-700 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300",
  
  // Disabled button
  disabled: "bg-gray-400 cursor-not-allowed text-gray-600 border border-gray-300",
  
  // Team management button
  team: "bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300",
  
  // Danger/Stop button
  danger: "bg-red-500 hover:bg-red-600 text-white",
} as const;

export type ButtonStyleKey = keyof typeof buttonStyles;
