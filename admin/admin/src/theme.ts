import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  globalCss: {
    'html, body, #root': {
      height: '100%',
      bg: 'gray.50',
      color: 'gray.900',
    },
    body: {
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
      textRendering: 'optimizeLegibility',
    },
    '*::placeholder': { color: 'gray.400' },
    '*': { borderColor: 'gray.200' },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eaf6ff' },
          100: { value: '#cfe9ff' },
          200: { value: '#a4d4fa' },
          300: { value: '#6fbaf2' },
          400: { value: '#3a9be5' },
          500: { value: '#1a7dd1' },
          600: { value: '#0c5283' },
          700: { value: '#093d62' },
          800: { value: '#062944' },
          900: { value: '#031827' },
        },
        accent: {
          50: { value: '#e6fbf7' },
          100: { value: '#bff3e7' },
          200: { value: '#7ee5cc' },
          300: { value: '#3fd0ad' },
          400: { value: '#1ec19a' },
          500: { value: '#0ab6a2' },
          600: { value: '#089482' },
          700: { value: '#067064' },
          800: { value: '#054e46' },
          900: { value: '#022d28' },
        },
      },
      fonts: {
        body: { value: "'Inter', system-ui, -apple-system, sans-serif" },
        heading: { value: "'Inter', system-ui, -apple-system, sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        'bg.app': { value: { base: '{colors.gray.50}', _dark: '{colors.gray.950}' } },
        'bg.surface': { value: { base: 'white', _dark: '{colors.gray.900}' } },
        'bg.subtle': { value: { base: '{colors.gray.50}', _dark: '{colors.gray.800}' } },
        'border.subtle': { value: { base: '{colors.gray.200}', _dark: '{colors.gray.700}' } },
        'text.primary': { value: { base: '{colors.gray.900}', _dark: '{colors.gray.50}' } },
        'text.muted': { value: { base: '{colors.gray.500}', _dark: '{colors.gray.400}' } },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
