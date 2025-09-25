const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let gameState = {
  phase: 0, // 0: checkin, 1: workshop1, 2: task1, 3: quiz1, 4: workshop2, 5: task2, 6: quiz2, 7: exit
  score: 0,
  currentWorkshop: 0
};

const workshops = [
  { name: "Building a Data Lake with AWS", points: 0 },
  { name: "Building an app with AWS Q CLI", points: 0 }
];

const tasks = [
  { 
    name: "Create S3 bucket and configure data ingestion pipeline", 
    workshop: 0, 
    points: 5,
    link: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html"
  },
  { 
    name: "Build CLI application using AWS Q Developer", 
    workshop: 1, 
    points: 5,
    link: "https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/getting-started.html"
  }
];

const quizzes = [
  [
    { question: "Which AWS service is the foundation of a data lake?", options: ["RDS", "S3", "DynamoDB"], correct: 1 },
    { question: "What format is commonly used for data lake analytics?", options: ["CSV only", "Parquet", "XML only"], correct: 1 },
    { question: "Which service helps catalog data in a data lake?", options: ["AWS Glue", "EC2", "Lambda"], correct: 0 },
    { question: "What is Amazon Athena used for?", options: ["Data storage", "Serverless SQL queries", "Load balancing"], correct: 1 },
    { question: "Which AWS service provides ETL capabilities?", options: ["S3", "AWS Glue", "CloudWatch"], correct: 1 }
  ],
  [
    { question: "What is AWS Q Developer primarily used for?", options: ["Database queries", "AI-powered coding assistance", "Load balancing"], correct: 1 },
    { question: "Which programming languages does AWS Q support?", options: ["Only Python", "Multiple languages", "Only JavaScript"], correct: 1 },
    { question: "AWS Q can help with which of the following?", options: ["Code generation", "Hardware setup", "Network routing"], correct: 0 },
    { question: "What type of AI model powers AWS Q Developer?", options: ["Rule-based system", "Large Language Model", "Decision tree"], correct: 1 },
    { question: "AWS Q Developer integrates with which IDEs?", options: ["Only VS Code", "Multiple IDEs", "Only IntelliJ"], correct: 1 }
  ]
];

app.get('/api/game-state', (req, res) => {
  res.json(gameState);
});

app.post('/api/checkin', (req, res) => {
  if (gameState.phase === 0) {
    gameState.phase = 1;
    gameState.score += 10;
    res.json({ success: true, message: "Welcome to AWS Ascend! +10 points", gameState });
  } else {
    res.json({ success: false, message: "Already checked in" });
  }
});

app.post('/api/start-workshop', (req, res) => {
  if ((gameState.phase === 1 && gameState.currentWorkshop === 0) || (gameState.phase === 4 && gameState.currentWorkshop === 1)) {
    gameState.phase++;
    res.json({ success: true, message: `Started ${workshops[gameState.currentWorkshop].name}`, gameState });
  } else {
    res.json({ success: false, message: "Cannot start workshop now" });
  }
});

app.post('/api/complete-task', (req, res) => {
  if ((gameState.phase === 2 && gameState.currentWorkshop === 0) || (gameState.phase === 5 && gameState.currentWorkshop === 1)) {
    gameState.score += 5;
    gameState.phase++;
    res.json({ success: true, message: `Task completed! +5 points`, gameState });
  } else {
    res.json({ success: false, message: "No tasks available" });
  }
});

app.post('/api/submit-quiz', (req, res) => {
  const { answer } = req.body;
  if ((gameState.phase === 3 && gameState.currentWorkshop === 0) || (gameState.phase === 6 && gameState.currentWorkshop === 1)) {
    if (!gameState.quizIndex) gameState.quizIndex = 0;
    
    const quiz = gameState.shuffledQuizzes[gameState.currentWorkshop][gameState.quizIndex];
    const correct = answer === quiz.correct;
    gameState.score += correct ? 3 : -1;
    gameState.quizIndex++;
    
    if (gameState.quizIndex >= gameState.shuffledQuizzes[gameState.currentWorkshop].length) {
      gameState.quizIndex = 0;
      if (gameState.currentWorkshop === 0) {
        gameState.phase = 4;
        gameState.currentWorkshop = 1;
      } else {
        gameState.phase = 7;
      }
    }
    
    res.json({ 
      success: true, 
      correct, 
      message: correct ? "Correct! +3 points" : "Wrong! -1 point",
      gameState 
    });
  } else {
    res.json({ success: false, message: "No quizzes available" });
  }
});

app.post('/api/exit', (req, res) => {
  if (gameState.phase === 7) {
    gameState.score += 10;
    gameState.phase = 8;
    const won = gameState.score >= 50; // 50% of max 100 points
    res.json({ 
      success: true, 
      message: `Workshop completed! +10 points. Final Score: ${gameState.score}`,
      won,
      gameState 
    });
  } else {
    res.json({ success: false, message: "Cannot exit yet" });
  }
});

app.get('/api/current-task', (req, res) => {
  if ((gameState.phase === 2 && gameState.currentWorkshop === 0) || (gameState.phase === 5 && gameState.currentWorkshop === 1)) {
    res.json(tasks[gameState.currentWorkshop]);
  } else {
    res.json(null);
  }
});

app.get('/api/current-workshop', (req, res) => {
  if ((gameState.phase === 1 && gameState.currentWorkshop === 0) || (gameState.phase === 4 && gameState.currentWorkshop === 1)) {
    res.json(workshops[gameState.currentWorkshop]);
  } else {
    res.json(null);
  }
});

app.get('/api/current-quiz', (req, res) => {
  if ((gameState.phase === 3 && gameState.currentWorkshop === 0) || (gameState.phase === 6 && gameState.currentWorkshop === 1)) {
    if (!gameState.quizIndex) gameState.quizIndex = 0;
    if (!gameState.shuffledQuizzes) {
      gameState.shuffledQuizzes = quizzes.map(workshop => 
        [...workshop].sort(() => Math.random() - 0.5)
      );
    }
    const quiz = gameState.shuffledQuizzes[gameState.currentWorkshop][gameState.quizIndex];
    const progress = { current: gameState.quizIndex + 1, total: gameState.shuffledQuizzes[gameState.currentWorkshop].length };
    res.json({ ...quiz, progress });
  } else {
    res.json(null);
  }
});

app.post('/api/reset', (req, res) => {
  gameState = { phase: 0, score: 0, currentWorkshop: 0, quizIndex: 0, shuffledQuizzes: null };
  res.json({ success: true, gameState });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`AWS Ascend Game running on http://localhost:${PORT}`);
});