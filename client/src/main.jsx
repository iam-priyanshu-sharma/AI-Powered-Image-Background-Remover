// client/src/main.jsx
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";

// Clerk publishable key (from Vite env)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Debug log to help when envs are missing
console.log("VITE_CLERK_PUBLISHABLE_KEY:", PUBLISHABLE_KEY);

// TEMPORARILY DISABLE SW (for debugging)
// Comment out or remove this block after testing.
const __DISABLE_SW_FOR_DEBUG = false;

// Render root helper so we can render with/without Clerk depending on env
function renderApp(useClerk = false) {
  const root = createRoot(document.getElementById("root"));
  if (useClerk && PUBLISHABLE_KEY) {
    root.render(
      <BrowserRouter>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <AppContextProvider>
            <App />
          </AppContextProvider>
        </ClerkProvider>
      </BrowserRouter>
    );
  } else {
    // Render app without Clerk — avoids blank page if key is missing.
    root.render(
      <BrowserRouter>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </BrowserRouter>
    );
  }
}

// If publishable key exists, use Clerk. Otherwise warn and render fallback.
if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY.startsWith("-----")) {
  console.warn(
    "Clerk publishable key missing or placeholder detected. Rendering app without Clerk. Add VITE_CLERK_PUBLISHABLE_KEY for full auth functionality."
  );
  renderApp(false);
} else {
  renderApp(true);
}

/* ---------------------------
   Service Worker registration
   Safe update: ask new SW to skip waiting and reload when controller changes
   --------------------------- */
if (!__DISABLE_SW_FOR_DEBUG && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      // If there's already a waiting worker, message it to skip waiting
      if (reg.waiting) {
        try {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        } catch (e) {
          console.warn("Failed to message waiting SW:", e);
        }
      }

      // Listen for updates and tell the new worker to skip waiting
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            try {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            } catch (e) {
              console.warn("Failed to message new SW to skip waiting:", e);
            }
          }
        });
      });
    })
    .catch((err) => {
      console.warn("Service worker registration failed:", err);
    });

  // Guarded controllerchange handler to avoid reload loops
  (function setupControllerChangeGuard() {
    let __swReloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      try {
        if (__swReloading) {
          // already reloading — ignore further events
          return;
        }
        __swReloading = true;
        console.log(
          "Service worker controller changed — reloading once to activate new version."
        );
        // small delay to let things settle, then reload once
        setTimeout(() => {
          try {
            window.location.reload();
          } catch (e) {
            console.warn("Reload failed:", e);
          }
        }, 200);
      } catch (e) {
        console.warn("controllerchange handler error:", e);
      }
    });
  })();
}
