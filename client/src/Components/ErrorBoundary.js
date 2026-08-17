import React, { Component } from "react";

/**
 * ErrorBoundary — catches React render errors and displays a friendly
 * fallback instead of a blank white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unknown error" };
  }

  componentDidCatch(error, info) {
    // In production, pipe this to a monitoring service (Sentry, etc.)
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = process.env.NODE_ENV !== "production";

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
          background: "var(--bg-primary, #12151b)",
          color: "var(--text-primary, #efede7)",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "var(--text-muted, #6b6860)", maxWidth: 400, margin: 0 }}>
          An unexpected error occurred. Please refresh the page to try again.
        </p>
        {isDev && this.state.message && (
          <pre
            style={{
              fontSize: "0.75rem",
              background: "rgba(184,72,62,0.12)",
              color: "#d99089",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              maxWidth: 480,
              overflowX: "auto",
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.message}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.4rem",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-blue, #5d6fe0)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
