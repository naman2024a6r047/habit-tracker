const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getExpenses, createExpense, updateExpense, deleteExpense, getAnalytics
} = require('../controllers/expenseController');

router.use(auth);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/analytics/summary', getAnalytics);

module.exports = router;