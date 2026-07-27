import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorState } from "@/components/ui/StateMessage";
import { branding } from "@/config/branding";
import { ERROR_STATES } from "@/content/states";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors in the subtree below it so one broken
 * component (e.g. a bad product image parse) can't blank the whole page.
 * Wrap route-level sections with this, not just the app root.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this should report to an error-tracking service.
    console.error(`${branding.businessName} render error:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState {...ERROR_STATES.boundary} onAction={() => window.location.reload()} />
      );
    }
    return this.props.children;
  }
}
