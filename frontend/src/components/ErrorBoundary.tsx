import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-raised">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-text-primary">Something went wrong</h2>
            <p className="mt-2 text-sm text-text-muted">
              An unexpected error occurred while loading this page.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 rounded-xl bg-bg p-3 text-left font-mono text-xs text-danger overflow-x-auto border border-border">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                onClick={() => (window.location.href = "/")}
              >
                <Home className="h-4 w-4" /> Home
              </Button>
              <Button className="flex-1 gap-2" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4" /> Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
