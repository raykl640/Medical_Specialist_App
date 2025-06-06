const express = require('express');
const router = express.Router();
const specialistController = require('../controllers/specialist.controller');
const { isAdmin } = require('../middleware/auth.middleware');

// Get all specialists with optional filters
router.get('/', async (req, res) => {
  try {
    const result = await specialistController.getSpecialists(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specialist by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await specialistController.getSpecialistById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new specialist (Admin only)
router.post('/', async (req, res) => {
  try {
    const isAdminUser = await isAdmin(req.user.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await specialistController.addSpecialist(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specialist (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const isAdminUser = await isAdmin(req.user.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await specialistController.updateSpecialist(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specialist availability (Admin only)
router.put('/:id/availability', async (req, res) => {
  try {
    const isAdminUser = await isAdmin(req.user.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await specialistController.updateAvailability(
      req.params.id,
      req.body.availability
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete specialist (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const isAdminUser = await isAdmin(req.user.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const result = await specialistController.deleteSpecialist(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specialist availability for a specific date
router.get('/:id/availability/:date', async (req, res) => {
  try {
    const result = await specialistController.getAvailabilityForDate(
      req.params.id,
      req.params.date
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
