import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

export const FONT_SIZE = {
  XS: '12px',   // tiny labels, captions
  SM: '13px',   // secondary text, buttons
  MD: '14px',   // body, inputs
  LG: '15px',   // slightly prominent
  XL: '20px',   // section titles
  XXL: '22px',  // stat numbers
  XXXL: '30px', // hero title
} as const

export const COLORS = {
  BACKGROUND: '#07070e',
  SURFACE: '#0f0d1c',
  SURFACE_HOVER: '#171428',
  BORDER: 'rgba(157, 124, 252, 0.15)',
  BORDER_HOVER: 'rgba(157, 124, 252, 0.28)',
  TEXT_PRIMARY: '#e8f0ea',
  TEXT_SECONDARY: '#a0b8a6',
  TEXT_MUTED: '#b0b8be',
  GREEN: '#00e07a',
  GREEN_TRANSPARENT: 'rgba(0, 224, 122, 0.12)',
  RED: '#f05252',
  RED_TRANSPARENT: 'rgba(240, 82, 82, 0.12)',
  AMBER: '#f59e0b',
  AMBER_TRANSPARENT: 'rgba(245, 158, 11, 0.12)',
  PURPLE: '#9d7cfc',
  PURPLE_DARK: '#6d4de0',
  PURPLE_TRANSPARENT: 'rgba(157, 124, 252, 0.12)',
  PURPLE_SEMI: 'rgba(157, 124, 252, 0.25)',
  BLUE: '#4a9de0',
  BLUE_TRANSPARENT: 'rgba(74, 157, 224, 0.12)',
} as const

const systemConfig = defineConfig({
  globalCss: {
    body: {
      background: COLORS.BACKGROUND,
      color: COLORS.TEXT_PRIMARY,
      fontFamily: "'DM Mono', monospace",
      minHeight: '100vh',
    },
    '*': {
      boxSizing: 'border-box',
    },
    'input': {
      height: '33.7px',
    },
    'input[type=number]': {
      MozAppearance: 'textfield',
    },
    'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Syne', sans-serif` },
        body: { value: `'DM Mono', monospace` },
        mono: { value: `'DM Mono', monospace` },
      },
    },
  },
})

export const system = createSystem(defaultConfig, systemConfig)
