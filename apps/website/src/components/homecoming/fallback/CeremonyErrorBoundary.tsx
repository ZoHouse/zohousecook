// apps/website/src/components/homecoming/fallback/CeremonyErrorBoundary.tsx
import React from 'react'

type Props = { fallback: React.ReactNode; children: React.ReactNode }
type State = { hasError: boolean }

export class CeremonyErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        '[Homecoming] canvas crashed → rendering fallback',
        error,
      )
    }
    // TODO: wire to Sentry once the website app's Sentry config confirms
    // a reporter is available — see apps/website/sentry.client.config.ts
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
