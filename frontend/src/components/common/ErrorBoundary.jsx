import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-background p-4 text-center">
          <div className="card border-0 shadow-lg p-5 rounded-4 bg-surface" style={{ maxWidth: '480px' }}>
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mb-3 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h4 className="fw-bold text-dark mb-2">Something went wrong</h4>
            <p className="text-muted small mb-4">
              An unexpected error occurred in the application view. Please reload the page to restore your session.
            </p>
            <button
              onClick={this.handleReload}
              className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-2 rounded-3 mx-auto"
            >
              <RefreshCw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
