const Habit = require('../models/Habit');

// Streak recalculation
function recalcStreak(logs, days) {
  const sorted = logs
    .filter(l => l.completed)
    .map(l => l.date)
    .sort((a, b) => (a > b ? -1 : 1));

  if (!sorted.length) return { current: 0, longest: 0 };

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prev = null;

  const today = new Date().toISOString().split('T')[0];

  for (const d of sorted) {
    if (!prev) {
      streak = 1;
    } else {
      const diff = (new Date(prev) - new Date(d)) / 86400000;
      if (diff === 1) {
        streak++;
      } else {
        if (streak > longest) longest = streak;
        streak = 1;
      }
    }
    prev = d;
  }
  if (streak > longest) longest = streak;

  // Current streak: check from today backwards
  let curDate = new Date(today);
  current = 0;
  while (true) {
    const ds = curDate.toISOString().split('T')[0];
    const dayOfWeek = curDate.getDay();
    const isScheduled = days.length === 0 || days.includes(dayOfWeek);
    const log = logs.find(l => l.date === ds);

    if (isScheduled) {
      if (log && log.completed) {
        current++;
      } else if (ds < today) {
        break;
      }
    }
    curDate.setDate(curDate.getDate() - 1);
    if (current > 365) break; // safety
  }

  return { current, longest };
}

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.userId, active: true }).sort({ createdAt: 1 });
    res.json({ habits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createHabit = async (req, res) => {
  try {
    const { name, icon, color, days } = req.body;
    if (!name) return res.status(400).json({ error: 'Habit name is required' });
    const habit = await Habit.create({ user: req.userId, name, icon, color, days: days || [] });
    res.status(201).json({ habit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    const { name, icon, color, days } = req.body;
    if (name) habit.name = name;
    if (icon) habit.icon = icon;
    if (color) habit.color = color;
    if (days) habit.days = days;
    await habit.save();
    res.json({ habit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    habit.active = false;
    await habit.save();
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleLog = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });

    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const existing = habit.logs.find(l => l.date === date);
    if (existing) {
      existing.completed = !existing.completed;
    } else {
      habit.logs.push({ date, completed: true });
    }

    const { current, longest } = recalcStreak(habit.logs, habit.days);
    habit.currentStreak = current;
    habit.longestStreak = Math.max(longest, habit.longestStreak);

    await habit.save();
    res.json({ habit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.userId, active: true });
    const today = new Date();

    // Weekly (Mon-Sun)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    // Monthly
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthDates = [];
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      monthDates.push(d.toISOString().split('T')[0]);
    }

    const analytics = habits.map(habit => {
      const weekCompleted = weekDates.filter(d => habit.logs.find(l => l.date === d && l.completed)).length;
      const weekScheduled = weekDates.filter(d => habit.days.length === 0 || habit.days.includes(new Date(d).getDay())).length;

      const monthCompleted = monthDates.filter(d => habit.logs.find(l => l.date === d && l.completed)).length;
      const monthScheduled = monthDates.filter(d => habit.days.length === 0 || habit.days.includes(new Date(d).getDay())).length;

      // Best day
      const dayCount = [0, 0, 0, 0, 0, 0, 0];
      habit.logs.filter(l => l.completed).forEach(l => {
        dayCount[new Date(l.date).getDay()]++;
      });
      const bestDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayCount.indexOf(Math.max(...dayCount))];

      return {
        id: habit._id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
        weeklyCompletion: weekScheduled ? Math.round((weekCompleted / weekScheduled) * 100) : 0,
        monthlyCompletion: monthScheduled ? Math.round((monthCompleted / monthScheduled) * 100) : 0,
        bestDay,
        totalCompleted: habit.logs.filter(l => l.completed).length
      };
    });

    analytics.sort((a, b) => b.monthlyCompletion - a.monthlyCompletion);
    res.json({ analytics, weekDates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};