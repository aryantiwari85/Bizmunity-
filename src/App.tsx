import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AndroidApp } from './android/AndroidApp';

export default function App() {
  return (
    <AuthProvider>
      <AndroidApp />
    </AuthProvider>
  );
}
