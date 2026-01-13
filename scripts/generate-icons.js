// Script para generar iconos PNG desde SVG
// Para ejecutar: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Crear iconos placeholder (los reales deberían generarse con una herramienta de imagen)
const sizes = [192, 512];

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 SIZE SIZE">
  <rect width="SIZE" height="SIZE" rx="RADIUS" fill="#16a34a"/>
  <circle cx="CENTER" cy="CENTER" r="BALL" fill="white"/>
  <polygon points="CENTER,TOP CENTER+30,CENTER-20 CENTER+20,CENTER+30 CENTER-20,CENTER+30 CENTER-30,CENTER-20" fill="#222"/>
</svg>`;

console.log('Para generar los iconos PNG, podés usar una de estas opciones:');
console.log('');
console.log('1. Usar un conversor online como https://cloudconvert.com/svg-to-png');
console.log('2. Usar Figma o cualquier editor de imágenes');
console.log('3. Instalar sharp: npm install sharp');
console.log('');
console.log('Por ahora, la app funcionará sin los iconos PNG.');
console.log('Cuando tengas los iconos, guardalos como:');
console.log('  - public/icon-192.png (192x192)');
console.log('  - public/icon-512.png (512x512)');
