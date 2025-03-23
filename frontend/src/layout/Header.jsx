import React from 'react';
import { Heading } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Heading as="h1" size="xl" textAlign="center" mb={4}>
        IBM Release Note Manager
      </Heading>
    </motion.div>
  );
};

export default Header; 