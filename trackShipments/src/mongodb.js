const { MongoClient } = require("mongodb");

// Connection URI and database/collection names
const uri = "mongodb://localhost:27017";
const databaseName = "marine_shipments";
const collectionName = "shipmentsData";

// Create a new MongoClient
const client = new MongoClient(uri);

// Function to check if the database is empty
async function isDatabaseEmpty() {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const count = await collection.countDocuments();
    return count === 0;
  } finally {
    await client.close();
  }
}

// Function to insert shipments into the database
async function insertShipments(shipments) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const insertData = Object.values(shipments);
    await collection.insertMany(insertData);
  } finally {
    await client.close();
  }
}

// Function to update a shipment in the database
async function updateShipment(container, newEta) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const filter = { container: container };
    const updateDoc = { $set: { eta: newEta } };
    await collection.updateOne(filter, updateDoc);
  } finally {
    await client.close();
  }
}

// Function to retrieve shipments from the database
async function getShipments() {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const documents = await collection.find({}).toArray();
    return documents;
  } finally {
    await client.close();
  }
}

// Function to remove all shipments 
async function removeAllShipments() {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const result = await collection.deleteMany({});
    console.log(
      `Removed ${result.deletedCount} documents from the collection.`
    );
  } finally {
    await client.close();
  }
}

module.exports = {
  getShipments,
  isDatabaseEmpty,
  insertShipments,
  updateShipment,
};
