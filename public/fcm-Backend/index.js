import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccount from '../js/serviceAccountKey.json' assert { type: 'json' };

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
