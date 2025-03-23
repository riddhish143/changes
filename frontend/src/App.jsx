import React, { useEffect, useState } from 'react';
import { Container, VStack, Center, Text } from '@chakra-ui/react';
import '@carbon/styles/css/styles.css';
import 'antd/dist/reset.css';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { AppProvider } from './context/AppContext';
import Header from './layout/Header';
import StepsDisplay from './layout/StepsDisplay';
import MainContent from './layout/MainContent';
import { useLocation } from 'react-router-dom';
import { isValidUrl } from './utils/urlValidator';
import ErrorPage from './components/ErrorPage';
import SharedMarkdownView from './components/SharedMarkdownView';

function App() {
  const [validUrl, setValidUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharedView, setIsSharedView] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Validate the URL using our utility function
    const params = new URLSearchParams(location.search);
    const valid = isValidUrl(location.pathname, params);
    const openEditor = params.get('openEditor');
    const content = params.get('content');
    const gistUrl = params.get('gistUrl');
    
    setValidUrl(valid);
    setIsSharedView(valid && openEditor === 'true' && (content || gistUrl));
    setIsLoading(false);
  }, [location]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Text>Loading...</Text>
      </Center>
    );
  }

  if (!validUrl) {
    return <ErrorPage />;
  }

  // If it's a shared view, render only the SharedMarkdownView
  if (isSharedView) {
    return <SharedMarkdownView />;
  }

  return (
    <AppProvider>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Header />
          <StepsDisplay />
          <MainContent />
        </VStack>
      </Container>
    </AppProvider>
  );
}

export default App; 