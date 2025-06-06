const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuthorized } = require('../middleware/auth.middleware');

// Get user profile
router.get('/:uid/profile', async (req, res) => {
  try {
    const isAllowed = await isAuthorized(req.user.uid, req.params.uid);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await userController.getUserProfile(req.params.uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:uid/profile', async (req, res) => {
  try {
    const isAllowed = await isAuthorized(req.user.uid, req.params.uid);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await userController.updateUserProfile(req.params.uid, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add emergency contact
router.post('/:uid/emergency-contacts', async (req, res) => {
  try {
    const isAllowed = await isAuthorized(req.user.uid, req.params.uid);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await userController.addEmergencyContact(req.params.uid, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update emergency contact
router.put('/:uid/emergency-contacts/:contactId', async (req, res) => {
  try {
    const isAllowed = await isAuthorized(req.user.uid, req.params.uid);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await userController.updateEmergencyContact(
      req.params.uid, 
      req.params.contactId, 
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete emergency contact
router.delete('/:uid/emergency-contacts/:contactId', async (req, res) => {
  try {
    const isAllowed = await isAuthorized(req.user.uid, req.params.uid);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await userController.deleteEmergencyContact(
      req.params.uid, 
      req.params.contactId
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update allergies
router.put('/:uid/allergies', async (req, res) => {
  try {
    const isAllowed = await isAuthorized(req.user.uid, req.params.uid);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await userController.updateAllergies(req.params.uid, req.body.allergies);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
