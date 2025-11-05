import { useEffect } from 'react';

export function loadSatoshiFont() {
  useEffect(() => {
    // Load Satoshi font from Fontshare
    const link = document.createElement('link');
    link.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Apply Satoshi as default font
    document.documentElement.style.setProperty('--font-satoshi', 'Satoshi, sans-serif');
  }, []);
}
