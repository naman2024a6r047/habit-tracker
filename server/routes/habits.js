const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getHabits, createHabit, updateHabit, deleteHabit, toggleLog, getAnalytics
} = require('../controllers/habitController');

router.use(auth);

router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/toggle', toggleLog);
router.get('/analytics/summary', getAnalytics);

module.exports = router;