# Volleyball League Tracker

A React app for managing and tracking volleyball league matches with team management and standings.

## Features

- **Match Management**: Create and edit match scores with validation (first to 10, 11 at deuce)
- **Team Management**: Add and edit team names
- **Standings Table**: View current league standings with win-loss records and point differentials
- **Round Robin Scheduling**: Pre-configured 10-match round-robin schedule
- **Responsive Design**: Mobile-first design optimized for smaller screens

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Build for Production
```bash
npm build
```

## Usage

### Teams Tab
- View all 5 teams
- Click any team to edit the name
- Press Enter or click the checkmark to save

### Matches Tab
- View all 10 scheduled matches
- Click a match to enter scores
- Scores require: minimum 10 points to win, must be different, and 11 if both reach 10+
- Click "Clear" to reset a match result

### Standings Tab
- View teams ranked by wins
- See points for (PF), points against (PA), and point differential (+/-)
- Teams are sorted by wins first, then by point differential

## Project Structure

```
Volleyball/
├── src/
│   ├── App.jsx          # Main component
│   ├── main.jsx         # Entry point
│   └── index.css        # Styles with Tailwind
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── package.json         # Dependencies
```

## Technologies

- React 18
- Vite (build tool)
- Tailwind CSS (styling)
