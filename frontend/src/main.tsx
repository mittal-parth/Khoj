import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Providers } from './providers.tsx'
import './index.css'
import { HuddleClient, HuddleProvider } from "@huddle01/react";
import { Toaster } from "sonner";

const huddleClient = new HuddleClient({
  projectId: import.meta.env.VITE_PUBLIC_HUDDLE_PROJECT_ID!,
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HuddleProvider client={huddleClient}>
    <Providers>
      <Toaster position="top-center" />
      <App />
    </Providers>
    </HuddleProvider>
  </React.StrictMode>,
)
