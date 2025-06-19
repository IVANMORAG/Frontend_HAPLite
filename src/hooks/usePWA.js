// src/hooks/usePWA.js
import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ name: '', supportsInstall: false });

  useEffect(() => {
    console.log('🔍 usePWA: Inicializando hook');
    
    // Detectar navegador
    const detectBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      let browser = { name: 'unknown', supportsInstall: false };
      
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        browser = { name: 'chrome', supportsInstall: true };
      } else if (userAgent.includes('edg')) {
        browser = { name: 'edge', supportsInstall: true };
      } else if (userAgent.includes('firefox')) {
        browser = { name: 'firefox', supportsInstall: false };
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        browser = { name: 'safari', supportsInstall: false };
      }
      
      console.log('🌐 Browser detectado:', browser);
      setBrowserInfo(browser);
      return browser;
    };

    // Detectar si ya está instalada
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = navigator.standalone === true;
      const isInstalledApp = isStandalone || isNavigatorStandalone;
      
      console.log('📱 Verificando instalación:', {
        isStandalone,
        isNavigatorStandalone,
        isInstalledApp,
        location: window.location.href
      });
      
      if (isInstalledApp) {
        setIsInstalled(true);
        console.log('✅ App ya está instalada');
        return true;
      }
      return false;
    };

    // Manejar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('🎯 beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('💾 Prompt guardado, botón habilitado');
    };

    // Manejar cuando se instala la app
    const handleAppInstalled = () => {
      console.log('🎉 App instalada exitosamente');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    const browser = detectBrowser();
    const installed = checkIfInstalled();

    // Solo proceder si no está instalada y el navegador soporta PWA
    if (!installed && browser.supportsInstall) {
      // Verificar si PWA es soportada
      if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker no soportado');
        return;
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Para localhost en desarrollo, simular que es instalable después de un tiempo
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
          if (!isInstalled && !isInstallable && browser.supportsInstall) {
            console.log('🔧 Localhost detectado: Habilitando instalación');
            setIsInstallable(true);
          }
        }, 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    console.log('🚀 Intentando instalar PWA');
    console.log('🔧 Estado actual:', { browserInfo, deferredPrompt: !!deferredPrompt });
    
    if (!browserInfo.supportsInstall) {
      const message = browserInfo.name === 'firefox' 
        ? 'Firefox no soporta instalación de PWAs. Usa Chrome, Edge o Safari en iOS.'
        : 'Este navegador no soporta instalación de PWAs. Intenta con Chrome o Edge.';
      
      alert(message);
      return;
    }

    if (deferredPrompt) {
      console.log('📋 Mostrando prompt de instalación');
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`👤 Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
        
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('❌ Error al mostrar prompt:', error);
      }
    } else {
      // Fallback para navegadores que soportan PWA pero no tienen prompt disponible
      const instructions = getInstallInstructions();
      alert(instructions);
    }
  };

  const getInstallInstructions = () => {
    if (browserInfo.name === 'chrome') {
      return 'Para instalar:\n1. Busca el ícono de instalación en la barra de direcciones\n2. O ve al menú ⋮ → "Instalar MikroTik Manager"';
    } else if (browserInfo.name === 'edge') {
      return 'Para instalar:\n1. Busca el ícono de instalación en la barra de direcciones\n2. O ve al menú ⋯ → "Aplicaciones" → "Instalar este sitio como aplicación"';
    }
    return 'La instalación manual no está disponible en este navegador.';
  };

  // Debug logs
  console.log('📊 Estado actual PWA:', {
    isInstallable,
    isInstalled,
    hasDeferredPrompt: !!deferredPrompt,
    browserInfo
  });

  return {
    isInstallable,
    isInstalled,
    installPWA,
    browserInfo
  };
};