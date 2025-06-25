const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messaging = admin.messaging();

// 🔔 Manual notification trigger
app.post('/send-notification', async (req, res) => {
  const { uid, title, body } = req.body;
  try {
    const tokenDoc = await db.collection('fcmTokens').doc(uid).get();
    if (!tokenDoc.exists) return res.status(404).send('Token not found.');

    const token = tokenDoc.data().token;

    await messaging.send({
      token,
      notification: { title, body }
    });

    res.status(200).send('Notification sent.');
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send('Failed to send notification.');
  }
});

// 🔄 Utility function to watch Firestore collections
function watchCollection(collectionName, title, formatBody) {
  db.collection(collectionName).onSnapshot(snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        const userId = data.patientId || data.userId;
        if (!userId) return;

        try {
          const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
          if (!tokenDoc.exists) return;

          const token = tokenDoc.data().token;

          await messaging.send({
            token,
            notification: {
              title,
              body: formatBody(data)
            }
          });

          console.log(`🔔 Sent ${title} notification to ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to notify ${userId}:`, error);
        }
      }
    });
  }, err => {
    console.error(`Error watching ${collectionName}:`, err);
  });
}

// 👀 Set up watchers
watchCollection('testLab', 'New Lab Test', data => `Lab test "${data.testName}" added.`);
watchCollection('medicalHistory', 'New Medical Record', () => `A new medical history record was added.`);
watchCollection('radiologyTests', 'Radiology Update', () => `New radiology test results are available.`);
watchCollection('medications', 'Medication Update', data => `New medication prescribed: ${data.name}.`);
watchCollection('appointments', 'Appointment Update', data => {
  const action = data.status || 'updated';
  return `Your appointment has been ${action}.`;
});

// 🔁 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server + Watchers running on port ${PORT}`));
