const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const databaseName = "marine_shipments";
const collectionName = "shipmentsData";

// Create a new MongoClient
const client = new MongoClient(uri);

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
    const collection = database.collection(collectionName); // Define the collection
    const insertData = Object.values(shipments);
    await collection.insertMany(insertData);
  } finally {
    await client.close();
  }
}



// Function to update or insert a shipment in the database
async function updateOrInsertShipment(container, newEta) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const filter = { container: container };
    const existingShipment = await collection.findOne(filter);

    if (existingShipment) {
      // If the shipment exists, update its ETA
      const updateDoc = { $set: { eta: newEta } };
      await collection.updateOne(filter, updateDoc);
    } else {
      // If the shipment does not exist, insert it as a new shipment
      await collection.insertOne({ container: container, eta: newEta });
    }
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

module.exports = {
  getShipments,
  isDatabaseEmpty,
  insertShipments,
  removeAllShipments, 
  updateOrInsertShipment,
};
