# DevDojo

DevDojo is an AI-powered coding challenge platform designed to streamline the process of learning, solving, and evaluating real-world programming problems. It combines automated challenge generation, test case creation, submission evaluation, and leaderboard tracking through a modular architecture using FastAPI and React.

## Tech Stack

### Backend
- FastAPI 
- Elasticsearch
- AWS SNS (asynchronous event handling)
- Dify AI Agents 
- GitHub API integration


### Frontend
- React.js
- Tailwind CSS


## Features

- Automated challenge generation using Dify AI
- Structured problem breakdown and test case generation
- Submission evaluation via AI agents
- Group and user-level leaderboard management
- GitHub integration for creating private repositories


## Project Structure

```
/
├── backend/
│   ├── api/               # FastAPI route handlers
│   ├── manager/           # Business logic and orchestration
│   ├── models/            # Elasticsearch index definitions
│   ├── schemas/           # Pydantic request/response models
│   ├── services/          # GitHub, Dify agents, authentication
│   ├── utils/             # ES utilities, password helpers, etc.
│   ├── main.py            # FastAPI entrypoint
│   └── requirements.txt   # Backend dependencies
│
├── frontend/
│   ├── src/               # React components and pages
│   ├── public/            # Static files
│   ├── tailwind.config.js # Tailwind setup
│   └── package.json       # Frontend dependencies
│
└── README.md              # Project documentation
```

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Documentation

After starting the backend, visit:

```
http://localhost:8000/docs
```

This provides a full list of API endpoints and testable documentation using Swagger UI.

## Development Workflow

1. Group admin triggers challenge generation.
2. Backend calls Dify Agents for:
   - Challenge generation
   - Problem breakdown
   - Test case creation
3. A GitHub repo is created with starter files for each member of the group.
4. Members clone the repo, solve the problem, and push code.
5. Submissions are automatically evaluated using another Dify Agent.
6. Scores and feedback are stored in Elasticsearch and shown on the leaderboard.

## License

This project is under active development. Licensing details will be added in future releases.
