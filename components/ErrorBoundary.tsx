
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from './Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle runtime errors gracefully.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    // Attempt to clear corrupted state and restore the environment
    // Fix: Using setState to update component state and trigger re-render
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 font-sans">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full ring-1 ring-white/5">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.Format className="w-8 h-8 text-amber-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Workspace Halted</h1>
            <p className="text-slate-400 mb-6 text-sm">
              We encountered a glitch, but your code is safe. <br/>
              Let's refresh the environment.
            </p>

            <div className="bg-black/30 p-3 rounded-lg border border-slate-800/50 mb-6 text-left overflow-auto max-h-24">
              <code className="text-[10px] text-red-300 font-mono">
                {this.state.error?.message || "Unknown Application Error"}
              </code>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              <Icons.RotateCcw className="w-4 h-4" />
              Restore Workspace
            </button>
          </div>
        </div>
      );
    }

    // Fix: Accessing the children property from props to render the application content
    return this.props.children;
  }
}

export default ErrorBoundary;
