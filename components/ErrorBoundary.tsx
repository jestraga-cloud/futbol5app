"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-8 text-center m-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">😵</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Algo salio mal
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Hubo un error inesperado. Intenta de nuevo.
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
