"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "977164781706800";

// Global type for Facebook Pixel
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

/**
 * Meta Pixel initialization and route change tracking.
 * Clean code approach: Separated from main layout logic.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Standard Meta Pixel initialization
    if (typeof window.fbq !== "undefined") return;

    (function (f: any, b: any, e: any, v: any) {
      if (f.fbq) return;
      let n: any = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      let t: any = b.createElement(e);
      t.async = !0;
      t.src = v;
      let s: any = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("init", PIXEL_ID);
      fbq("track", "PageView");
    }
  }, []);

  useEffect(() => {
    // Track PageView on route change
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * Helper function to track custom events from anywhere in the app.
 */
export const trackMetaEvent = (eventName: string, options = {}) => {
  if (typeof window !== "undefined") {
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("track", eventName, options);
    } else {
      console.warn(`[MetaPixel] fbq not found. Event ${eventName} skipped.`);
    }
  }
};
