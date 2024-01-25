import React from 'react';
import { Box, Text, Heading } from '@chakra-ui/react';
import ShipmentStatus from "../src/ShipmentStatus.jsx"

function App() {
  return (
    <Box textAlign="center" py={10}>
      <ShipmentStatus />
    </Box>
  );
}

export default App;
