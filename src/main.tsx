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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Chat />} />
          <Route path="/:threadId" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
