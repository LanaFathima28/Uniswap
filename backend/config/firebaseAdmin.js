import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp = null;

try {
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const absolutePath = serviceAccountPath ? path.resolve(serviceAccountPath) : null;

    if (absolutePath && fs.existsSync(absolutePath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized with service account file.');
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      console.log('✅ Firebase Admin initialized with environment credentials.');
    } else {
      console.warn('⚠️ Warning: Firebase Admin credentials not found. Provide FIREBASE_SERVICE_ACCOUNT_PATH or env vars in backend/.env.');
    }
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
}

export default admin;
