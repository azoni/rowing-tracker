# 🚣 Row Crew - Rowing Tracker

A mobile-friendly web app to track rowing progress with friends and race to row around the world together!

## Features

- 📸 **Photo Upload & OCR**: Take a photo of your rowing machine screen and automatically extract meters rowed using Tesseract.js
- 🤖 **Machine Recognition**: The app remembers your rowing machine after your first upload - no need to select your name each time
- 🏆 **Leaderboard**: See who's leading in total meters rowed
- 🔥 **Streak Tracking**: Track consecutive days rowed to stay motivated
- 📊 **Detailed Stats**: View average meters per session, sessions per week, and more
- 🌍 **Milestone System**: Unlock achievements as you collectively row distances equivalent to real-world landmarks
- 💾 **Local Storage**: All data is saved in your browser's local storage

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn

### Installation

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `build` folder that you can deploy to any static hosting service.

## How to Use

### First Time Upload
1. Go to the "Log Row" tab
2. Take a photo of your rowing machine display showing the meters rowed
3. The app will try to read the meters automatically using OCR
4. Enter your name to register your machine
5. Future uploads from the same machine will be automatically attributed to you!

### Manual Entry
If OCR doesn't work well with your machine, you can always use the manual entry option:
1. Select your name from the dropdown
2. Enter the meters rowed
3. Click "Add Entry"

### Viewing Progress
- **Board**: See the leaderboard and everyone's totals
- **Stats**: View detailed statistics per person
- **World Progress**: Track your collective progress toward rowing around the world (40,075 km!)

## Milestones

As your group rows more meters, you'll unlock milestones with fun comparisons:
- 🏃 1 km - 10 football fields
- 🌳 5 km - Across Central Park
- ✈️ 10 km - Height of a cruising airplane
- 🏃‍♂️ 21.1 km - Half Marathon
- 🏅 42.2 km - Full Marathon
- 🚢 100 km - Panama Canal
- 🗽 250 km - NYC to Washington DC
- 🌴 500 km - California coastline
- 🗼 1,000 km - Paris to Rome
- 🦘 2,500 km - Width of Australia
- ✈️ 5,000 km - New York to London
- 🌍 And more... up to rowing around the entire world!

## Tech Stack

- React 18 with Create React App
- Tesseract.js for OCR
- CSS3 with custom properties
- LocalStorage for data persistence

## Tips for Best OCR Results

- Take photos in good lighting
- Make sure the display is clearly visible
- Keep the camera steady
- The bigger the numbers appear in the photo, the better
- If OCR fails, use manual entry as a backup

## Hosting Suggestions

Since all data is stored locally, you can host this anywhere:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting

Note: If you want data to sync across devices/users, you'd need to add a backend database.

## License

MIT - Feel free to use and modify!
