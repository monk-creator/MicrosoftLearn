import { Component, type ErrorInfo, type ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="boot-error">
          <h1 className="boot-error-title">The app hit a runtime error</h1>
          <p className="boot-error-hint">
            Copy this text if you report a bug. Also check the browser console (F12).
          </p>
          <pre className="boot-error-pre">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
