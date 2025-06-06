const { admin } = require('../config/firebase');

const verifyAuth = async (req) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    throw new Error('No authentication token provided');
  }
  return await admin.auth().verifyIdToken(token);
};

const isAdmin = async (uid) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    return userDoc.exists && userDoc.data()?.userType === 'admin';
  } catch (error) {
    return false;
  }
};

const isAuthorized = async (uid, targetUserId) => {
  if (uid === targetUserId) return true;
  return await isAdmin(uid);
};

module.exports = {
  verifyAuth,
  isAdmin,
  isAuthorized
};
