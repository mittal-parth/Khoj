import { createThirdwebClient } from "thirdweb";

// Replace with your client ID from thirdweb dashboard
export const client = createThirdwebClient({
  clientId:
    import.meta.env.VITE_PUBLIC_THIRDWEB_CLIENT_ID || "your-client-id-here",
});
