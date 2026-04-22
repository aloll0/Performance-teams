const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found in environment or .env");
  process.exit(1);
}

async function run(options = {}) {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 8000,
    ...options
  });
  
  try {
    await client.connect();
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();
    
    for (const dbInfo of databases) {
      console.log(`Database: ${dbInfo.name}`);
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  Collection: ${col.name}, Count: ${count}`);
      }
    }
    return true;
  } catch (err) {
    console.error(`Connection failed with options ${JSON.stringify(options)}: ${err.message}`);
    return false;
  } finally {
    await client.close();
  }
}

async function main() {
  console.log("Attempting default connection...");
  let success = await run();
  if (success) {
    console.log("Default connection worked.");
  } else {
    console.log("Retrying with tlsAllowInvalidCertificates: true...");
    success = await run({ tlsAllowInvalidCertificates: true });
    if (success) {
      console.log("Connection with tlsAllowInvalidCertificates: true worked.");
    } else {
      console.log("All connection attempts failed.");
    }
  }
}

main().catch(console.error);
