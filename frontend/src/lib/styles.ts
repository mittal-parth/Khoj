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

export const statAccents = {
  green: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    hover: 'hover:bg-emerald-100/80',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    hover: 'hover:bg-amber-100/80',
  },
  violet: {
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    hover: 'hover:bg-violet-100/80',
  },
} as const;

export type StatAccentKey = keyof typeof statAccents;
