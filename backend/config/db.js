import mongoose from 'mongoose';

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime connection error:', err?.message || err);
});

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusconnect';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/campusconnect';

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Primary MongoDB Connection Error: ${error.message}`);

    if (primaryUri !== localFallbackUri) {
      console.log('🔄 Attempting connection to local MongoDB (mongodb://127.0.0.1:27017/campusconnect)...');
      try {
        const fallbackConn = await mongoose.connect(localFallbackUri);
        console.log(`✅ Fallback MongoDB Connected: ${fallbackConn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Fallback Local MongoDB Connection Error: ${fallbackError.message}`);
      }
    }

    console.warn('⚠️ Server running without database connection. Update MONGO_URI in .env or whitelist IP on MongoDB Atlas.');
  }
};

export default connectDB;
