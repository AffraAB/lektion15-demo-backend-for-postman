const driver = require("better-sqlite3");
const db = driver("bands-albums-and-members.sqlite3");
const express = require("express");
const app = express();

app.use(express.json());

(() => {
  let statement = db.prepare(`
    SELECT name, type FROM sqlite_schema
    WHERE
      type IN ('table', 'view')
      AND name NOT LIKE 'sqlite_%'
  `);
  let tablesAndViews = statement.all();
  for (let { name, type } of tablesAndViews) {
    setupRoute(name, type);
    console.log("Routes: ", type, name);
  }
})();

function setupRoute(table, type) {
  // Get all items
  app.get("/api/" + table, (req, res) => {
    let statement = db.prepare(`
      SELECT * FROM ${table}
    `);
    let result = statement.all();
    res.json(result);
  });

  // Get one item
  app.get("/api/" + table + "/:id", (req, res) => {
    let searchId = req.params.id;
    let statement = db.prepare(`
      SELECT * FROM ${table} WHERE id = :searchId
    `);
    let result = statement.all({ searchId });
    res.json(result[0] || null);
  });

  // Only get-routes for the views, return here
  if (type === "view") { return; }

  // Create one item
  app.post("/api/" + table, (req, res) => {
    let statement = db.prepare(`
      INSERT INTO ${table} (${Object.keys(req.body).join(", ")})
      VALUES (${Object.keys(req.body)
        .map((x) => ":" + x)
        .join(", ")})
    `);
    let result;
    try {
      result = statement.run(req.body);
      res.status(201).json(result);
    } catch (error) {
      result = { error: error + "" };
      res.status(400).json(result);
    }
  });

  // Delete one item
  app.delete("/api/" + table + "/:id", (req, res) => {
    let statement = db.prepare(`
      DELETE FROM ${table}
      WHERE id = :idDelete
    `);
    let result = statement.run({
      idDelete: req.params.id,
    });
    res.json(result);
  });

  // Update one item
  app.put("/api/" + table + "/:id", (req, res) => {
    let result;
    try {
      let statement = db.prepare(`
        UPDATE ${table}
        SET ${Object.keys(req.body)
          .map((x) => x + " = :" + x)
          .join(", ")}
        WHERE id = :id
      `);
      result = statement.run({ ...req.body, id: req.params.id });
    } catch (error) {
      result = { error: error + "" };
    }
    res.json(result);
  });
}

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});