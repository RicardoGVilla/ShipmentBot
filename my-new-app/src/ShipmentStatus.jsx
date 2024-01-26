import React from 'react';
import { Heading, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, Button } from '@chakra-ui/react';


const ShipmentStatus = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();

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
            <Button onClick={onOpen} colorScheme="blue" mb={4} placement="right" >Review Orders</Button>
            <Drawer isOpen={isOpen} placement="right" onClose={onClose} width="100vw">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Order Notification</DrawerHeader>
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
        </div>
    );
};

export default ShipmentStatus;
