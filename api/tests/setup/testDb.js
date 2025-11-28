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
    // Check if connection exists and is still open (readyState 1 = connected, 2 = connecting)
    if (mongoose.connection && mongoose.connection.readyState > 0 && mongoose.connection.readyState < 3) {
      try {
        await mongoose.connection.dropDatabase();
      } catch (dropErr) {
        // Ignore MongoClientClosedError and MongoError as they indicate connection issues during parallel test runs
        const isExpectedError = dropErr.name === 'MongoClientClosedError' || 
                               dropErr.name === 'MongoError' ||
                               (dropErr.message && dropErr.message.includes('client was closed'));
        if (!isExpectedError) {
          console.warn('Error while dropping test database:', dropErr && dropErr.message ? dropErr.message : dropErr);
        }
      }
      try {
        await mongoose.disconnect();
      } catch (disconnectErr) {
        // Ignore MongoClientClosedError and related errors as they mean connection already closed
        const isExpectedError = disconnectErr.name === 'MongoClientClosedError' ||
                               disconnectErr.name === 'MongoError' ||
                               (disconnectErr.message && disconnectErr.message.includes('client was closed'));
        if (!isExpectedError) {
          console.warn('Error while disconnecting mongoose:', disconnectErr && disconnectErr.message ? disconnectErr.message : disconnectErr);
        }
      }
    }
  } catch (error) {
    // Log the error for diagnostics but continue to ensure mongoServer is stopped.
    // Ignore MongoClientClosedError and related errors as they're expected in parallel test runs
    const isExpectedError = error.name === 'MongoClientClosedError' ||
                           error.name === 'MongoError' ||
                           (error.message && error.message.includes('client was closed'));
    if (!isExpectedError) {
      console.warn('Error while closing test DB connection:', error && error.message ? error.message : error);
    }
  } finally {
    if (mongoServer) {
      try {
        await mongoServer.stop();
      } catch (stopErr) {
        // If stopping the in-memory server fails, log and continue.
        // Only log if it's not a connection-related error
        const isExpectedError = stopErr.message && stopErr.message.includes('client was closed');
        if (!isExpectedError) {
          console.warn('Error while stopping mongoServer:', stopErr && stopErr.message ? stopErr.message : stopErr);
        }
      }
      mongoServer = null;
    }
    console.log('Test database closed');
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
