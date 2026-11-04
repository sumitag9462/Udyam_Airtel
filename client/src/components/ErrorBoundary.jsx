import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-mobile py-16 text-center" role="alert">
          <h1 className="text-h1 mb-4">Something went wrong</h1>
          <p className="text-secondary mb-8">
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
