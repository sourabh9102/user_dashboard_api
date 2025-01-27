const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const util = require("util");
const cors = require("cors");

// Initialize app and database connection
const app = express();
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "user_dashboard",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promisify the query method
pool.query = util.promisify(pool.query);

// Middleware
app.use(cors());
app.use(bodyParser.json());



app.post("/login", async (req, res) => {
  const { username } = req.body;
  try {
    const userRows = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    let user;
    if (userRows.length === 0) {
      const defaultLayout = [
        { id: "box-1", color: "red", order: 0 },
        { id: "box-2", color: "blue", order: 1 },
        { id: "box-3", color: "green", order: 2 },
        { id: "box-4", color: "yellow", order: 3 }
      ];

      const insertResult = await pool.query(
        "INSERT INTO users (username, layout) VALUES (?, ?)",
        [username, JSON.stringify(defaultLayout)] 
      );

      const newUserRows = await pool.query("SELECT * FROM users WHERE id = ?", [insertResult.insertId]);
      user = newUserRows[0];
    } else {
      user = userRows[0];  
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Get layout
app.get("/layout", async (req, res) => {
  const { username } = req.query;
  try {
    const rows = await pool.query("SELECT layout FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return res.status(404).send("User not found");

    const layout = JSON.parse(rows[0].layout).sort((a, b) => a.order - b.order);
    res.json(layout);
  } catch (err) {
    console.error("Error fetching layout:", err);
    res.status(500).send("Server error");
  }
});



// Update layout
app.post("/layout", async (req, res) => {
  const { username, layout } = req.body;
  try {
    await pool.query("UPDATE users SET layout = ? WHERE username = ?", [JSON.stringify(layout), username]);
    res.send("Layout updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));



