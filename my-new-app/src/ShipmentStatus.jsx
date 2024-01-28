import React, { useEffect, useState } from 'react';
import { Heading, Table, Thead, Tbody, Tr, Th, Td, Box, Text, Drawer, DrawerContent, DrawerBody, DrawerOverlay, Button, Flex } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

const ShipmentStatus = () => {
    const [isBotActive, setIsBotActive] = useState(false);
    const [botMessage, setBotMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);

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

    // Define the new shipments data
    const shipments = {
        shipment1: {
            client: "Interandina",
            steamshipLine: "MSC",
            poNumber: "5023-165K",
            product: "wine",
            supplier: "Cargill",
            container: "CRSU6024460",
            eta: "2024-02-15",
            status: "In Transit",
        },
        shipment2: {
            client: "Diser",
            steamshipLine: "MSC",
            poNumber: "5023-162K",
            product: "wine",
            supplier: "Cargill",
            container: "GESU9357858",
            eta: "2024-02-15",
            status: "In Transit",
        },
        shipment3: {
            client: "Diser",
            steamshipLine: "Maersk",
            poNumber: "5023-161K",
            product: "wine",
            supplier: "Cargill",
            container: "SUDU6068809",
            eta: "2024-02-15",
            status: "In Transit",
        },
        shipment4: {
            client: "Interandina",
            poNumber: "5023-164K",
            product: "wine",
            steamshipLine: "Maersk",
            supplier: "Cargill",
            container: "MWCU5295851",
            eta: "2024-02-15",
            status: "In Transit",
        },
        shipment5: {
            client: "AW shipments",
            poNumber: "5023-147K",
            product: "wine",
            steamshipLine: "ONE",
            supplier: "JBS",
            container: "FSCU5886903",
            eta: "2024-02-15",
            status: "In Transit",
        },
        shipment6: {
            client: " poNumberllopez",
            poNumber: "5023-48K",
            product: "wine",
            steamshipLine: "ONE",
            supplier: "JBS",
            container: "SZLU9446927",
            eta: "2024-02-15",
            status: "In Transit",
        },
    };

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

            <Heading as="h1" size="xl" textAlign="center" my={6} width="100vw">
                Shipment Status
            </Heading>

            <Table variant="simple" width="100vw">
                <Thead>
                    <Tr>
                        <Th>PO Number</Th>
                        <Th>Client</Th>
                        <Th>Product</Th>
                        <Th>ETA</Th>
                        <Th>Status</Th>
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
                                <Td>{shipment.eta}</Td>
                                <Td>{shipment.status}</Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>

            {isBotActive && (
                <Box position="fixed" top="0px" right="20px" p="4" bg="white" borderRadius="md" boxShadow="md" width="225px">
                    <Flex alignItems="center"> 
                        <FontAwesomeIcon icon={faRobot} style={{ marginRight: '10px' }}/>
                        <Text>{botMessage}</Text>
                    </Flex>
                </Box>
            )}
        </div>
    );
};

export default ShipmentStatus;
