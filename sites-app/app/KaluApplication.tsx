"use client";

import { useEffect, useState } from "react";
import { HashRouter } from "react-router-dom";
import App from "../legacy-src/App";

export default function KaluApplication() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Client-only router activation after hydration is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-700">
        Loading Kalu Training…
      </main>
    );
  }

  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}
