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

    const handleDrawerOpen = () => {
        setIsOpen(true);
    };

    const handleDrawerClose = () => {
        setIsOpen(false);
    };

    const shipments = [
        { poNumber: 'PO-00123', client: 'Acme Corp', product: 'Widgets', eta: '2024-03-15', status: 'In Transit' },
        { poNumber: 'PO-00124', client: 'Globex Inc', product: 'Gadgets', eta: '2024-03-20', status: 'Action Needed' },
        { poNumber: 'PO-00125', client: 'Soylent Corp', product: 'Widgets', eta: '2024-03-22', status: 'Delayed' },
        { poNumber: 'PO-00126', client: 'Initech', product: 'Machinery', eta: '2024-03-25', status: 'On Schedule' },
        { poNumber: 'PO-00127', client: 'Umbrella Corp', product: 'Medical Supplies', eta: '2024-03-30', status: 'Action Needed' },
        { poNumber: 'PO-00128', client: 'Wayne Enterprises', product: 'Electronics', eta: '2024-04-05', status: 'In Transit' },
        { poNumber: 'PO-00129', client: 'Virtucon', product: 'Construction Materials', eta: '2024-04-10', status: 'Delayed' },
        { poNumber: 'PO-00130', client: 'Hooli', product: 'Software Licenses', eta: '2024-04-15', status: 'Delivered' },
    ];
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
                    {shipments.map((shipment, index) => (
                        <Tr key={index}>
                            <Td>{shipment.poNumber}</Td>
                            <Td>{shipment.client}</Td>
                            <Td>{shipment.product}</Td>
                            <Td>{shipment.eta}</Td>
                            <Td>{shipment.status}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            {isBotActive && (
               <Box position="fixed" top="20px" right="20px" p="4" bg="white" borderRadius="md" boxShadow="md" width="225px">
               <Flex alignItems="center"> 
                   <FontAwesomeIcon icon={faRobot} style={{ marginRight: '10px' }}/>
                   <Text>{botMessage}</Text>
               </Flex>
               {hasActionNeededOrders && (
                   <Button onClick={handleDrawerOpen} mt="2">Review Orders</Button>
               )}
           </Box>
            )}
        </div>
    );
};

export default ShipmentStatus;
