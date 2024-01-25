import React from 'react';
import { Heading, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

const ShipmentStatus = () => {
    const shipments = [
        { poNumber: '123', client: 'Client A', product: 'Product 1', eta: '2024-02-01' },
    ];

    return (
        <div>
            <Heading as="h1" size="xl" textAlign="center" my={6}>
                Shipment Status
            </Heading>

            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>PO Number</Th>
                        <Th>Client</Th>
                        <Th>Product</Th>
                        <Th>ETA</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {shipments.map((shipment, index) => (
                        <Tr key={index}>
                            <Td>{shipment.poNumber}</Td>
                            <Td>{shipment.client}</Td>
                            <Td>{shipment.product}</Td>
                            <Td>{shipment.eta}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </div>
    );
};

export default ShipmentStatus;
