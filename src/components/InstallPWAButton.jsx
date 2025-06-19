// src/components/InstallPWAButton.jsx
import React from 'react';
import { usePWA } from '../hooks/usePWA';

const InstallPWAButton = () => {
  const { isInstallable, isInstalled, installPWA, browserInfo } = usePWA();

  console.log('🔘 InstallPWAButton render:', {
    isInstallable,
    isInstalled,
    browserInfo
  });

  // Si no soporta PWA, mostrar mensaje informativo
  if (!browserInfo.supportsInstall) {
    return (
      <div className="flex items-center text-orange-600 text-sm bg-orange-50 px-3 py-2 rounded-md border border-orange-200">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {browserInfo.name === 'firefox' ? 'Firefox' : 'Navegador'} no soporta PWA
      </div>
    );
  }

  if (isInstalled) {
    return (
      <div className="flex items-center text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        App Instalada
      </div>
    );
  }

  if (!isInstallable) {
    return (
      <div className="flex items-center text-gray-500 text-sm bg-gray-100 px-3 py-2 rounded-md">
        <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Verificando...
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        console.log('🖱️ Botón de instalación clickeado');
        installPWA();
      }}
      className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 shadow-sm"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Instalar App
    </button>
  );
};

export default InstallPWAButton;