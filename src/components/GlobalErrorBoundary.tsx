import React from 'react';
import { Alert } from 'react-native';

export default class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled error', error);
    Alert.alert('Error inesperado', 'Por favor reinicia la app');
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
