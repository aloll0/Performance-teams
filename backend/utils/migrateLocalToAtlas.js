const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const sourceUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/employee-performance';
const targetUri = process.env.MONGODB_URI;

if (!targetUri || !String(targetUri).trim()) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

async function migrateLocalToAtlas() {
  const sourceConn = await mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  const targetConn = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 10000 }).asPromise();

  try {
    const sourceCollections = await sourceConn.db.listCollections().toArray();
    const collections = sourceCollections
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith('system.'));

    if (collections.length === 0) {
      console.log('No collections found in local database.');
      return;
    }

    for (const name of collections) {
      const docs = await sourceConn.db.collection(name).find({}).toArray();
      const targetCollection = targetConn.db.collection(name);

      await targetCollection.deleteMany({});
      if (docs.length > 0) {
        await targetCollection.insertMany(docs, { ordered: false });
      }

      console.log(`Migrated ${docs.length} documents into collection: ${name}`);
    }

    console.log('Migration completed.');
  } finally {
    await Promise.allSettled([sourceConn.close(), targetConn.close()]);
  }
}

migrateLocalToAtlas().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
