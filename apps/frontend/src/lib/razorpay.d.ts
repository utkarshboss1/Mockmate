// Global declarations for third-party browser scripts loaded via <Script>
export {};

declare global {
  interface Window {
    /** Injected by the Razorpay checkout.js script (loaded in app/layout.tsx) */
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}
