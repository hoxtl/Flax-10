/*
 * React error boundary that catches render errors and shows a fallback UI.
 */

import React from "react";
import styles from "./ErrorBoundary.module.css";

/** Catches errors thrown during rendering and displays a retry prompt. */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) { this.props.onRetry(); } else { window.location.reload(); }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.icon}>⚠️</div>
          <h2 className={styles.title}>Something went wrong</h2>
          <p className={styles.message}>An unexpected error occurred while loading this component.</p>
          {process.env.NODE_ENV === "development" && (
            <pre className={styles.debugInfo}>{this.state.error && this.state.error.toString()}</pre>
          )}
          <button className={styles.retryButton} onClick={this.handleRetry}>Try Again</button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
