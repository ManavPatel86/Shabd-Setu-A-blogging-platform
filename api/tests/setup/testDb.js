import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectTestDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Test database connected');
  } catch (error) {
    console.error('Test DB connection error:', error);
    throw error;
  }
};

export const closeTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Test database closed');
  } catch (error) {
    // Silently ignore connection close errors in parallel test execution
    // This can happen when multiple test suites try to close the same connection
  }
};

export const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Test DB clear error:', error);
    throw error;
  }
};
