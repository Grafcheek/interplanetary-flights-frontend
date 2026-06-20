import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { store } from "./store";

if (import.meta.env.PROD && import.meta.env.MODE !== "tauri") {
  registerSW({ immediate: true });
} else if ("serviceWorker" in navigator) {
  // Service worker ломает crossOriginIsolated, нужный WebLLM в dev.
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      void registration.unregister();
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
