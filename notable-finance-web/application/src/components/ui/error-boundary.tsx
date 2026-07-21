"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  /** Content wrapped by this boundary. */
  children: ReactNode;
  /** Optional section label shown in the error fallback. */
  sectionLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based React error boundary that catches render-phase errors from its
 * children and displays a lightweight fallback instead of crashing the entire
 * workspace. Each page section (dashboard, income, expense, etc.) should be
 * wrapped individually so a crash in one section does not destroy the others.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary sectionLabel="Dashboard">
 *   <DashboardPage ... />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // In production this would feed into an error-reporting service.
    console.error(
      `[ErrorBoundary${this.props.sectionLabel ? ` – ${this.props.sectionLabel}` : ""}]`,
      error,
      info.componentStack,
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__icon">
            <AlertTriangle size={20} />
          </div>
          <div className="error-boundary__body">
            <strong>
              {this.props.sectionLabel
                ? `${this.props.sectionLabel} failed to render`
                : "Something went wrong"}
            </strong>
            <span className="error-boundary__message">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </span>
            <button
              type="button"
              className="error-boundary__retry"
              onClick={this.handleReset}
            >
              <RefreshCw size={13} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
