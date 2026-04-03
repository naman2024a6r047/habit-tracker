const Expense = require('../models/Expense');

exports.getExpenses = async (req, res) => {
  try {
    const { filter, category, startDate, endDate } = req.query;
    const query = { user: req.userId };

    const today = new Date().toISOString().split('T')[0];

    if (filter === 'today') {
      query.date = today;
    } else if (filter === 'week') {
      const d = new Date();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      query.date = { $gte: monday.toISOString().split('T')[0], $lte: today };
    } else if (filter === 'month') {
      const d = new Date();
      const first = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      query.date = { $gte: first, $lte: today };
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (category && category !== 'All') query.category = category;

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ expenses, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, note, date } = req.body;
    if (!title || !amount || !category || !date)
      return res.status(400).json({ error: 'Title, amount, category, and date are required' });

    const intAmount = Math.round(Number(amount));
    if (isNaN(intAmount) || intAmount < 1)
      return res.status(400).json({ error: 'Amount must be a positive integer' });

    const expense = await Expense.create({ user: req.userId, title, amount: intAmount, category, note, date });
    res.status(201).json({ expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const { title, amount, category, note, date } = req.body;
    if (title) expense.title = title;
    if (amount) expense.amount = Math.round(Number(amount));
    if (category) expense.category = category;
    if (note !== undefined) expense.note = note;
    if (date) expense.date = date;

    await expense.save();
    res.json({ expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Month
    const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    const [weekExpenses, monthExpenses] = await Promise.all([
      Expense.find({ user: req.userId, date: { $gte: weekStartStr, $lte: todayStr } }),
      Expense.find({ user: req.userId, date: { $gte: monthStartStr, $lte: todayStr } })
    ]);

    const categoryTotals = {};
    monthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    // Daily trend for week (Mon-Sun)
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const dailyTrend = weekDates.map(d => ({
      date: d,
      total: weekExpenses.filter(e => e.date === d).reduce((s, e) => s + e.amount, 0)
    }));

    res.json({
      weekTotal: weekExpenses.reduce((s, e) => s + e.amount, 0),
      monthTotal: monthExpenses.reduce((s, e) => s + e.amount, 0),
      categoryTotals,
      dailyTrend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};