import { scan } from 'react-scan'; // import this BEFORE react

import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  scan({
    enabled: true,
    trackUnnecessaryRenders: true,
  });
}

import { BrowserRouter, Route, Routes } from "react-router";
import { Shell } from './Shell';
import Chat from './Chat';
import { ClerkProvider } from '@clerk/clerk-react';

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Chat />} />
            <Route path="/:threadId" element={<Chat />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
