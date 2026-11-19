const express = require('express');
const matchesController = require('../controllers/matchesController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, matchesController.getMatches);
router.post('/recalculate', protect, matchesController.recalculateMatches);
router.get('/:userId/explain', protect, matchesController.explainMatch);

module.exports = router;
