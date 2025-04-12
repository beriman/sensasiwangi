import React from 'react';
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '../lib/auth-provider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ClerkProvider>
  );
}
