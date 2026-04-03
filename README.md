# Habit & Expense Tracker

A full-stack Habit & Expense Tracker that helps users build consistency, track spending, and analyze progress using interactive dashboards and charts.

##  Features

* Habit tracking with streak system
* Expense tracking with categories
* Analytics dashboard with charts
* Monthly progress tracking
* User authentication (JWT)

##  Tech Stack

* Frontend: HTML, CSS, JavaScript
* Backend: Node.js, Express
* Database: MongoDB Atlas

##  Installation

```bash
git clone https://github.com/naman2024a6r047/habit-tracker.git
cd habit-tracker/server
npm install
npm run dev
```

##  API Endpoints

### Auth

* POST /api/auth/signup
* POST /api/auth/login

### Habits

* GET /api/habits
* POST /api/habits

### Expenses

* GET /api/expenses
* POST /api/expenses

##  Project Structure

```
habit-tracker/
├── client/
├── server/
│   ├── models/
│   ├── routes/
│   ├── controllers/
```

##  Environment Variables

Create a .env file in server:

PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret

##  Future Improvements

* Push notifications
* AI-based habit suggestions
* Data export (CSV/PDF)

##  Author

Naman
GitHub: https://github.com/naman2024a6r047
