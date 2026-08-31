import admin from '../config/firebaseAdmin.js';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Unauthorized: Missing or malformed Authorization header'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Unauthorized: Bearer token empty'
      });
    }

    if (!admin.apps.length) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Unauthorized: Firebase Admin SDK is not configured on the backend'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach decoded user info to req.user
    req.user = {
      firebaseUID: decodedToken.uid,
      email: decodedToken.email,
      ...decodedToken
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error.message);
    return res.status(401).json({
      success: false,
      data: null,
      message: `Unauthorized: ${error.message || 'Invalid or expired token'}`
    });
  }
};

export default verifyFirebaseToken;
