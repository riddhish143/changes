import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ChakraProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="*" element={<App />} />
        </Routes>
      </HashRouter>
    </ChakraProvider>
  </React.StrictMode>,
) 