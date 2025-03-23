import React from 'react';
import { Box, Container, Heading, Text } from '@chakra-ui/react';

const ErrorPage = () => {
  return (
    <Box bg="black" color="white" minH="100vh" display="flex" alignItems="center">
      <Container maxW="container.xl">
        <Box position="relative" zIndex="1">
          <Heading as="h1" size="2xl" mb={6} fontWeight="normal">
            We're sorry!
          </Heading>
          
          <Text fontSize="lg" maxW="600px" mb={10}>
            The page you're looking for may have been moved or deleted. 
            Start a new search on ibm.com.
          </Text>
        </Box>
        
        <Box
          position="absolute"
          right="0"
          top="50%"
          transform="translateY(-50%)"
          fontSize="40vw"
          fontWeight="bold"
          opacity="0.13"
          color="gray.100"
          zIndex="0"
          userSelect="none"
        >
          404
        </Box>
      </Container>
    </Box>
  );
};

export default ErrorPage; 