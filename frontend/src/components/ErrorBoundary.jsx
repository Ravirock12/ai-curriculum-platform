import { Component } from 'react';

/**
 * ErrorBoundary — catches any React render crash and shows a friendly
 * recovery UI instead of a blank white screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 max-w-md shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-6">
              A rendering error occurred. This is usually caused by missing or malformed data.
              Click below to go back to the dashboard.
            </p>
            <p className="text-xs text-slate-600 font-mono mb-6 break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
