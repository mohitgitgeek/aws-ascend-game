#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const express = require('express');
const cors = require('cors');
const path = require('path');

class AWSAscendMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'aws-ascend-game',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.gameState = {
      phase: 0,
      score: 0,
      currentWorkshop: 0,
      quizIndex: 0,
      shuffledQuizzes: null
    };

    this.setupToolHandlers();
    this.setupExpressApp();
  }

  setupExpressApp() {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));

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

    // API Routes
    this.app.get('/api/game-state', (req, res) => res.json(this.gameState));
    
    this.app.post('/api/checkin', (req, res) => {
      if (this.gameState.phase === 0) {
        this.gameState.phase = 1;
        this.gameState.score += 10;
        res.json({ success: true, message: "Welcome to AWS Ascend! +10 points", gameState: this.gameState });
      } else {
        res.json({ success: false, message: "Already checked in" });
      }
    });

    this.app.post('/api/start-workshop', (req, res) => {
      if ((this.gameState.phase === 1 && this.gameState.currentWorkshop === 0) || (this.gameState.phase === 4 && this.gameState.currentWorkshop === 1)) {
        this.gameState.phase++;
        res.json({ success: true, message: `Started ${workshops[this.gameState.currentWorkshop].name}`, gameState: this.gameState });
      } else {
        res.json({ success: false, message: "Cannot start workshop now" });
      }
    });

    this.app.post('/api/complete-task', (req, res) => {
      if ((this.gameState.phase === 2 && this.gameState.currentWorkshop === 0) || (this.gameState.phase === 5 && this.gameState.currentWorkshop === 1)) {
        this.gameState.score += 5;
        this.gameState.phase++;
        res.json({ success: true, message: `Task completed! +5 points`, gameState: this.gameState });
      } else {
        res.json({ success: false, message: "No tasks available" });
      }
    });

    this.app.post('/api/submit-quiz', (req, res) => {
      const { answer } = req.body;
      if ((this.gameState.phase === 3 && this.gameState.currentWorkshop === 0) || (this.gameState.phase === 6 && this.gameState.currentWorkshop === 1)) {
        if (!this.gameState.quizIndex) this.gameState.quizIndex = 0;
        
        const quiz = this.gameState.shuffledQuizzes[this.gameState.currentWorkshop][this.gameState.quizIndex];
        const correct = answer === quiz.correct;
        this.gameState.score += correct ? 3 : -1;
        this.gameState.quizIndex++;
        
        if (this.gameState.quizIndex >= this.gameState.shuffledQuizzes[this.gameState.currentWorkshop].length) {
          this.gameState.quizIndex = 0;
          if (this.gameState.currentWorkshop === 0) {
            this.gameState.phase = 4;
            this.gameState.currentWorkshop = 1;
          } else {
            this.gameState.phase = 7;
          }
        }
        
        res.json({ 
          success: true, 
          correct, 
          message: correct ? "Correct! +3 points" : "Wrong! -1 point",
          gameState: this.gameState 
        });
      } else {
        res.json({ success: false, message: "No quizzes available" });
      }
    });

    this.app.post('/api/exit', (req, res) => {
      if (this.gameState.phase === 7) {
        this.gameState.score += 10;
        this.gameState.phase = 8;
        const won = this.gameState.score >= 50;
        res.json({ 
          success: true, 
          message: `Workshop completed! +10 points. Final Score: ${this.gameState.score}`,
          won,
          gameState: this.gameState 
        });
      } else {
        res.json({ success: false, message: "Cannot exit yet" });
      }
    });

    this.app.get('/api/current-task', (req, res) => {
      if ((this.gameState.phase === 2 && this.gameState.currentWorkshop === 0) || (this.gameState.phase === 5 && this.gameState.currentWorkshop === 1)) {
        res.json(tasks[this.gameState.currentWorkshop]);
      } else {
        res.json(null);
      }
    });

    this.app.get('/api/current-workshop', (req, res) => {
      if ((this.gameState.phase === 1 && this.gameState.currentWorkshop === 0) || (this.gameState.phase === 4 && this.gameState.currentWorkshop === 1)) {
        res.json(workshops[this.gameState.currentWorkshop]);
      } else {
        res.json(null);
      }
    });

    this.app.get('/api/current-quiz', (req, res) => {
      if ((this.gameState.phase === 3 && this.gameState.currentWorkshop === 0) || (this.gameState.phase === 6 && this.gameState.currentWorkshop === 1)) {
        if (!this.gameState.quizIndex) this.gameState.quizIndex = 0;
        if (!this.gameState.shuffledQuizzes) {
          this.gameState.shuffledQuizzes = quizzes.map(workshop => 
            [...workshop].sort(() => Math.random() - 0.5)
          );
        }
        const quiz = this.gameState.shuffledQuizzes[this.gameState.currentWorkshop][this.gameState.quizIndex];
        const progress = { current: this.gameState.quizIndex + 1, total: this.gameState.shuffledQuizzes[this.gameState.currentWorkshop].length };
        res.json({ ...quiz, progress });
      } else {
        res.json(null);
      }
    });

    this.app.post('/api/reset', (req, res) => {
      this.gameState = { phase: 0, score: 0, currentWorkshop: 0, quizIndex: 0, shuffledQuizzes: null };
      res.json({ success: true, gameState: this.gameState });
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'start_game_server',
          description: 'Start the AWS Ascend workshop game server',
          inputSchema: {
            type: 'object',
            properties: {
              port: {
                type: 'number',
                description: 'Port to run the server on',
                default: 3000
              }
            }
          }
        },
        {
          name: 'get_game_status',
          description: 'Get current game state and statistics',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'reset_game',
          description: 'Reset the game to initial state',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'start_game_server':
          const port = request.params.arguments?.port || 3000;
          return new Promise((resolve) => {
            this.app.listen(port, () => {
              resolve({
                content: [
                  {
                    type: 'text',
                    text: `🚀 AWS Ascend Workshop Game server started on http://localhost:${port}\n\nGame Features:\n- Interactive AWS workshop experience\n- 2 workshops: Data Lake & AWS Q CLI\n- Scoring system with 100 point maximum\n- Shuffled quiz questions\n- Beautiful Amazon-themed UI\n\nOpen the URL in your browser to start playing!`
                  }
                ]
              });
            });
          });

        case 'get_game_status':
          const phases = [
            'Check-in', 'Workshop 1: Data Lake', 'Task 1', 'Quiz 1',
            'Workshop 2: AWS Q CLI', 'Task 2', 'Quiz 2', 'Exit', 'Complete'
          ];
          return {
            content: [
              {
                type: 'text',
                text: `🎮 Current Game Status:\n- Phase: ${phases[this.gameState.phase] || 'Complete'}\n- Score: ${this.gameState.score}/100\n- Current Workshop: ${this.gameState.currentWorkshop + 1}\n- Quiz Progress: ${this.gameState.quizIndex}/5`
              }
            ]
          };

        case 'reset_game':
          this.gameState = { phase: 0, score: 0, currentWorkshop: 0, quizIndex: 0, shuffledQuizzes: null };
          return {
            content: [
              {
                type: 'text',
                text: '🔄 Game has been reset to initial state. Ready for a new workshop experience!'
              }
            ]
          };

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AWS Ascend MCP Server running on stdio');
  }
}

if (require.main === module) {
  const server = new AWSAscendMCPServer();
  server.run().catch(console.error);
}

module.exports = AWSAscendMCPServer;