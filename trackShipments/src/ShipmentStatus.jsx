import React, { useEffect, useState } from 'react';
import { Heading, Table, Thead, Tbody, Tr, Th, Td, Box, Text, Drawer, DrawerContent, DrawerBody, DrawerOverlay, Button, Flex } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ShipmentStatus = () => {
    const [isBotActive, setIsBotActive] = useState(false);
    const [botMessage, setBotMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [shipments, setShipments] = useState([]);

    useEffect(() => {
        // Fetch shipments data from the Express.js API
        axios.get('http://localhost:4000/api/shipments')
            .then((response) => {
                setShipments(response.data);
            })
            .catch((error) => {
                console.error('Error fetching shipments data:', error.message);
            });
    }, []);

    const hasActionNeededOrders = true;

    useEffect(() => {
        if (hasActionNeededOrders) {
            setBotMessage("Hi! Some orders need your attention today.");
            setIsBotActive(true);
        } else {
            setBotMessage("Hi! Everything is good for today. No actions needed on your orders.");
            setIsBotActive(true);
        }
    }, [hasActionNeededOrders]);

    const handleDrawerOpen = () => {
        setIsOpen(true);
    };

    const handleDrawerClose = () => {
        setIsOpen(false);
    };

    return (
        <div>
            <Drawer isOpen={isOpen} placement="right" onClose={handleDrawerClose} width="100vw">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerBody>
                        There are some orders that need revision.
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            <Heading as="h1" size="xl" textAlign="center" my={6} width="100vw" color="navy">
                Shipment Status
            </Heading>

            <Table variant="simple" width="100vw" colorScheme="blue" borderWidth="1px" borderRadius="md" boxShadow="md">
    <Thead>
        <Tr>
            <Th color="white" bg="navy" py={2} fontSize="lg">PO Number</Th>
            <Th color="white" bg="navy" py={2} fontSize="lg">Client</Th>
            <Th color="white" bg="navy" py={2} fontSize="lg">Product</Th>
            <Th color="white" bg="navy" py={2} fontSize="lg">Steamship Line</Th>
            <Th color="white" bg="navy" py={2} fontSize="lg">Container</Th>
            <Th color="white" bg="navy" py={2} fontSize="lg">ETA</Th>
            <Th color="white" bg="navy" py={2} fontSize="lg">Status</Th>
        </Tr>
    </Thead>
    <Tbody>
        {Object.keys(shipments).map((shipmentKey) => {
            const shipment = shipments[shipmentKey];
            return (
                <Tr key={shipmentKey}>
                    <Td>{shipment.poNumber}</Td>
                    <Td>{shipment.client}</Td>
                    <Td>{shipment.product}</Td>
                    <Td>{shipment.steamshipLine}</Td>
                    <Td>{shipment.container}</Td>
                    <Td>{shipment.eta}</Td>
                    <Td>{shipment.status}</Td>
                </Tr>
            );
        })}
    </Tbody>
</Table>


            {isBotActive && (
                <Box position="fixed" top="20px" right="20px" p="4" bg="navy" borderRadius="md" boxShadow="md" width="225px">
                    <Flex alignItems="center">
                        <FontAwesomeIcon icon={faRobot} style={{ marginRight: '10px' }} color="white" />
                        <Text color="white">{botMessage}</Text>
                    </Flex>
                </Box>
            )}
        </div>
    );
};

export default ShipmentStatus;