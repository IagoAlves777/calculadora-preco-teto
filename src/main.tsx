import { StrictMode } from 'react'

import './index.css'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'

import Toaster from '@components/Toaster'
import { system } from '@theme'
import App from './App'

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <App />
      <Toaster />
    </ChakraProvider>
  </StrictMode>,
)
