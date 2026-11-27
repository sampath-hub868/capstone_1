# SkillLens: AI-Based Text Evaluation System

SkillLens is a browser-based capstone prototype for text-based mock interview evaluation and personalized skill-gap analysis. Candidates select a target role, answer a calibrated technical question, and receive a transparent score across six evaluation signals.

## Features

- Role pathways for Frontend Engineer, Backend Engineer, and Data Analyst
- Curated interview questions with role-specific concepts and reference signals
- Evaluation of relevance, technical depth, completeness, clarity, structure, and evidence
- Personalized strengths, skill gaps, and suggested study topics
- Local session history using browser localStorage
- Responsive interface for desktop and mobile
- SQLite question database served by a Flask API

## Run the project

Run the Flask server from the project folder:

```bash
python server.py
```

Then visit `http://localhost:8000`.

## Evaluation approach

The question bank is stored in `skilllens.db`, which is created and seeded automatically the first time `server.py` runs. The frontend requests questions from `/api/questions?role=frontend`; the API randomizes their order for each session. The current prototype uses a deterministic rubric so the behavior is explainable during a capstone demonstration. It tokenizes the answer, checks for expected keywords and concepts, and combines those signals with answer length, sentence structure, examples, and sequencing language.

For a production version, replace `evaluateAnswer` in `app.js` with a backend service that uses sentence embeddings for semantic similarity, add a persistent database for users and attempts, and connect an authenticated AI evaluation API. Keep the current rubric as a fallback and for transparent score explanations.

## Suggested future modules

1. Authentication and candidate profiles
2. Admin interface for question and reference-answer management
3. Backend API with PostgreSQL or MySQL
4. Sentence-transformer semantic similarity service
5. Exportable progress reports
6. Human-reviewed benchmark dataset for evaluating scoring quality
