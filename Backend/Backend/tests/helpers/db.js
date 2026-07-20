import mongoose from 'mongoose';

/**
 * Test database lifecycle. Preferred backend: an in-memory mongod from
 * mongodb-memory-server. If it cannot start (e.g. the binary can't be
 * downloaded), fall back to a locally running mongod using a dedicated
 * `ets_subscription_test` database that is dropped on teardown.
 *
 * The dev database (`ets`, from MONGO_URI) is deliberately never used here.
 */

const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/ets_subscription_test';

let mongod = null;
let usingLocalFallback = false;

export async function connectTestDb() {
  mongoose.set('strictQuery', true);

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
  } catch {
    mongod = null;
  }

  if (mongod) {
    await mongoose.connect(mongod.getUri('ets_subscription_test'));
  } else {
    usingLocalFallback = true;
    await mongoose.connect(LOCAL_FALLBACK_URI);
  }

  // Start from a clean slate even when a previous run crashed mid-way.
  await clearTestDb();
}

/** Delete all documents while keeping collections/indexes intact. */
export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    if (usingLocalFallback) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }

  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
