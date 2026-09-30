import * as React from "react";

const emptySubscribe = () => () => {};

/**
 * Hydration-safe hook that returns true only after mounting on the client.
 * Uses useSyncExternalStore (React 18/19 recommended standard) to avoid
 * cascading renders and ESLint react-hooks/set-state-in-effect errors.
 */
export function useMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
