// Motivational quotes
export const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Row by row, we go far.", author: "Row Crew" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Champions are made when no one is watching.", author: "Unknown" },
  { text: "Every stroke counts. Every meter matters.", author: "Row Crew" },
  { text: "Sweat is just fat crying.", author: "Unknown" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
];

// Get a random quote
export const getRandomQuote = () => {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};
