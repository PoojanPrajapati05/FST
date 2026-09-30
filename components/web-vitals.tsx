"use client";
// 'use client' boundary required: useReportWebVitals relies on browser PerformanceObserver APIs to monitor LCP, CLS, and INP metrics.

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Specifically log Core Web Vitals: LCP, CLS, and INP
    if (["LCP", "CLS", "INP", "FCP", "TTFB"].includes(metric.name)) {
      const color =
        metric.rating === "good"
          ? "#22c55e"
          : metric.rating === "needs-improvement"
          ? "#eab308"
          : "#ef4444";

      console.log(
        `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}${metric.name === "CLS" ? "" : "ms"} (${metric.rating})`,
        `color: ${color}; font-weight: bold;`
      );
    }
  });

  return null;
}
