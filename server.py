from pathlib import Path
import json
import random
import sqlite3
from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).parent
DATABASE = BASE_DIR / "skilllens.db"
app = Flask(__name__, static_folder=None)

QUESTION_SEED = [
    ("frontend", "JavaScript fundamentals", "Explain the difference between event bubbling and event capturing. When would you use event delegation?", ["event bubbling", "event capturing", "event delegation", "parent", "child", "listener"], ["bubbling", "capturing", "delegation", "propagation"], "Review DOM event propagation and build a small event-delegation example."),
    ("frontend", "Web performance", "A product page feels slow on mobile. Walk through how you would diagnose and improve its performance.", ["lighthouse", "network", "bundle", "lazy loading", "image", "cache", "performance"], ["diagnose", "measure", "bundle", "lazy loading"], "Practice a Lighthouse audit and learn Core Web Vitals."),
    ("frontend", "Accessibility", "How would you make a custom modal accessible to keyboard and screen-reader users?", ["focus", "keyboard", "aria", "screen reader", "escape", "role", "dialog"], ["focus", "keyboard", "aria", "dialog"], "Study focus management and the WAI-ARIA dialog pattern."),
    ("backend", "API design", "What makes an API reliable and maintainable? Describe the design of a resource endpoint.", ["http", "status", "validation", "authentication", "versioning", "documentation", "error"], ["resource", "validation", "status", "versioning"], "Review REST constraints, HTTP status codes, and API versioning."),
    ("backend", "Data systems", "Explain database indexing and the trade-offs involved in adding an index to a frequently queried table.", ["index", "query", "read", "write", "storage", "b-tree", "performance"], ["index", "query", "read", "write"], "Use EXPLAIN on sample queries and compare indexed versus unindexed reads."),
    ("backend", "Distributed systems", "How would you design a background job system that can retry failed work without duplicating side effects?", ["queue", "retry", "idempotent", "worker", "dead letter", "timeout", "transaction"], ["queue", "retry", "idempotent", "worker"], "Learn idempotency keys, backoff strategies, and dead-letter queues."),
    ("data", "Analytical thinking", "A key business metric dropped 15% this month. How would you investigate the change?", ["segment", "trend", "data quality", "hypothesis", "compare", "funnel", "dashboard"], ["segment", "trend", "hypothesis", "data quality"], "Practice metric decomposition: validate, segment, compare, and communicate."),
    ("data", "SQL", "Explain how you would use a window function to find each customer’s first purchase and their running spend.", ["window", "partition", "order", "row_number", "sum", "over", "sql"], ["window", "partition", "order", "running"], "Work through ROW_NUMBER, SUM OVER, PARTITION BY, and ORDER BY."),
    ("data", "Communication", "How do you communicate an uncertain result to a non-technical stakeholder without losing trust?", ["confidence", "assumption", "uncertainty", "visual", "context", "decision", "clear"], ["confidence", "assumption", "uncertainty", "context"], "Study confidence intervals and practice writing a one-slide insight summary."),
]


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                category TEXT NOT NULL,
                text TEXT NOT NULL,
                keywords TEXT NOT NULL,
                concepts TEXT NOT NULL,
                recommendation TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        if connection.execute("SELECT COUNT(*) FROM questions").fetchone()[0] == 0:
            connection.executemany(
                "INSERT INTO questions (role, category, text, keywords, concepts, recommendation) VALUES (?, ?, ?, ?, ?, ?)",
                [(role, category, text, json.dumps(keywords), json.dumps(concepts), recommendation) for role, category, text, keywords, concepts, recommendation in QUESTION_SEED],
            )
        connection.commit()


def serialize_question(row):
    return {
        "id": row["id"],
        "category": row["category"],
        "text": row["text"],
        "keywords": json.loads(row["keywords"]),
        "concepts": json.loads(row["concepts"]),
        "recommendation": row["recommendation"],
    }


@app.get("/api/questions")
def questions():
    role = request.args.get("role", "frontend")
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM questions WHERE role = ?", (role,)).fetchall()
    random.shuffle(rows)
    return jsonify({"role": role, "questions": [serialize_question(row) for row in rows]})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "database": str(DATABASE.name)})


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


initialize_database()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
