import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RootErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error.message;
      return (
        <div
          style={{
            boxSizing: "border-box",
            minHeight: "100vh",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#1a1025",
            color: "#f5f5f5",
          }}
        >
          <h1 style={{ fontSize: 18, marginTop: 0 }}>页面加载出错</h1>
          <p style={{ opacity: 0.9, lineHeight: 1.5 }}>
            内置预览有时无法正常加载本站的脚本或 WebGL。请用系统浏览器打开开发地址（终端里 Vite 显示的 Local URL），或把 Cursor 简单浏览器面板拉高后刷新。
          </p>
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              overflow: "auto",
              fontSize: 13,
              background: "#0d0712",
              borderRadius: 8,
              color: "#fda4af",
            }}
          >
            {msg}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
