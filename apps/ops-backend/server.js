import { WebClient } from "@slack/web-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import path from "path";
import { Pool } from "pg";
import redis from "redis";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Prevent server execution during build time (only when building, not when serving)
if (process.env.NX_TASK_TARGET_PROJECT && process.env.NX_TASK_TARGET_TARGET === 'build') {
  console.log('Skipping server initialization during build process');
  process.exit(0);
}

// Redis Cache implementation
class RedisCache {
  constructor(redisClient) {
    this.client = redisClient;
    this.CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
  }

  generateKey(endpoint, params) {
    const sortedParams = Object.entries(params)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");
    return `ops-backend:${endpoint}:${sortedParams}`;
  }

  async set(endpoint, params, data) {
    try {
      const key = this.generateKey(endpoint, params);
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
      });
      await this.client.setEx(key, this.CACHE_TTL, serializedData);
      console.log(`[Redis Cache] Set key: ${key}`);
    } catch (error) {
      console.error('[Redis Cache] Error setting cache:', error);
    }
  }

  async get(endpoint, params) {
    try {
      const key = this.generateKey(endpoint, params);
      const cached = await this.client.get(key);

      if (!cached) {
        console.log(`[Redis Cache] Miss for ${endpoint}`);
        return null;
      }

      const parsed = JSON.parse(cached);
      console.log(`[Redis Cache] Hit for ${endpoint}`);
      return parsed.data;
    } catch (error) {
      console.error('[Redis Cache] Error getting cache:', error);
      return null;
    }
  }


  async clear() {
    try {
      const keys = await this.client.keys('ops-backend:*');
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`[Redis Cache] Cleared ${keys.length} keys`);
      }
    } catch (error) {
      console.error('[Redis Cache] Error clearing cache:', error);
    }
  }

  // Helper to wrap API handlers with caching
  async withCache(endpoint, params, fetchDataFn, skipCache = false) {
    if (skipCache) {
      console.log(`[Redis Cache] Skipped for ${endpoint} (manual override)`);
      const data = await fetchDataFn();
      // Update cache with new data even when skipping
      await this.set(endpoint, params, data);
      return data;
    }

    const cached = await this.get(endpoint, params);
    if (cached) {
      return cached;
    }

    console.log(`[Redis Cache] Miss for ${endpoint}, fetching data. and deploy`);
    const data = await fetchDataFn();
    await this.set(endpoint, params, data);
    return data;
  }
}

// Initialize Redis client
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_URL}`,
});

// Redis connection event handlers
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

// Connect to Redis
await redisClient.connect();

// Initialize Redis cache
const cache = new RedisCache(redisClient);

// Verify environment variables
const requiredEnvVars = ["DB_HOST_READ", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

const app = express();

// Manual CORS handling - no cors middleware
app.use((req, res, next) => {
  console.log(
    `${req.method} request to ${req.path} from origin:`,
    req.headers.origin
  );

  // Set CORS headers for all requests
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    console.log("OPTIONS preflight request - returning 200");
    return res.status(200).end();
  }

  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size (Slack limit)
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

// DB pool configuration
const pool = new Pool({
  host: process.env.DB_HOST_READ,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
    sslmode: "require",
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 10000 to 30000
});

// Add analytics pool configuration
const analyticsPool = new Pool({
  connectionString: process.env.ANALYTICS_DB_URL,
  ssl: {
    rejectUnauthorized: false,
    sslmode: "require",
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 10000 to 30000
});

// NOTE: Tables (review_action_items, review_action_item_comments, review_reactions)
// are created via migrations/001_create_tables.sql — run that directly against the database.

// ============ NATURAL LANGUAGE QUERY HELPERS ============

// NL Query config
const NL_QUERY_API_KEY = process.env.NL_QUERY_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
const NL_QUERY_MODEL = process.env.NL_QUERY_MODEL || "anthropic/claude-sonnet-4.5";
const NL_QUERY_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";

// Schema introspection with in-memory cache (1 hour TTL)
// Two-level cache: table list (for step 1) and full schema (for step 2)
let cachedSchema = null;
let cachedTableList = null;
let schemaCacheTime = 0;
const SCHEMA_CACHE_TTL = 3600000; // 1 hour

// Property locations cache for cross-property blocking
let cachedPropertyLocations = null; // Map<locationLowercase, fullPropertyName>
let propertyLocationsCacheTime = 0;

async function getPropertyLocations() {
  if (cachedPropertyLocations && Date.now() - propertyLocationsCacheTime < SCHEMA_CACHE_TTL) {
    return cachedPropertyLocations;
  }
  try {
    const result = await analyticsPool.query("SELECT DISTINCT name FROM zostel_core_operator WHERE name IS NOT NULL AND name != ''");
    const locations = new Map();
    for (const row of result.rows) {
      const name = row.name;
      // Extract location part (strip "Zostel"/"Zostel Plus"/"Zostel Homes"/"Zo House" prefix)
      const location = name.replace(/^(zostel|zostel\s+plus|zostel\s+homes|zo\s+house)\s+/i, "").trim().toLowerCase();
      if (location.length > 2) {
        locations.set(location, name);
        // Also index the first word (e.g., "panchgani" from "plus panchgani")
        const firstWord = location.replace(/^(plus|homes)\s+/i, "").split(/[\s(]/)[0].trim();
        if (firstWord.length > 2 && !locations.has(firstWord)) {
          locations.set(firstWord, name);
        }
      }
    }
    cachedPropertyLocations = locations;
    propertyLocationsCacheTime = Date.now();
    console.log(`[NL Query] Property locations cached: ${locations.size} entries`);
    return locations;
  } catch (err) {
    console.error("[NL Query] Failed to load property locations:", err.message);
    return new Map();
  }
}

async function getAnalyticsSchema() {
  if (cachedSchema && cachedTableList && Date.now() - schemaCacheTime < SCHEMA_CACHE_TTL) {
    return { schema: cachedSchema, tableList: cachedTableList };
  }

  console.log("[NL Query] Introspecting analytics DB schema...");
  // Query both regular tables/views AND materialized views (matviews are NOT in information_schema)
  const result = await analyticsPool.query(`
    (
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
    )
    UNION ALL
    (
      SELECT
        c.relname AS table_name,
        a.attname AS column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
      WHERE c.relkind = 'm'
        AND n.nspname = 'public'
        AND a.attnum > 0
        AND NOT a.attisdropped
    )
    ORDER BY table_name, column_name
  `);

  const schema = {};
  for (const row of result.rows) {
    if (!schema[row.table_name]) schema[row.table_name] = [];
    schema[row.table_name].push({ column: row.column_name, type: row.data_type });
  }

  // Build table list string (just table names with column count) for step 1
  const tableList = Object.entries(schema)
    .map(([table, cols]) => `${table} (${cols.length} columns)`)
    .join("\n");

  cachedSchema = schema;
  cachedTableList = tableList;
  schemaCacheTime = Date.now();
  console.log(`[NL Query] Schema cached: ${Object.keys(schema).length} tables`);
  return { schema, tableList };
}

// Build detailed schema string for selected tables only
// Columns with uppercase/spaces need double-quoting in PostgreSQL
function getSchemaForTables(schema, tableNames) {
  let schemaString = "";
  for (const table of tableNames) {
    const columns = schema[table.toLowerCase()]; // normalize to lowercase (PG info_schema returns lowercase)
    if (columns) {
      const cols = columns.map(c => {
        // If column name has uppercase letters, spaces, or special chars, show it quoted
        const needsQuote = c.column !== c.column.toLowerCase() || /[^a-z0-9_]/.test(c.column);
        const colName = needsQuote ? `"${c.column}"` : c.column;
        return `${colName} (${c.type})`;
      }).join(", ");
      schemaString += `${table}: ${cols}\n`;
    }
  }
  return schemaString;
}

// Fetch sample rows from selected tables so LLM sees real data values
async function getSampleData(tableNames) {
  const samples = {};
  const samplePromises = tableNames.map(async (table) => {
    try {
      // Use a safe identifier — only allow alphanumeric and underscore
      if (!/^[a-z0-9_]+$/i.test(table)) return;
      const result = await analyticsPool.query({
        text: `SELECT * FROM "${table}" LIMIT 2`,
        timeout: 5000,
      });
      if (result.rows.length > 0) {
        samples[table] = result.rows;
      }
    } catch (err) {
      // Skip tables that fail (permissions, etc.)
      console.log(`[NL Query] Sample failed for ${table}: ${err.message}`);
    }
  });
  await Promise.all(samplePromises);
  return samples;
}

// Format sample data as compact string for prompt
function formatSampleData(samples) {
  let str = "";
  for (const [table, rows] of Object.entries(samples)) {
    str += `\nSAMPLE DATA from ${table}:\n`;
    for (const row of rows) {
      const vals = Object.entries(row)
        .map(([k, v]) => {
          // Truncate long values
          const val = v === null ? "NULL" : String(v).substring(0, 80);
          // Quote column names that need it in PG (uppercase, spaces, special chars)
          const needsQuote = k !== k.toLowerCase() || /[^a-z0-9_]/.test(k);
          const colName = needsQuote ? `"${k}"` : k;
          return `${colName}=${val}`;
        })
        .join(", ");
      str += `  ${vals}\n`;
    }
  }
  return str;
}

// Call LLM via OpenRouter (reusable helper)
async function callLLM(prompt, maxTokens = 2000) {
  const response = await axios.post(
    NL_QUERY_API_URL,
    {
      messages: [{ role: "user", content: prompt }],
      model: NL_QUERY_MODEL,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${NL_QUERY_API_KEY}`,
        "HTTP-Referer": "https://zostel.com",
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );
  return response.data?.choices?.[0]?.message?.content || "";
}

// SQL safety validator — only allows SELECT queries
function validateAndSanitizeSQL(rawSql) {
  if (!rawSql || typeof rawSql !== "string") {
    return { valid: false, sql: null, error: "No SQL generated" };
  }

  // Strip markdown code fences
  let sql = rawSql.trim();
  sql = sql.replace(/^```(?:sql)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Remove trailing semicolons
  sql = sql.replace(/;\s*$/, "").trim();

  // Check for multiple statements
  if (sql.includes(";")) {
    return { valid: false, sql: null, error: "Multiple statements are not allowed." };
  }

  // Check it starts with SELECT or WITH (CTEs)
  const firstWord = sql.split(/\s+/)[0].toUpperCase();
  if (firstWord !== "SELECT" && firstWord !== "WITH") {
    return { valid: false, sql: null, error: "unsafe_query" };
  }

  // Block dangerous keywords anywhere in the query
  const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE|EXEC|COPY|VACUUM|CLUSTER)\b/i;
  if (blocked.test(sql)) {
    return { valid: false, sql: null, error: "unsafe_query" };
  }

  // Auto-append LIMIT if missing
  if (!/\bLIMIT\b/i.test(sql)) {
    sql += " LIMIT 500";
  }

  return { valid: true, sql, error: null };
}

// Property access filter — wraps query for non-admin users
function applyPropertyFilter(sql, properties, isAdmin) {
  if (isAdmin || !properties || properties.length === 0) {
    return sql;
  }

  // Escape single quotes in property names and build IN clause
  const escaped = properties.map(p => `'${p.replace(/'/g, "''")}'`).join(", ");
  return `SELECT * FROM (${sql}) AS _filtered_q WHERE operator_name IN (${escaped})`;
}

// Map PG errors to human-friendly messages
function humanizeQueryError(error, context) {
  if (context === "empty_question") {
    return "Please type a question to ask your data.";
  }
  if (context === "llm_timeout") {
    return "The AI took too long to respond. Try a simpler question.";
  }
  if (context === "llm_failure") {
    return "Couldn't understand that question. Try rephrasing it.";
  }
  if (context === "unsafe_query") {
    return "That question would require changes to the database, which isn't allowed. Try asking for data instead.";
  }
  if (context === "no_sql") {
    return "Couldn't generate a query from that question. Try being more specific.";
  }

  // PG error codes
  const code = error?.code;
  const msg = error?.message || "";

  if (code === "42601" || msg.includes("syntax error")) {
    return "The generated query had a syntax issue. Try rephrasing your question.";
  }
  if (code === "42P01" || msg.includes("does not exist")) {
    return "Couldn't find the right table for that question. Try being more specific about what data you need.";
  }
  if (code === "42703" || msg.includes("column")) {
    return "One of the data fields in the query doesn't exist. Try rephrasing.";
  }
  if (code === "57014" || msg.includes("timeout") || msg.includes("canceling statement")) {
    return "The query took too long. Try narrowing your question (e.g., add a date range or specific property).";
  }
  return "Something went wrong running the query. Try a different question.";
}

// ============ ACTION ITEMS CRUD ============

// GET — list action items for a property
app.get("/api/analytics/action-items", async (req, res) => {
  const { propertyName } = req.query;
  if (!propertyName) {
    return res.status(400).json({ success: false, error: "propertyName is required" });
  }

  try {
    let itemsResult;
    try {
      itemsResult = await analyticsPool.query(
        `SELECT * FROM review_action_items WHERE property_name = $1 ORDER BY
          CASE status
            WHEN 'to_acknowledge' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'in_progress' THEN 3
            WHEN 'done' THEN 4
          END,
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            WHEN 'none' THEN 5
          END,
          due_date ASC NULLS LAST,
          created_at DESC`,
        [propertyName]
      );
    } catch (sortErr) {
      // Fallback if priority/due_date columns don't exist yet
      itemsResult = await analyticsPool.query(
        `SELECT * FROM review_action_items WHERE property_name = $1 ORDER BY
          CASE status
            WHEN 'to_acknowledge' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'in_progress' THEN 3
            WHEN 'done' THEN 4
          END,
          created_at DESC`,
        [propertyName]
      );
    }

    // Fetch comments for all items
    const itemIds = itemsResult.rows.map((r) => r.id);
    let comments = [];
    if (itemIds.length > 0) {
      const commentsResult = await analyticsPool.query(
        `SELECT * FROM review_action_item_comments WHERE action_item_id = ANY($1) ORDER BY created_at ASC`,
        [itemIds]
      );
      comments = commentsResult.rows;
    }

    // Group comments by action_item_id
    const commentsByItem = {};
    comments.forEach((c) => {
      if (!commentsByItem[c.action_item_id]) commentsByItem[c.action_item_id] = [];
      commentsByItem[c.action_item_id].push(c);
    });

    const items = itemsResult.rows.map((item) => ({
      ...item,
      comments: commentsByItem[item.id] || [],
    }));

    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching action items:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST — create a new action item
app.post("/api/analytics/action-items", async (req, res) => {
  const {
    propertyName, category, action, source, createdBy,
    priority, assignee, assigneeId, dueDate,
    quotedReviewId, quotedReviewComment, quotedReviewRating,
    quotedReviewGuest, quotedReviewDate, quotedInventoryName,
  } = req.body;

  if (!propertyName || !action) {
    return res.status(400).json({ success: false, error: "propertyName and action are required" });
  }

  try {
    // Try with new columns first (priority, assignee, due_date)
    let result;
    try {
      result = await analyticsPool.query(
        `INSERT INTO review_action_items
          (property_name, category, action, source, created_by,
           priority, assignee, assignee_id, due_date,
           quoted_review_id, quoted_review_comment, quoted_review_rating,
           quoted_review_guest, quoted_review_date, quoted_inventory_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          propertyName,
          category || "General",
          action,
          source || "manual",
          createdBy || "Unknown",
          priority || "medium",
          assignee || null,
          assigneeId || null,
          dueDate || null,
          quotedReviewId || null,
          quotedReviewComment || null,
          quotedReviewRating || null,
          quotedReviewGuest || null,
          quotedReviewDate || null,
          quotedInventoryName || null,
        ]
      );
    } catch (colError) {
      // Fallback: columns might not exist yet — use original column set
      console.warn("[WARN] Falling back to legacy INSERT (new columns may not exist yet):", colError.message);
      result = await analyticsPool.query(
        `INSERT INTO review_action_items
          (property_name, category, action, source, created_by,
           quoted_review_id, quoted_review_comment, quoted_review_rating,
           quoted_review_guest, quoted_review_date, quoted_inventory_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          propertyName,
          category || "General",
          action,
          source || "manual",
          createdBy || "Unknown",
          quotedReviewId || null,
          quotedReviewComment || null,
          quotedReviewRating || null,
          quotedReviewGuest || null,
          quotedReviewDate || null,
          quotedInventoryName || null,
        ]
      );
    }

    res.json({ success: true, data: { ...result.rows[0], comments: [] } });
  } catch (error) {
    console.error("Error creating action item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH — update action item (status, priority, assignee, dueDate, action, category)
app.patch("/api/analytics/action-items/:id", async (req, res) => {
  const { id } = req.params;
  const { status, updatedBy, priority, assignee, assigneeId, dueDate, action, category } = req.body;

  const validStatuses = ["to_acknowledge", "pending", "in_progress", "done"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  const validPriorities = ["urgent", "high", "medium", "low", "none"];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ success: false, error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` });
  }

  try {
    // Build dynamic SET clause
    const setClauses = ["updated_at = NOW()"];
    const values = [];
    let paramIdx = 1;

    if (status !== undefined) { setClauses.push(`status = $${paramIdx}`); values.push(status); paramIdx++; }
    if (priority !== undefined) { setClauses.push(`priority = $${paramIdx}`); values.push(priority); paramIdx++; }
    if (assignee !== undefined) { setClauses.push(`assignee = $${paramIdx}`); values.push(assignee || null); paramIdx++; }
    if (assigneeId !== undefined) { setClauses.push(`assignee_id = $${paramIdx}`); values.push(assigneeId || null); paramIdx++; }
    if (dueDate !== undefined) { setClauses.push(`due_date = $${paramIdx}`); values.push(dueDate || null); paramIdx++; }
    if (action !== undefined) { setClauses.push(`action = $${paramIdx}`); values.push(action); paramIdx++; }
    if (category !== undefined) { setClauses.push(`category = $${paramIdx}`); values.push(category); paramIdx++; }

    values.push(id);
    let result;
    try {
      result = await analyticsPool.query(
        `UPDATE review_action_items SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
        values
      );
    } catch (colErr) {
      // Fallback: new columns may not exist, retry with only status + updated_at
      console.warn("[WARN] PATCH fallback — new columns may not exist:", colErr.message);
      if (status !== undefined) {
        result = await analyticsPool.query(
          `UPDATE review_action_items SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
          [status, id]
        );
      } else {
        throw colErr; // Can't recover if it's not a status update
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Action item not found" });
    }

    // Auto-add audit trail comments for key changes
    const auditMessages = [];
    if (status) auditMessages.push(`Status changed to "${status.replace(/_/g, " ")}"`);
    if (priority) auditMessages.push(`Priority set to "${priority}"`);
    if (assignee !== undefined) auditMessages.push(assignee ? `Assigned to "${assignee}"` : "Assignee removed");
    if (dueDate !== undefined) auditMessages.push(dueDate ? `Due date set to ${new Date(dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : "Due date removed");

    if (updatedBy && auditMessages.length > 0) {
      await analyticsPool.query(
        `INSERT INTO review_action_item_comments (action_item_id, comment, author)
         VALUES ($1, $2, $3)`,
        [id, auditMessages.join("; "), updatedBy]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating action item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE — remove an action item
app.delete("/api/analytics/action-items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await analyticsPool.query(
      `DELETE FROM review_action_items WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Action item not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting action item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST — add a comment to an action item
app.post("/api/analytics/action-items/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { comment, author } = req.body;

  if (!comment) {
    return res.status(400).json({ success: false, error: "comment is required" });
  }

  try {
    const result = await analyticsPool.query(
      `INSERT INTO review_action_item_comments (action_item_id, comment, author)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, comment, author || "Unknown"]
    );

    // Update the parent item's updated_at
    await analyticsPool.query(
      `UPDATE review_action_items SET updated_at = NOW() WHERE id = $1`,
      [id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST — bulk-create AI-generated action items (called after AI analysis)
app.post("/api/analytics/action-items/bulk", async (req, res) => {
  const { propertyName, items, createdBy } = req.body;

  if (!propertyName || !items || !items.length) {
    return res.status(400).json({ success: false, error: "propertyName and items are required" });
  }

  try {
    const created = [];
    for (const item of items) {
      // Check if a similar AI action item already exists (avoid duplicates)
      const existing = await analyticsPool.query(
        `SELECT id FROM review_action_items
         WHERE property_name = $1 AND action = $2 AND source = 'ai'`,
        [propertyName, item.action]
      );

      if (existing.rows.length === 0) {
        const result = await analyticsPool.query(
          `INSERT INTO review_action_items (property_name, category, action, source, created_by)
           VALUES ($1, $2, $3, 'ai', $4) RETURNING *`,
          [propertyName, item.category || "General", item.action, createdBy || "AI"]
        );
        created.push({ ...result.rows[0], comments: [] });
      }
    }

    res.json({ success: true, data: created, skipped: items.length - created.length });
  } catch (error) {
    console.error("Error bulk-creating action items:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET — list ALL action items across properties (for "All Properties" view)
app.get("/api/analytics/action-items-all", async (req, res) => {
  try {
    let itemsResult;
    try {
      itemsResult = await analyticsPool.query(
        `SELECT * FROM review_action_items ORDER BY
          CASE status
            WHEN 'to_acknowledge' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'in_progress' THEN 3
            WHEN 'done' THEN 4
          END,
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            WHEN 'none' THEN 5
          END,
          due_date ASC NULLS LAST,
          created_at DESC`
      );
    } catch (sortErr) {
      itemsResult = await analyticsPool.query(
        `SELECT * FROM review_action_items ORDER BY
          CASE status
            WHEN 'to_acknowledge' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'in_progress' THEN 3
            WHEN 'done' THEN 4
          END,
          created_at DESC`
      );
    }

    // Fetch comments for all items
    const itemIds = itemsResult.rows.map((r) => r.id);
    let comments = [];
    if (itemIds.length > 0) {
      const commentsResult = await analyticsPool.query(
        `SELECT * FROM review_action_item_comments WHERE action_item_id = ANY($1) ORDER BY created_at ASC`,
        [itemIds]
      );
      comments = commentsResult.rows;
    }

    const commentsByItem = {};
    comments.forEach((c) => {
      if (!commentsByItem[c.action_item_id]) commentsByItem[c.action_item_id] = [];
      commentsByItem[c.action_item_id].push(c);
    });

    const items = itemsResult.rows.map((item) => ({
      ...item,
      comments: commentsByItem[item.id] || [],
    }));

    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching all action items:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ REVIEW REACTIONS ============

// GET — all reactions (optionally filtered by property)
app.get("/api/analytics/review-reactions", async (req, res) => {
  try {
    const { propertyName } = req.query;
    let result;
    if (propertyName) {
      result = await analyticsPool.query(
        "SELECT review_id, emoji, user_name, created_at FROM review_reactions WHERE property_name = $1 ORDER BY created_at",
        [propertyName]
      );
    } else {
      result = await analyticsPool.query(
        "SELECT review_id, emoji, user_name, created_at FROM review_reactions ORDER BY created_at"
      );
    }

    // Group by review_id for efficient frontend mapping
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.review_id]) grouped[row.review_id] = [];
      grouped[row.review_id].push({ emoji: row.emoji, user_name: row.user_name, created_at: row.created_at });
    }

    res.json({ success: true, data: grouped });
  } catch (error) {
    console.error("Error fetching review reactions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST — add a reaction
app.post("/api/analytics/review-reactions", async (req, res) => {
  try {
    const { reviewId, propertyName, emoji, userName } = req.body;
    if (!reviewId || !propertyName || !emoji || !userName) {
      return res.status(400).json({ success: false, error: "reviewId, propertyName, emoji, userName are required" });
    }

    const result = await analyticsPool.query(
      `INSERT INTO review_reactions (review_id, property_name, emoji, user_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (review_id, emoji, user_name) DO NOTHING
       RETURNING *`,
      [reviewId, propertyName, emoji, userName]
    );

    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    console.error("Error adding review reaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE — remove a reaction
app.delete("/api/analytics/review-reactions", async (req, res) => {
  try {
    const { reviewId, emoji, userName } = req.body;
    if (!reviewId || !emoji || !userName) {
      return res.status(400).json({ success: false, error: "reviewId, emoji, userName are required" });
    }

    await analyticsPool.query(
      "DELETE FROM review_reactions WHERE review_id = $1 AND emoji = $2 AND user_name = $3",
      [reviewId, emoji, userName]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing review reaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET — staff list for a property (for assignee dropdown)
app.get("/api/analytics/property-staff", async (req, res) => {
  const { propertyName } = req.query;
  if (!propertyName) {
    return res.status(400).json({ success: false, error: "propertyName is required" });
  }

  try {
    // Query staff linked to this property using Zostel's actual table structure:
    // zostel_authentication_useraccessgroup → links users to access groups
    // zostel_authentication_association → links users to operators (properties) via value column
    // zostel_authentication_useraccount → user details (first_name, last_name, mobile)
    // zostel_authorization_accessgroup → access group/role names
    // zostel_core_operator → property/operator details
    // zostel_zoprofile_profile → additional profile info (slack ID, DOB)
    const staffResult = await analyticsPool.query(
      `SELECT DISTINCT
        u.id as user_id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.mobile,
        ag.name as role_name,
        ag.id as access_group_id,
        p.staff_slack_user_id as slack_user_id
      FROM zostel_authentication_useraccessgroup uag
      LEFT JOIN zostel_authentication_useraccount u ON uag.user_id = u.id
      LEFT JOIN zostel_authorization_accessgroup ag ON uag.access_group_id = ag.id
      LEFT JOIN zostel_zoprofile_profile p ON uag.user_id = p.user_id
      LEFT JOIN zostel_authentication_association assoc ON uag.user_id = assoc.user_id
      LEFT JOIN zostel_core_operator op ON assoc.value::integer = op.id
      WHERE op.name = $1
        AND uag.end_date IS NULL
        AND ag.name IN (
          'Cafe Manager', 'Chef', 'Community Manager',
          'Front Desk Manager', 'Housekeeping Manager', 'Housekeeping Staff',
          'Kitchen Staff', 'Owner', 'Property Manager', 'Security'
        )
      ORDER BY u.first_name, u.last_name`,
      [propertyName]
    );

    const staff = staffResult.rows.map((row) => ({
      id: row.user_id,
      name: `${row.first_name || ""} ${row.last_name || ""}`.trim() || `User #${row.user_id}`,
      role: row.role_name || "Staff",
      accessGroupId: row.access_group_id,
      slackUserId: row.slack_user_id || null,
    }));

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Error fetching property staff:", error);
    if (error.message?.includes("does not exist")) {
      return res.json({ success: true, data: [], message: "Staff tables not available" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lightweight healthcheck
app.get("/api/health", async (req, res) => {
  const result = {
    status: "ok",
    time: new Date().toISOString(),
    checks: {
      db: "unknown",
      redis: redisClient?.isOpen ? "ok" : "down",
    },
  };

  try {
    await pool.query("SELECT 1");
    result.checks.db = "ok";
  } catch (err) {
    result.status = "degraded";
    result.checks.db = "down";
    result.error = "primary db check failed";
  }

  res.status(result.status === "ok" ? 200 : 503).json(result);
});

// Test connection helper
const testConnection = async () => {
  try {
    await retryQuery(async () => {
      const client = await pool.connect();
      try {
        await client.query("SELECT NOW()");
      } finally {
        client.release();
      }
    });
  } catch (err) {
    console.error("Database connection error:", err);
    // Don't exit - allow server to start for OAuth testing
    // OAuth endpoints don't require database connection
    throw err; // Re-throw to be caught by caller
  }
};

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Initialize server after DB connection (only if not in build mode)
if (!(process.env.NX_TASK_TARGET_PROJECT && process.env.NX_TASK_TARGET_TARGET === 'build')) {
  testConnection()
    .then(() => {
      const PORT = process.env.PORT || 4211;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Database connection failed, but starting server anyway for OAuth testing:", err.message);
      // Start server even if DB fails - OAuth endpoints don't need DB
      const PORT = process.env.PORT || 4211;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (DB connection failed - some endpoints may not work)`);
      });
    });
} else {
  console.log('Skipping server startup during build process');
}

// Retry logic helper
async function retryQuery(queryFn, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      if (error.code === "40001" || error.code === "40P01") {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

// WATI API configuration
const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN;

// Modify the fetchGuestDetails function to accept dateRangeLogic parameter
async function fetchGuestDetails(
  minDate,
  maxDate,
  dateRangeLogic,
  propertyCodes
) {
  let whereCondition = "";

  const normalizedLogic = dateRangeLogic
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .sort()
    .join(",");

  // Handle different dateRangeLogic cases
  switch (normalizedLogic) {
    case "CHECKIN":
      whereCondition = "(cb.start_date > $1 AND cb.start_date < $2)";
      break;
    case "STAYOVER":
      whereCondition = "(cb.start_date <= $1 AND cb.end_date >= $2)";
      break;
    case "CHECKOUT":
      whereCondition = "(cb.end_date > $1 AND cb.end_date < $2)";
      break;
    case "CHECKIN,CHECKOUT":
      whereCondition =
        "(cb.start_date > $1 AND cb.start_date < $2) OR (cb.end_date > $1 AND cb.end_date < $2)";
      break;
    case "CHECKIN,STAYOVER":
      whereCondition =
        "(cb.start_date > $1 AND cb.start_date < $2) OR (cb.start_date <= $1 AND cb.end_date >= $2)";
      break;
    case "CHECKOUT,STAYOVER":
      whereCondition =
        "(cb.end_date > $1 AND cb.end_date < $2) OR (cb.start_date <= $1 AND cb.end_date >= $2)";
      break;
    case "CHECKIN,CHECKOUT,STAYOVER":
      whereCondition =
        "(cb.start_date > $1 AND cb.start_date < $2) OR (cb.end_date > $1 AND cb.end_date < $2) OR (cb.start_date <= $1 AND cb.end_date >= $2)";
      break;
    default:
      whereCondition = "(cb.start_date > $1 AND cb.start_date < $2)"; // Default to CHECKIN logic
  }

  const propertyCodesArray = Array.isArray(propertyCodes)
    ? propertyCodes
    : [propertyCodes];

  // Build the dynamic WHERE clause for property codes
  const propertyConditions = propertyCodesArray
    .map((_, index) => `cb.code LIKE $${index + 3}`)
    .join(" OR ");

  const query = `
    SELECT DISTINCT cbg2.mobile, co.name as property_name, cbg2.first_name, cbg2.last_name, cbg2.email, cbg2.gender
    FROM core_booking cb
    JOIN core_booking_guests cbg ON cbg.booking_id = cb.id
    JOIN core_bookingguest cbg2 ON cbg2.id = cbg.bookingguest_id
    JOIN core_operator co ON co.id = cb.operator_id
    WHERE (${whereCondition})
      AND (${propertyConditions})
      AND cb.status IN (2, 4)
  `;

  const params = [
    minDate,
    maxDate,
    ...propertyCodesArray.map((code) => `%${code}%`),
  ];

  // Create a copy of the query and replace placeholders with actual values
  let finalQuery = query;
  params.forEach((param, index) => {
    finalQuery = finalQuery.replace(`$${index + 1}`, `'${param}'`);
  });

  console.log("Final Query:", finalQuery);
  console.log("Parameters:", params);

  try {
    const result = await pool.query(query, params);
    return result.rows
      .map((row) => {
        return {
          mobile: row.mobile,
          property_name: row.property_name,
          guest_name: row.first_name,
          guest_last_name: row.last_name,
          guest_email: row.email,
          guest_gender: row.gender,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Error fetching guest details:", error);
    throw error;
  }
}

async function getUserIdsFromPropertiesVisited(
  minDate,
  maxDate,
  method,
  propertyCodes
) {
  let whereCondition = "";

  const propertyCodesArray = Array.isArray(propertyCodes)
    ? propertyCodes
    : [propertyCodes];

  // Build the dynamic WHERE clause for property codes
  const propertyConditions = propertyCodesArray
    .map((_, index) => `cb.code LIKE $${index + 3}`)
    .join(" OR ");

  const query = `
      SELECT DISTINCT um.user_id
      FROM core_booking cb
      JOIN core_booking_guests cbg ON cbg.booking_id = cb.id
      JOIN core_bookingguest cbg2 ON cbg2.id = cbg.bookingguest_id
      JOIN core_operator co ON co.id = cb.operator_id
      JOIN zo_authentication_usermobile um ON um.mobile_number = cbg2.mobile
      WHERE (cb.start_date > $1 AND cb.start_date < $2) OR (cb.end_date > $1 AND cb.end_date < $2) OR (cb.start_date <= $1 AND cb.end_date >= $2)
      AND (${propertyConditions})
      AND cb.status IN (2, 4)
    `;

  const params = [
    minDate,
    maxDate,
    ...propertyCodesArray.map((code) => `%${code}%`),
  ];

  // Create a copy of the query and replace placeholders with actual values
  let finalQuery = query;
  params.forEach((param, index) => {
    finalQuery = finalQuery.replace(`$${index + 1}`, `'${param}'`);
  });

  console.log("Final Query:", finalQuery);
  console.log("Parameters:", params);

  try {
    const result = await pool.query(query, params);
    return result.rows.map((row) => row.user_id);
  } catch (error) {
    console.error("Error fetching guest details:", error);
    throw error;
  }
}

// Update the guest-count endpoint to handle dateRangeLogic
app.get("/api/guest-count", async (req, res) => {
  try {
    const {
      minDate,
      maxDate,
      dateRangeLogic = "CHECKIN",
      propertyCodes,
    } = req.query;

    // Validate required parameters
    if (!minDate || !maxDate) {
      return res.status(400).json({
        success: false,
        error: "Start date and end date are required",
      });
    }

    // Validate dateRangeLogic values
    const validLogics = [
      "CHECKIN",
      "CHECKOUT",
      "STAYOVER",
      "CHECKIN,CHECKOUT",
      "CHECKIN,STAYOVER",
      "CHECKOUT,STAYOVER",
    ];
    if (!validLogics.includes(dateRangeLogic)) {
      return res.status(400).json({
        success: false,
        error: "Invalid dateRangeLogic value",
      });
    }

    const guests = await fetchGuestDetails(
      minDate,
      maxDate,
      dateRangeLogic,
      propertyCodes
    );

    res.json({
      success: true,
      guests: guests,
      count: guests.length,
    });
  } catch (error) {
    console.error("Error in guest-count endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

//Fetch audience for app notifications
app.get("/api/notifications-audience", async (req, res) => {
  try {
    const { method, minDate, maxDate, propertyCodes } = req.query;

    // Validate required parameters
    if (!minDate || !maxDate) {
      return res.status(400).json({
        success: false,
        error: "Start date and end date are required",
      });
    }

    const users = await fetchUsers(
      minDate,
      maxDate,
      "CHECKIN,CHECKOUT,STAYOVER",
      propertyCodes
    );

    res.json({
      success: true,
      users: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error in guest-count endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Slack OAuth Configuration
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4211'}/api/slack/oauth/callback`;

// Slack OAuth scopes required for USER tokens (to post as the user, not the bot)
const SLACK_USER_SCOPES = [
  'chat:write',
  'channels:read',
  'pins:write',
  'users:read',
  'files:write'
].join(',');

// Helper function to store user Slack token in Redis
async function storeUserSlackToken(userId, tokenData) {
  try {
    const key = `slack:user:${userId}`;
    const tokenDataWithTimestamp = {
      ...tokenData,
      connectedAt: new Date().toISOString(),
    };
    // Store token with 90 days expiration (Slack tokens typically last longer)
    await redisClient.setEx(key, 90 * 24 * 60 * 60, JSON.stringify(tokenDataWithTimestamp));
    console.log(`[Slack OAuth] Stored token for user: ${userId}`);
  } catch (error) {
    console.error('[Slack OAuth] Error storing token:', error);
    throw error;
  }
}

// Helper function to get user Slack token from Redis
async function getUserSlackToken(userId) {
  try {
    const key = `slack:user:${userId}`;
    const tokenData = await redisClient.get(key);
    if (!tokenData) {
      return null;
    }
    return JSON.parse(tokenData);
  } catch (error) {
    console.error('[Slack OAuth] Error getting token:', error);
    return null;
  }
}

// Helper function to delete user Slack token from Redis
async function deleteUserSlackToken(userId) {
  try {
    const key = `slack:user:${userId}`;
    await redisClient.del(key);
    console.log(`[Slack OAuth] Deleted token for user: ${userId}`);
  } catch (error) {
    console.error('[Slack OAuth] Error deleting token:', error);
    throw error;
  }
}

// ============================================
// Slack Message Tracking - Redis Helpers
// ============================================
const MESSAGE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

// Generate unique broadcast ID
function generateBroadcastId() {
  return `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Store sent message metadata in Redis
async function storeMessageMetadata(messageData) {
  try {
    const { channel, ts, text, userId, source, fileId, fileName, propertyName, broadcastId, template, variables } = messageData;
    const key = `slack:message:${channel}:${ts}`;
    const data = {
      channel,
      ts,
      text: text || '',
      userId: userId || 'system',
      source: source || 'bot', // 'bot' or 'user'
      fileId: fileId || null,
      fileName: fileName || null,
      propertyName: propertyName || null,
      broadcastId: broadcastId || null, // Group messages from same broadcast
      template: template || null, // Original template with {{variables}}
      variables: variables || null, // Variables used for this message
      sentAt: new Date().toISOString(),
    };
    await redisClient.setEx(key, MESSAGE_TTL, JSON.stringify(data));
    console.log(`[Slack Messages] Stored message: ${key}${broadcastId ? ` (broadcast: ${broadcastId})` : ''}`);
    return true;
  } catch (error) {
    console.error('[Slack Messages] Error storing message:', error);
    return false;
  }
}

// Get all stored messages (with optional filters)
async function getStoredMessages(filters = {}) {
  try {
    const { channelId, userId, query, limit = 100, offset = 0, groupByBroadcast = false, startDate, endDate } = filters;

    // Get all message keys
    const pattern = channelId
      ? `slack:message:${channelId}:*`
      : 'slack:message:*';

    const keys = await redisClient.keys(pattern);

    if (keys.length === 0) {
      return { messages: [], total: 0, broadcasts: [] };
    }

    // Parse date filters if provided
    const filterStartDate = startDate ? new Date(startDate) : null;
    const filterEndDate = endDate ? new Date(endDate) : null;
    // Set end date to end of day
    if (filterEndDate) {
      filterEndDate.setHours(23, 59, 59, 999);
    }

    // Fetch all message data
    const messages = [];
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);

          // Apply filters
          if (userId && parsed.userId !== userId && parsed.userId !== 'system') {
            continue;
          }

          if (query) {
            const searchQuery = query.toLowerCase();
            // Search in text or template
            const textMatch = parsed.text && parsed.text.toLowerCase().includes(searchQuery);
            const templateMatch = parsed.template && parsed.template.toLowerCase().includes(searchQuery);
            if (!textMatch && !templateMatch) {
              continue;
            }
          }

          // Apply date range filter
          if (filterStartDate || filterEndDate) {
            const msgDate = parsed.sentAt ? new Date(parsed.sentAt) : null;
            if (!msgDate) continue;
            if (filterStartDate && msgDate < filterStartDate) continue;
            if (filterEndDate && msgDate > filterEndDate) continue;
          }

          messages.push(parsed);
        } catch (e) {
          console.error(`[Slack Messages] Error parsing message data for key ${key}:`, e);
        }
      }
    }

    // Sort by sentAt descending (newest first)
    messages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    // Group by broadcastId if requested
    let broadcasts = [];
    if (groupByBroadcast) {
      const broadcastMap = new Map();
      const standaloneMessages = [];

      for (const msg of messages) {
        if (msg.broadcastId) {
          if (!broadcastMap.has(msg.broadcastId)) {
            broadcastMap.set(msg.broadcastId, {
              broadcastId: msg.broadcastId,
              template: msg.template,
              messages: [],
              sentAt: msg.sentAt,
              source: msg.source,
              userId: msg.userId,
            });
          }
          broadcastMap.get(msg.broadcastId).messages.push(msg);
        } else {
          standaloneMessages.push(msg);
        }
      }

      // Convert map to array and add channel count
      broadcasts = Array.from(broadcastMap.values()).map(b => ({
        ...b,
        channelCount: b.messages.length,
        propertyNames: [...new Set(b.messages.map(m => m.propertyName).filter(Boolean))],
      }));

      // Sort broadcasts by sentAt descending
      broadcasts.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    }

    // Apply pagination
    const total = messages.length;
    const paginatedMessages = messages.slice(offset, offset + limit);

    return { messages: paginatedMessages, total, broadcasts };
  } catch (error) {
    console.error('[Slack Messages] Error getting messages:', error);
    return { messages: [], total: 0, broadcasts: [] };
  }
}

// Delete message metadata from Redis
async function deleteMessageMetadata(channel, ts) {
  try {
    const key = `slack:message:${channel}:${ts}`;
    await redisClient.del(key);
    console.log(`[Slack Messages] Deleted message: ${key}`);
    return true;
  } catch (error) {
    console.error('[Slack Messages] Error deleting message:', error);
    return false;
  }
}

// Update message metadata in Redis
async function updateMessageMetadata(channel, ts, newText) {
  try {
    const key = `slack:message:${channel}:${ts}`;
    const existingData = await redisClient.get(key);

    if (!existingData) {
      console.log(`[Slack Messages] Message not found: ${key}`);
      return false;
    }

    const data = JSON.parse(existingData);
    data.text = newText;
    data.editedAt = new Date().toISOString();

    // Get remaining TTL and preserve it
    const ttl = await redisClient.ttl(key);
    if (ttl > 0) {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } else {
      await redisClient.setEx(key, MESSAGE_TTL, JSON.stringify(data));
    }

    console.log(`[Slack Messages] Updated message: ${key}`);
    return true;
  } catch (error) {
    console.error('[Slack Messages] Error updating message:', error);
    return false;
  }
}

// Initiate Slack OAuth flow
app.get("/api/slack/oauth/connect", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: userId",
      });
    }

    if (!SLACK_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        error: "Slack OAuth not configured. Missing SLACK_CLIENT_ID",
      });
    }

    // Generate state parameter for security (store userId in state)
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

    // Store state in Redis with short expiration (10 minutes)
    await redisClient.setEx(`slack:oauth:state:${state}`, 600, userId);

    // Use user_scope instead of scope to get USER token (posts as the user, not the bot)
    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=${SLACK_USER_SCOPES}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${state}`;

    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("Error initiating Slack OAuth:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate Slack OAuth",
      details: error.message,
    });
  }
});

// Slack OAuth callback
app.get("/api/slack/oauth/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4210'}/slack-messaging?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4210'}/slack-messaging?error=missing_code_or_state`);
    }

    // Verify state
    const storedUserId = await redisClient.get(`slack:oauth:state:${state}`);
    if (!storedUserId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4210'}/slack-messaging?error=invalid_state`);
    }

    // Delete state after verification
    await redisClient.del(`slack:oauth:state:${state}`);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code: code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!tokenResponse.data.ok) {
      console.error('Slack OAuth error:', tokenResponse.data.error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4210'}/slack-messaging?error=${encodeURIComponent(tokenResponse.data.error)}`);
    }

    // Store token data - for user_scope OAuth, the user token is in authed_user.access_token
    const authedUser = tokenResponse.data.authed_user || {};
    const tokenData = {
      accessToken: authedUser.access_token || tokenResponse.data.access_token,
      teamId: tokenResponse.data.team?.id,
      teamName: tokenResponse.data.team?.name,
      userId: authedUser.id,
      userEmail: authedUser.email,
      scope: authedUser.scope || tokenResponse.data.scope,
    };

    console.log('[Slack OAuth] Token response:', JSON.stringify(tokenResponse.data, null, 2));
    console.log('[Slack OAuth] Stored user token for user ID:', authedUser.id);

    await storeUserSlackToken(storedUserId, tokenData);

    // Get user info to display name
    try {
      const web = new WebClient(tokenData.accessToken);
      const userInfo = await web.users.info({ user: tokenData.userId });
      tokenData.userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
    } catch (err) {
      console.error('Error fetching user info:', err);
    }

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4210'}/slack-messaging?slack_connected=true&user=${encodeURIComponent(tokenData.userName || tokenData.userEmail || 'User')}`);
  } catch (error) {
    console.error("Error in Slack OAuth callback:", error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4210'}/slack-messaging?error=${encodeURIComponent(error.message)}`);
  }
});

// Check Slack connection status
app.get("/api/slack/oauth/status", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: userId",
      });
    }

    const tokenData = await getUserSlackToken(userId);

    if (!tokenData) {
      return res.json({
        success: true,
        connected: false,
      });
    }

    // Verify token is still valid by making a test API call
    try {
      const web = new WebClient(tokenData.accessToken);
      const authTest = await web.auth.test();

      if (!authTest.ok) {
        // Token is invalid, delete it
        await deleteUserSlackToken(userId);
        return res.json({
          success: true,
          connected: false,
        });
      }

      return res.json({
        success: true,
        connected: true,
        user: {
          id: authTest.user_id,
          name: authTest.user || tokenData.userName,
          team: authTest.team || tokenData.teamName,
        },
        connectedAt: tokenData.connectedAt,
      });
    } catch (error) {
      // Token is invalid, delete it
      await deleteUserSlackToken(userId);
      return res.json({
        success: true,
        connected: false,
      });
    }
  } catch (error) {
    console.error("Error checking Slack connection status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check Slack connection status",
      details: error.message,
    });
  }
});

// Disconnect Slack account
app.post("/api/slack/oauth/disconnect", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: userId",
      });
    }

    await deleteUserSlackToken(userId);

    res.json({
      success: true,
      message: "Slack account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Slack account:", error);
    res.status(500).json({
      success: false,
      error: "Failed to disconnect Slack account",
      details: error.message,
    });
  }
});

// Generate a new broadcast ID for grouping messages
app.get("/api/slack/broadcast/new", async (req, res) => {
  try {
    const broadcastId = generateBroadcastId();
    res.json({
      success: true,
      broadcastId: broadcastId,
    });
  } catch (error) {
    console.error("Error generating broadcast ID:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate broadcast ID",
    });
  }
});

// Add Slack message endpoint
app.post("/api/slack/message", async (req, res) => {
  const { channel, text, pinMessage = false, userId, propertyName, broadcastId, template, variables } = req.body;

  if (!channel || !text) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: channel and text",
      received: { channel, text },
    });
  }

  try {
    // Determine which token to use: user token (if provided) or bot token (fallback)
    let accessToken = process.env.SLACK_BOT_TOKEN;
    let useUserAccount = false;

    if (userId) {
      const userTokenData = await getUserSlackToken(userId);
      if (userTokenData && userTokenData.accessToken) {
        accessToken = userTokenData.accessToken;
        useUserAccount = true;
        console.log(`[Slack Message] Using user account for user: ${userId}`);
      } else {
        console.log(`[Slack Message] No user token found, falling back to bot token for user: ${userId}`);
      }
    }

    const web = new WebClient(accessToken);

    // Send message to channel
    const messageResult = await web.chat.postMessage({
      channel: channel,
      text: text,
    });

    console.log("Message sent:", messageResult); // Debug log

    // Store message metadata for tracking (with broadcast info if provided)
    if (messageResult.ok) {
      await storeMessageMetadata({
        channel: messageResult.channel,
        ts: messageResult.ts,
        text: text,
        userId: userId || 'system',
        source: useUserAccount ? 'user' : 'bot',
        propertyName: propertyName || null,
        broadcastId: broadcastId || null,
        template: template || null,
        variables: variables || null,
      });
    }

    // Pin the message if requested
    if (pinMessage && messageResult.ok) {
      try {
        // Ensure we're using the correct channel ID and timestamp
        const pinResult = await web.pins.add({
          channel: messageResult.channel, // Use the channel ID from the message result
          timestamp: messageResult.ts, // Use the timestamp from the message result
        });

        console.log("Pin result:", pinResult); // Debug log

        if (!pinResult.ok) {
          throw new Error(`Failed to pin message: ${pinResult.error}`);
        }

        return res.json({
          success: true,
          messageTs: messageResult.ts,
          pinned: true,
          channel: messageResult.channel,
          sentFromUserAccount: useUserAccount,
        });
      } catch (pinError) {
        console.error("Error pinning message:", {
          error: pinError,
          channel: messageResult.channel,
          ts: messageResult.ts,
        });

        return res.json({
          success: true,
          warning: "Message sent but could not be pinned",
          messageTs: messageResult.ts,
          channel: messageResult.channel,
          details: pinError.message,
          sentFromUserAccount: useUserAccount,
        });
      }
    }

    res.json({
      success: true,
      messageTs: messageResult.ts,
      channel: messageResult.channel,
      pinned: false,
      sentFromUserAccount: useUserAccount,
    });
  } catch (error) {
    console.error("Error sending slack message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send slack message",
      details: error.message,
    });
  }
});

// Slack file upload endpoint - send message with file attachment
app.post("/api/slack/message-with-file", upload.single('file'), async (req, res) => {
  try {
    const { channel, text, pinMessage, userId, propertyName, broadcastId, template, variables } = req.body;
    const file = req.file;

    if (!channel) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: channel",
      });
    }

    if (!file && !text) {
      return res.status(400).json({
        success: false,
        error: "Either file or text message is required",
      });
    }

    // Determine which token to use: user token (if provided) or bot token (fallback)
    let accessToken = process.env.SLACK_BOT_TOKEN;
    let useUserAccount = false;

    if (userId) {
      const userTokenData = await getUserSlackToken(userId);
      if (userTokenData && userTokenData.accessToken) {
        accessToken = userTokenData.accessToken;
        useUserAccount = true;
        console.log(`[Slack File Upload] Using user account for user: ${userId}`);
      } else {
        console.log(`[Slack File Upload] No user token found, falling back to bot token`);
      }
    }

    const web = new WebClient(accessToken);
    let messageResult;

    if (file) {
      // Upload file with optional initial comment (text message)
      console.log(`[Slack File Upload] Uploading file: ${file.originalname} (${file.size} bytes)`);

      const uploadResult = await web.files.uploadV2({
        channel_id: channel,
        file: file.buffer,
        filename: file.originalname,
        initial_comment: text || undefined,
      });

      console.log("File upload result:", uploadResult);

      // The uploadV2 response contains the file info
      if (!uploadResult.ok) {
        throw new Error(uploadResult.error || "File upload failed");
      }

      // Get the message timestamp from the file's shares
      // uploadV2 can return file info in different structures
      const fileInfo = uploadResult.file || (uploadResult.files && uploadResult.files[0]);
      let messageTs = null;

      // Try multiple ways to get the message timestamp
      // Method 1: From shares.public
      if (fileInfo && fileInfo.shares && fileInfo.shares.public) {
        const channelShares = fileInfo.shares.public[channel];
        if (channelShares && channelShares.length > 0) {
          messageTs = channelShares[0].ts;
        }
      }

      // Method 2: From shares.private (for private channels)
      if (!messageTs && fileInfo && fileInfo.shares && fileInfo.shares.private) {
        const channelShares = fileInfo.shares.private[channel];
        if (channelShares && channelShares.length > 0) {
          messageTs = channelShares[0].ts;
        }
      }

      // Method 3: Use file timestamp as fallback (for tracking purposes)
      if (!messageTs && fileInfo && fileInfo.timestamp) {
        messageTs = String(fileInfo.timestamp);
      }

      // Method 4: Generate timestamp from current time as last resort
      if (!messageTs) {
        messageTs = String(Date.now() / 1000);
        console.log(`[Slack File Upload] Could not get message ts from Slack, using generated ts: ${messageTs}`);
      }

      console.log(`[Slack File Upload] Message timestamp: ${messageTs}, File ID: ${fileInfo?.id}`);

      messageResult = {
        ok: true,
        ts: messageTs,
        channel: channel,
        file: {
          id: fileInfo?.id,
          name: fileInfo?.name,
          permalink: fileInfo?.permalink,
        },
      };
    } else {
      // Just send text message (fallback)
      messageResult = await web.chat.postMessage({
        channel: channel,
        text: text,
      });
    }

    // Store message metadata for tracking (with broadcast info if provided)
    if (messageResult.ok && messageResult.ts) {
      await storeMessageMetadata({
        channel: messageResult.channel || channel,
        ts: messageResult.ts,
        text: text || '',
        userId: userId || 'system',
        source: useUserAccount ? 'user' : 'bot',
        fileId: messageResult.file?.id || null,
        fileName: messageResult.file?.name || null,
        propertyName: propertyName || null,
        broadcastId: broadcastId || null,
        template: template || null,
        variables: variables ? JSON.parse(variables) : null,
      });
    }

    // Pin the message if requested
    if (pinMessage === 'true' && messageResult.ok && messageResult.ts) {
      try {
        const pinResult = await web.pins.add({
          channel: messageResult.channel || channel,
          timestamp: messageResult.ts,
        });

        if (!pinResult.ok) {
          console.warn(`Failed to pin message: ${pinResult.error}`);
        }

        return res.json({
          success: true,
          messageTs: messageResult.ts,
          pinned: true,
          channel: messageResult.channel || channel,
          file: messageResult.file,
          sentFromUserAccount: useUserAccount,
        });
      } catch (pinError) {
        console.error("Error pinning message:", pinError.message);
        return res.json({
          success: true,
          warning: "Message sent but could not be pinned",
          messageTs: messageResult.ts,
          channel: messageResult.channel || channel,
          file: messageResult.file,
          sentFromUserAccount: useUserAccount,
        });
      }
    }

    res.json({
      success: true,
      messageTs: messageResult.ts,
      channel: messageResult.channel || channel,
      file: messageResult.file,
      pinned: false,
      sentFromUserAccount: useUserAccount,
    });
  } catch (error) {
    console.error("Error sending slack message with file:", error);

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum size is 50MB.",
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to send slack message with file",
      details: error.message,
    });
  }
});

// ============================================
// Slack Message Management Endpoints
// ============================================

// Search messages by text
app.get("/api/slack/messages/search", async (req, res) => {
  try {
    const { query, userId, limit = 100, offset = 0 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: query",
      });
    }

    const result = await getStoredMessages({
      query,
      userId,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      messages: result.messages,
      total: result.total,
      query,
    });
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search messages",
      details: error.message,
    });
  }
});

// List all messages (with optional channel filter)
app.get("/api/slack/messages/list", async (req, res) => {
  try {
    const { channelId, userId, limit = 100, offset = 0, groupByBroadcast = 'false', startDate, endDate } = req.query;

    const result = await getStoredMessages({
      channelId,
      userId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      groupByBroadcast: groupByBroadcast === 'true',
      startDate,
      endDate,
    });

    res.json({
      success: true,
      messages: result.messages,
      total: result.total,
      broadcasts: result.broadcasts || [],
    });
  } catch (error) {
    console.error("Error listing messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list messages",
      details: error.message,
    });
  }
});

// Edit multiple messages
app.put("/api/slack/messages/edit", async (req, res) => {
  try {
    const { messages, userId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: messages (array)",
      });
    }

    // Determine which token to use
    let accessToken = process.env.SLACK_BOT_TOKEN;
    let useUserAccount = false;

    if (userId) {
      const userTokenData = await getUserSlackToken(userId);
      if (userTokenData && userTokenData.accessToken) {
        accessToken = userTokenData.accessToken;
        useUserAccount = true;
      }
    }

    const web = new WebClient(accessToken);
    const results = [];

    for (const msg of messages) {
      const { channel, ts, newText } = msg;

      if (!channel || !ts || !newText) {
        results.push({
          channel,
          ts,
          success: false,
          error: "Missing channel, ts, or newText",
        });
        continue;
      }

      try {
        // Update message in Slack
        const updateResult = await web.chat.update({
          channel,
          ts,
          text: newText,
        });

        if (updateResult.ok) {
          // Update Redis metadata
          await updateMessageMetadata(channel, ts, newText);
          results.push({
            channel,
            ts,
            success: true,
          });
        } else {
          results.push({
            channel,
            ts,
            success: false,
            error: updateResult.error || "Update failed",
          });
        }
      } catch (error) {
        console.error(`Error editing message ${channel}:${ts}:`, error.message);
        results.push({
          channel,
          ts,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      success: failCount === 0,
      results,
      summary: {
        total: messages.length,
        succeeded: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Error editing messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to edit messages",
      details: error.message,
    });
  }
});

// Edit a broadcast (re-apply template with variables to all messages in broadcast)
app.put("/api/slack/broadcast/edit", async (req, res) => {
  try {
    const { broadcastId, newTemplate, userId } = req.body;

    if (!broadcastId || !newTemplate) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: broadcastId and newTemplate",
      });
    }

    // Get all messages in this broadcast
    const result = await getStoredMessages({ groupByBroadcast: true });
    const broadcast = result.broadcasts.find(b => b.broadcastId === broadcastId);

    if (!broadcast || !broadcast.messages || broadcast.messages.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Broadcast not found or has no messages",
      });
    }

    // Determine which token to use
    let accessToken = process.env.SLACK_BOT_TOKEN;
    let useUserAccount = false;

    if (userId) {
      const userTokenData = await getUserSlackToken(userId);
      if (userTokenData && userTokenData.accessToken) {
        accessToken = userTokenData.accessToken;
        useUserAccount = true;
      }
    }

    const web = new WebClient(accessToken);
    const results = [];

    for (const msg of broadcast.messages) {
      const { channel, ts, variables } = msg;

      try {
        // Variables that contain Slack user IDs and should be wrapped as <@ID> mentions
        const SLACK_USER_ID_VARIABLES = ["POC", "sPOC", "property_manager", "owner"];

        // Apply template with variables
        let newText = newTemplate;
        if (variables && typeof variables === 'object') {
          for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            if (!value) {
              newText = newText.replace(regex, '');
            } else {
              const isUserIdVar = SLACK_USER_ID_VARIABLES.includes(key);
              const isSlackUserId = /^U[A-Z0-9]+$/i.test(value);
              const formatted = (isUserIdVar || isSlackUserId) ? `<@${value}>` : value;
              newText = newText.replace(regex, formatted);
            }
          }
        }

        // Update message in Slack
        const updateResult = await web.chat.update({
          channel,
          ts,
          text: newText,
        });

        if (updateResult.ok) {
          // Update Redis metadata with new text and template
          const key = `slack:message:${channel}:${ts}`;
          const existingData = await redisClient.get(key);
          if (existingData) {
            const data = JSON.parse(existingData);
            data.text = newText;
            data.template = newTemplate;
            data.editedAt = new Date().toISOString();
            await redisClient.setEx(key, MESSAGE_TTL, JSON.stringify(data));
          }

          results.push({
            channel,
            ts,
            propertyName: msg.propertyName,
            success: true,
            newText,
          });
        } else {
          results.push({
            channel,
            ts,
            propertyName: msg.propertyName,
            success: false,
            error: updateResult.error || "Update failed",
          });
        }
      } catch (error) {
        console.error(`Error editing broadcast message ${channel}:${ts}:`, error.message);
        results.push({
          channel,
          ts,
          propertyName: msg.propertyName,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      success: failCount === 0,
      broadcastId,
      results,
      summary: {
        total: broadcast.messages.length,
        succeeded: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Error editing broadcast:", error);
    res.status(500).json({
      success: false,
      error: "Failed to edit broadcast",
      details: error.message,
    });
  }
});

// Delete multiple messages
app.delete("/api/slack/messages/delete", async (req, res) => {
  try {
    const { messages, userId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: messages (array)",
      });
    }

    // Determine which token to use
    let accessToken = process.env.SLACK_BOT_TOKEN;
    let useUserAccount = false;

    if (userId) {
      const userTokenData = await getUserSlackToken(userId);
      if (userTokenData && userTokenData.accessToken) {
        accessToken = userTokenData.accessToken;
        useUserAccount = true;
      }
    }

    const web = new WebClient(accessToken);
    const results = [];

    for (const msg of messages) {
      const { channel, ts } = msg;

      if (!channel || !ts) {
        results.push({
          channel,
          ts,
          success: false,
          error: "Missing channel or ts",
        });
        continue;
      }

      try {
        // Delete message from Slack
        const deleteResult = await web.chat.delete({
          channel,
          ts,
        });

        if (deleteResult.ok) {
          // Remove from Redis
          await deleteMessageMetadata(channel, ts);
          results.push({
            channel,
            ts,
            success: true,
          });
        } else {
          results.push({
            channel,
            ts,
            success: false,
            error: deleteResult.error || "Delete failed",
          });
        }
      } catch (error) {
        console.error(`Error deleting message ${channel}:${ts}:`, error.message);
        results.push({
          channel,
          ts,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      success: failCount === 0,
      results,
      summary: {
        total: messages.length,
        succeeded: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Error deleting messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete messages",
      details: error.message,
    });
  }
});

// Add new WATI template message endpoint
app.post("/api/wati/send-template", async (req, res) => {
  const { phoneNumber, templateName, parameters } = req.body;

  if (!phoneNumber || !templateName) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: phoneNumber and templateName",
      received: { phoneNumber, templateName },
    });
  }

  try {
    const url = `${WATI_API_ENDPOINT}/api/v1/sendTemplateMessage?whatsappNumber=${phoneNumber}`;

    const requestBody = {
      template_name: templateName,
      broadcast_name: "ops_tool_broadcast",
      parameters: parameters || [],
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json-patch+json",
        Authorization: WATI_ACCESS_TOKEN,
      },
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("WATI API Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: "Failed to send template message",
      details: error.response?.data || error.message,
    });
  }
});

// Rename existing endpoint from "checkouts" to "all-reviews"
app.get("/api/analytics/all-reviews", async (req, res) => {
  const { startDate, endDate, propertyName, skipCache } = req.query;

  // Validate required parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: startDate and endDate",
      received: { startDate, endDate },
    });
  }

  try {
    const cacheParams = {
      startDate,
      endDate,
      propertyName: propertyName || "all",
    };

    const result = await cache.withCache(
      "all-reviews",
      cacheParams,
      async () => {
        // Calculate previous period dates
        const currentStartDate = new Date(startDate);
        const currentEndDate = new Date(endDate);
        const periodDuration = currentEndDate - currentStartDate;

        const previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);

        const previousStartDate = new Date(previousEndDate);
        previousStartDate.setTime(previousStartDate.getTime() - periodDuration);

        // Function to fetch data for a given period
        const fetchPeriodData = async (
          periodStartDate,
          periodEndDate,
          propertyName
        ) => {
          // Build main query
          let query = `
        SELECT mv_uid, cb_booking_code as booking_code, cb_booking_id as booking_id,
          cb_checkout_date as checkout_date, operator_name as property_name, cb_operator_id as operator_id,
          bg_email as email, bg_name as name, bg_mobile as mobile,
          latest_review_rating as rating, latest_review_comment as comment,
          latest_review_source as review_source
        FROM proc_checkout2_mv
        WHERE cb_checkout_date >= $1
          AND cb_checkout_date <= $2
          AND latest_review_rating IS NOT NULL
      `;

          const params = [periodStartDate, periodEndDate];
          let paramCount = 2;

          if (propertyName) {
            paramCount++;
            query += ` AND operator_name = $${paramCount}`;
            params.push(propertyName);
          }

          // Add order and limit to prevent massive payloads on large date ranges
          query += ` ORDER BY cb_checkout_date DESC LIMIT 15000`;

          // Set statement timeout for this query (5 minutes for large date ranges)
          const result = await analyticsPool.query({
            text: query,
            values: params,
            statement_timeout: 300000 // 5 minutes in milliseconds
          });

          // Get total counts (including true review count, not capped by LIMIT)
          const countQuery = `
        SELECT
          count(distinct cb_booking_code) as checkouts,
          count(cb_booking_code) as total_guests,
          count(CASE WHEN latest_review_rating IS NOT NULL THEN 1 END) as review_count
        FROM proc_checkout2_mv
        WHERE cb_checkout_date >= $1
          AND cb_checkout_date <= $2
          ${propertyName ? "AND operator_name = $3" : ""}
      `;

          const countResult = await analyticsPool.query({
            text: countQuery,
            values: params,
            statement_timeout: 300000 // 5 minutes in milliseconds
          });
          const { checkouts, total_guests, review_count } = countResult.rows[0];

          // Enrich reviews with room/inventory names from core_booking
          let enrichedRows = result.rows;
          try {
            const bookingIds = result.rows.map((r) => r.booking_id).filter(Boolean);
            if (bookingIds.length > 0) {
              const roomsResult = await pool.query(
                `SELECT id, rooms FROM core_booking WHERE id = ANY($1) AND rooms IS NOT NULL`,
                [bookingIds]
              );
              const roomsByBooking = {};
              for (const row of roomsResult.rows) {
                try {
                  const roomsArr = typeof row.rooms === "string" ? JSON.parse(row.rooms) : row.rooms;
                  if (Array.isArray(roomsArr) && roomsArr.length > 0) {
                    roomsByBooking[row.id] = roomsArr.map((r) => r.name || r.room_name || r.type).filter(Boolean).join(", ");
                  }
                } catch (e) { /* skip unparseable rooms */ }
              }
              enrichedRows = result.rows.map((r) => ({
                ...r,
                room_name: roomsByBooking[r.booking_id] || null,
              }));
            }
          } catch (roomErr) {
            console.warn("[WARN] Could not enrich reviews with room names:", roomErr.message);
          }

          return {
            checkouts,
            total_guests,
            count: parseInt(review_count) || enrichedRows.length,
            data: enrichedRows,
          };
        };

        // Function to fetch trend data for multiple intervals
        const fetchTrendData = async (
          endDate,
          periodDuration,
          propertyName
        ) => {
          const intervals = 5; // Number of intervals to fetch
          const trendQuery = `
        WITH intervals AS (
          SELECT
            date_trunc('day', $1::timestamp) - (($3::interval) * generate_series(0, ($2 - 1))) as interval_end
          FROM generate_series(0, ${intervals - 1}) as s(i)
        ),
        interval_ranges AS (
          SELECT
            interval_end - ($3::interval) + interval '1 day' as interval_start,
            interval_end
          FROM intervals
        )
        SELECT
          to_char(interval_start, 'YYYY-MM-DD') as start_date,
          to_char(interval_end, 'YYYY-MM-DD') as end_date,
          ROUND(AVG(latest_review_rating)::numeric, 2) as avg_rating,
          COUNT(DISTINCT CASE WHEN latest_review_rating IS NOT NULL THEN cb_booking_code END) as reviews_count,
          COUNT(DISTINCT cb_booking_code) as total_checkouts,
          ROUND((COUNT(DISTINCT CASE WHEN latest_review_rating IS NOT NULL THEN cb_booking_code END)::numeric /
            NULLIF(COUNT(DISTINCT cb_booking_code), 0) * 100)::numeric, 2) as review_rate
        FROM interval_ranges ir
        LEFT JOIN proc_checkout2_mv pcm
          ON pcm.cb_checkout_date >= ir.interval_start
          AND pcm.cb_checkout_date <= ir.interval_end
          ${propertyName ? "AND operator_name = $4" : ""}
        GROUP BY interval_start, interval_end
        ORDER BY interval_start DESC
      `;

          const intervalDays = Math.ceil(
            periodDuration / (1000 * 60 * 60 * 24)
          );
          const params = [
            endDate,
            intervals,
            `${intervalDays} days`,
            ...(propertyName ? [propertyName] : []),
          ];

          const trendResult = await analyticsPool.query({
            text: trendQuery,
            values: params,
            statement_timeout: 300000 // 5 minutes in milliseconds
          });
          return trendResult.rows;
        };

        // Fetch all three sequentially to avoid saturating analyticsPool (max=10).
        // Each fetchPeriodData runs 2 queries internally (main + count) + 1 enrichment.
        // Running them in parallel was using 4+ connections just from this endpoint.
        const currentPeriodData = await fetchPeriodData(startDate, endDate, propertyName);
        const previousPeriodData = await fetchPeriodData(
          previousStartDate.toISOString().split("T")[0],
          previousEndDate.toISOString().split("T")[0],
          propertyName
        );
        const trendData = await fetchTrendData(endDate, periodDuration, propertyName);

        return {
          success: true,
          current_period: {
            start_date: startDate,
            end_date: endDate,
            ...currentPeriodData,
          },
          previous_period: {
            start_date: previousStartDate.toISOString().split("T")[0],
            end_date: previousEndDate.toISOString().split("T")[0],
            ...previousPeriodData,
          },
          trend_data: trendData,
        };
      },
      skipCache === "true"
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
      details: error.message,
    });
  }
});

// Add new Property Insights endpoint
app.get("/api/analytics/property-insights", async (req, res) => {
  const { startDate, endDate, skipCache, lite } = req.query;

  // Validate required parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: startDate and endDate",
      received: { startDate, endDate },
    });
  }

  try {
    // lite=true skips the expensive ARRAY_AGG(review_details) and ROW_NUMBER()
    // Used by "All Properties" view which only needs counts and averages
    const isLite = lite === "true";
    const cacheParams = { startDate, endDate, lite: isLite ? "true" : "false" };

    const result = await cache.withCache(
      "property-insights",
      cacheParams,
      async () => {
        if (isLite) {
          // ── Lightweight query: simple aggregation, no ROW_NUMBER, no ARRAY_AGG ──
          // ~10x faster than the full query on large date ranges
          const liteQuery = `
            WITH ReviewStats AS (
              SELECT
                operator_name as property_name,
                cb_operator_id as property_id,
                COUNT(latest_review_rating) as reviews,
                ROUND(AVG(latest_review_rating)::numeric, 2) as avg_rating,
                COUNT(CASE WHEN latest_review_rating <= 3 THEN 1 END) as low_reviews,
                COUNT(CASE WHEN latest_review_rating <= 2 THEN 1 END) as critical_reviews
              FROM proc_checkout2_mv
              WHERE cb_checkout_date >= $1
                AND cb_checkout_date <= $2
                AND latest_review_rating IS NOT NULL
              GROUP BY operator_name, cb_operator_id
            ),
            AllCheckouts AS (
              SELECT
                operator_name,
                cb_operator_id,
                COUNT(DISTINCT cb_booking_code) AS total_checkouts,
                COUNT(*) AS total_guests
              FROM proc_checkout2_mv
              WHERE cb_checkout_date >= $1
                AND cb_checkout_date <= $2
              GROUP BY operator_name, cb_operator_id
            )
            SELECT
              r.property_name,
              r.property_id,
              r.reviews,
              r.avg_rating,
              r.low_reviews,
              r.critical_reviews,
              '[]'::json as review_details,
              c.total_checkouts,
              c.total_guests
            FROM ReviewStats r
            LEFT JOIN AllCheckouts c
              ON r.property_id = c.cb_operator_id
            ORDER BY r.avg_rating DESC, r.reviews DESC;
          `;

          const queryResult = await analyticsPool.query({
            text: liteQuery,
            values: [startDate, endDate],
            statement_timeout: 120000 // 2 minutes — lite query is much faster
          });

          return {
            success: true,
            count: queryResult.rows.length,
            data: queryResult.rows,
          };
        }

        // ── Full query with review details (for individual property drill-down) ──
        const query = `
        WITH ReviewsRanked AS (
          SELECT
            operator_name,
            cb_operator_id,
            latest_review_rating,
            latest_review_comment,
            latest_review_source,
            cb_checkout_date,
            bg_name,
            cb_booking_code,
            ROW_NUMBER() OVER (PARTITION BY operator_name ORDER BY cb_checkout_date DESC) as rn
          FROM proc_checkout2_mv
          WHERE cb_checkout_date >= $1
            AND cb_checkout_date <= $2
            AND latest_review_rating IS NOT NULL
        ),
        AllCheckouts AS (
          SELECT
            operator_name,
            cb_operator_id,
            COUNT(DISTINCT cb_booking_code) AS total_checkouts,
            COUNT(*) AS total_guests
          FROM proc_checkout2_mv
          WHERE cb_checkout_date >= $1
            AND cb_checkout_date <= $2
          GROUP BY operator_name, cb_operator_id
        ),
        PropertyStats AS (
          SELECT
            r.operator_name as property_name,
            r.cb_operator_id as property_id,
            COUNT(r.latest_review_rating) as reviews,
            ROUND(AVG(r.latest_review_rating)::numeric, 2) as avg_rating,
            MAX(CASE WHEN r.rn = 1 THEN r.latest_review_comment END) as latest_review,
            ARRAY_AGG(
              json_build_object(
                'rating', r.latest_review_rating,
                'comment', r.latest_review_comment,
                'source', r.latest_review_source,
                'date', r.cb_checkout_date,
                'guest_name', r.bg_name,
                'booking_code', r.cb_booking_code
              ) ORDER BY r.cb_checkout_date DESC
            ) FILTER (WHERE r.rn <= 100) as review_details
          FROM ReviewsRanked r
          GROUP BY r.operator_name, r.cb_operator_id
        )
        SELECT
          p.*,
          c.total_checkouts,
          c.total_guests
        FROM PropertyStats p
        LEFT JOIN AllCheckouts c
          ON p.property_id = c.cb_operator_id
        ORDER BY avg_rating DESC, reviews DESC;
      `;

        const queryResult = await analyticsPool.query({
          text: query,
          values: [startDate, endDate],
          statement_timeout: 300000 // 5 minutes for large date ranges
        });

        return {
          success: true,
          count: queryResult.rows.length,
          data: queryResult.rows,
        };
      },
      skipCache === "true"
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching property insights:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch property insights",
      details: error.message,
    });
  }
});

// Properties Needing Attention endpoint - AI-powered analysis of struggling properties
app.get("/api/analytics/properties-attention", async (req, res) => {
  const { startDate, endDate, skipCache } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: startDate and endDate",
    });
  }

  try {
    const cacheParams = { startDate, endDate, type: "attention" };

    const result = await cache.withCache(
      "properties-attention",
      cacheParams,
      async () => {
        // Step 1: Get per-property stats with review details
        const query = `
          WITH ReviewsData AS (
            SELECT
              operator_name,
              cb_operator_id,
              latest_review_rating,
              latest_review_comment,
              cb_checkout_date
            FROM proc_checkout2_mv
            WHERE cb_checkout_date >= $1
              AND cb_checkout_date <= $2
              AND latest_review_rating IS NOT NULL
          ),
          PropertyStats AS (
            SELECT
              operator_name as property_name,
              cb_operator_id as property_id,
              COUNT(*) as total_reviews,
              ROUND(AVG(latest_review_rating)::numeric, 2) as avg_rating,
              COUNT(CASE WHEN latest_review_rating <= 3 THEN 1 END) as low_reviews,
              COUNT(CASE WHEN latest_review_rating <= 2 THEN 1 END) as critical_reviews,
              ROUND(
                (COUNT(CASE WHEN latest_review_rating <= 3 THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
                1
              ) as low_review_pct,
              ARRAY_AGG(
                json_build_object(
                  'rating', latest_review_rating,
                  'comment', latest_review_comment,
                  'date', cb_checkout_date
                ) ORDER BY cb_checkout_date DESC
              ) FILTER (WHERE latest_review_rating <= 3) as negative_reviews
            FROM ReviewsData
            GROUP BY operator_name, cb_operator_id
            HAVING COUNT(*) >= 3
          )
          SELECT *
          FROM PropertyStats
          WHERE avg_rating < 4.0 OR low_review_pct > 25
          ORDER BY avg_rating ASC, low_review_pct DESC
          LIMIT 10
        `;

        const queryResult = await analyticsPool.query({
          text: query,
          values: [startDate, endDate],
          statement_timeout: 60000,
        });

        const flaggedProperties = queryResult.rows;

        if (flaggedProperties.length === 0) {
          return { success: true, data: [] };
        }

        // Step 2: Use AI to generate concise reasons for each struggling property
        const aiAnalysisPromises = flaggedProperties.map(async (prop) => {
          const negReviews = (prop.negative_reviews || []).slice(0, 15);
          if (negReviews.length === 0) {
            return {
              ...prop,
              negative_reviews: undefined,
              issues: ["Below average rating"],
              severity: prop.avg_rating < 3.0 ? "critical" : "warning",
            };
          }

          try {
            await openRouterRateLimiter.waitIfNeeded();

            const prompt = `Given these negative guest reviews (rated 3 or below) for a hostel/hotel property "${prop.property_name}", identify the TOP 3-5 specific recurring issues in 3-6 words each. Be concise and specific.

Format: Return ONLY a JSON array of strings, nothing else. Example: ["Poor room cleanliness","Rude front desk staff","Cold water in showers"]

Reviews:
${negReviews.map((r) => `[${r.rating}★] ${r.comment || "No comment"}`).join("\n")}`;

            const response = await axios.post(
              process.env.OPENROUTER_API_URL,
              {
                messages: [{ role: "user", content: prompt }],
                model: "deepseek/deepseek-chat-v3-0324:free",
                max_tokens: 200,
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                  "HTTP-Referer": "https://zostel.com",
                  "Content-Type": "application/json",
                },
                timeout: 30000,
              }
            );

            const content = response.data?.choices?.[0]?.message?.content || "[]";
            // Try to parse JSON from response
            const jsonMatch = content.match(/\[[\s\S]*?\]/);
            const issues = jsonMatch ? JSON.parse(jsonMatch[0]) : ["Performance issues detected"];

            return {
              property_name: prop.property_name,
              property_id: prop.property_id,
              avg_rating: parseFloat(prop.avg_rating),
              total_reviews: parseInt(prop.total_reviews),
              low_reviews: parseInt(prop.low_reviews),
              critical_reviews: parseInt(prop.critical_reviews),
              low_review_pct: parseFloat(prop.low_review_pct),
              issues: issues.slice(0, 5),
              severity: parseFloat(prop.avg_rating) < 3.0 ? "critical" : parseFloat(prop.avg_rating) < 3.5 ? "warning" : "attention",
            };
          } catch (aiError) {
            console.error(`AI analysis failed for ${prop.property_name}:`, aiError.message);
            return {
              property_name: prop.property_name,
              property_id: prop.property_id,
              avg_rating: parseFloat(prop.avg_rating),
              total_reviews: parseInt(prop.total_reviews),
              low_reviews: parseInt(prop.low_reviews),
              critical_reviews: parseInt(prop.critical_reviews),
              low_review_pct: parseFloat(prop.low_review_pct),
              issues: ["Below average guest satisfaction"],
              severity: parseFloat(prop.avg_rating) < 3.0 ? "critical" : "warning",
            };
          }
        });

        const analyzedProperties = await Promise.all(aiAnalysisPromises);

        return {
          success: true,
          data: analyzedProperties,
        };
      },
      skipCache === "true"
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching properties needing attention:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties needing attention",
      details: error.message,
    });
  }
});

// Rate limiting for OpenRouter API calls
class RateLimiter {
  constructor(maxRequests = 5, timeWindow = 60000) { // 5 requests per minute
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async waitIfNeeded() {
    const now = Date.now();
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    console.log(`[DEBUG] Rate limiter: ${this.requests.length}/${this.maxRequests} requests in last ${this.timeWindow/1000}s`);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 2000; // Add 2 second buffer
      console.log(`[DEBUG] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
    console.log(`[DEBUG] Added request to rate limiter, now ${this.requests.length}/${this.maxRequests}`);
  }
}

const openRouterRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute (with paid credits)

// Add OpenRouter API integration
// Sample reviews proportionally by rating distribution to cap token usage
const sampleReviews = (reviews, maxCount = 200) => {
  if (reviews.length <= maxCount) return reviews;

  console.log(`[DEBUG] Sampling ${maxCount} reviews from ${reviews.length} total`);

  // Group by rating bucket
  const buckets = {};
  reviews.forEach((r) => {
    const rating = Math.floor(parseFloat(r.rating || 0)) || 0;
    if (!buckets[rating]) buckets[rating] = [];
    buckets[rating].push(r);
  });

  const sampled = [];
  const totalReviews = reviews.length;

  // Proportionally sample from each bucket
  Object.entries(buckets).forEach(([rating, bucket]) => {
    const proportion = bucket.length / totalReviews;
    const sampleSize = Math.max(1, Math.round(proportion * maxCount));
    // Shuffle and take sample
    const shuffled = [...bucket].sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, sampleSize));
  });

  // If we're over maxCount due to rounding, trim
  return sampled.slice(0, maxCount);
};

const analyzeReviews = async (reviews) => {
  // Implement exponential backoff retry with better 429 handling
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const retry = async (fn, retries = 5, delay = 1000) => {
    try {
      console.log(`[DEBUG] Making API call attempt`);
      return await fn();
    } catch (error) {
      if (retries === 0) {
        console.log(
          `[DEBUG] API call failed, no more retries. Error:`,
          error.response?.status || error.message
        );
        throw error;
      }

      // Handle 429 rate limit errors with shorter delays for paid credits
      if (error.response && error.response.status === 429) {
        console.log(
          `[DEBUG] Rate limit hit (429), retrying after ${delay}ms... (${retries} attempts left)`
        );
        await wait(delay);
        return retry(fn, retries - 1, Math.min(delay * 1.5, 5000));
      }

      // Handle other errors
      console.log(
        `[DEBUG] API call failed with ${error.response?.status || 'unknown error'}, retrying after ${delay}ms... (${retries} attempts left)`
      );
      await wait(delay);
      return retry(fn, retries - 1, delay * 2);
    }
  };

  try {
    // Cap reviews sent to AI to control token usage
    const sampledReviews = sampleReviews(reviews, 200);
    console.log(`[DEBUG] Preparing to analyze ${sampledReviews.length} reviews (from ${reviews.length} total)`);

    const prompt = `Analyze these customer reviews and provide:
1. A single paragraph summary of the key points, common themes, and overall sentiment
2. A list of strictly positive phrases (maximum 10 phrases, each phrase maximum 3 words) that highlight good experiences, compliments, and strengths only
3. A list of strictly negative phrases (maximum 10 phrases, each phrase maximum 3 words) that highlight problems, complaints, and weaknesses only
4. A list of 3-7 specific, actionable audit items that the property should address based on recurring issues in the reviews. Each action item should be a short imperative sentence (max 12 words).

Important:
- Positive phrases must only include clear compliments and good experiences
- Negative phrases must only include clear complaints and problems
- Do not mix positive and negative aspects in the same phrase
- Keep phrases concise (max 3 words)
- List the most commonly mentioned phrases first
- If there are no positive or negative phrases, return an empty array for that section
- Action items should be specific and directly inferred from the reviews (e.g. "Fix hot water supply in bathrooms", "Improve WiFi speed in rooms")
- Categorize each action item as one of: Rooms, Bathroom, Food, Cleanliness, Service, Amenities, General
- Do not add information in the response that does not come from the reviews

Format your response exactly like this:
SUMMARY: <your summary paragraph>
POSITIVE:
- <short positive phrase>
- <short positive phrase>
...
NEGATIVE:
- <short negative phrase>
- <short negative phrase>
...
ACTIONS:
- [Category] <action item>
- [Category] <action item>
...

Reviews:
${sampledReviews.map((r) => `- ${r.review}`).join("\n")}`;

    // Wrap the API call in retry logic with timeout
    console.log(`[DEBUG] Making initial API call to OpenRouter`);
    const response = await retry(async () => {
      return await axios.post(
        process.env.OPENROUTER_API_URL,
        {
          messages: [{ role: "user", content: prompt }],
          model: "deepseek/deepseek-chat-v3-0324:free",
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://zostel.com",
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );
    });

    console.log(`[DEBUG] OpenRouter API call successful`);

    if (
      !response.data ||
      !response.data.choices ||
      !response.data.choices[0] ||
      !response.data.choices[0].message
    ) {
      console.error("Invalid response from OpenRouter:", response.data);
      throw new Error("Invalid response format from OpenRouter API");
    }

    const content = response.data.choices[0].message.content;

    if (!content) {
      console.error("Empty content from OpenRouter");
      throw new Error("Empty response from OpenRouter API");
    }

    // Parse the response with fallbacks
    const summaryMatch = content.match(/SUMMARY: (.*?)(?=POSITIVE:|$)/s);
    const positivesMatch = content.match(/POSITIVE:(.*?)(?=NEGATIVE:|$)/s);
    const negativesMatch = content.match(/NEGATIVE:(.*?)(?=ACTIONS:|$)/s);
    const actionsMatch = content.match(/ACTIONS:(.*?)$/s);

    const summary = summaryMatch ? summaryMatch[1].trim() : "";
    const positives =
      positivesMatch && positivesMatch[1].trim().length > 0
        ? positivesMatch[1]
            .trim()
            .split("\n")
            .map((item) => item.replace(/^-\s*/, "").trim())
            .filter((item) => item.length > 0)
            .filter((item) => item.split(" ").length <= 3)
        : [];
    const negatives =
      negativesMatch && negativesMatch[1].trim().length > 0
        ? negativesMatch[1]
            .trim()
            .split("\n")
            .map((item) => item.replace(/^-\s*/, "").trim())
            .filter((item) => item.length > 0)
            .filter((item) => item.split(" ").length <= 3)
        : [];

    // Parse action items with their categories
    const actionItems =
      actionsMatch && actionsMatch[1].trim().length > 0
        ? actionsMatch[1]
            .trim()
            .split("\n")
            .map((item) => item.replace(/^-\s*/, "").trim())
            .filter((item) => item.length > 0)
            .map((item) => {
              const categoryMatch = item.match(/^\[([^\]]+)\]\s*(.*)/);
              if (categoryMatch) {
                return { category: categoryMatch[1].trim(), action: categoryMatch[2].trim(), source: "ai" };
              }
              return { category: "General", action: item, source: "ai" };
            })
        : [];

    return {
      summary,
      positives,
      negatives,
      actionItems,
    };
  } catch (error) {
    console.error("Error analyzing reviews:", error);
    if (error.response) {
      console.error("OpenRouter API error response:", error.response.data);
    }

    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error("OpenRouter API timeout - returning fallback response");
      return {
        summary: "Review analysis timed out. Please try again with a smaller date range.",
        positives: [],
        negatives: [],
        actionItems: [],
        timeout: true
      };
    }

    throw error;
  }
};

// Add review analysis endpoint
app.get("/api/analytics/review-analysis", async (req, res) => {
  const { startDate, endDate, propertyName, skipCache } = req.query;

  // Validate required parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: startDate and endDate",
      received: { startDate, endDate },
    });
  }

  try {
    console.log(
      `[DEBUG] Starting review analysis for period: ${startDate} to ${endDate}`
    );

    const cacheParams = {
      startDate,
      endDate,
      propertyName: propertyName || "all",
    };

    const result = await cache.withCache(
      "review-analysis",
      cacheParams,
      async () => {
        // Fetch reviews
        let query = `
        SELECT latest_review_comment as review, latest_review_rating as rating
        FROM proc_checkout2_mv
        WHERE cb_checkout_date >= $1
          AND cb_checkout_date <= $2
          AND latest_review_comment IS NOT NULL
      `;

        const params = [startDate, endDate];
        let paramCount = 2;

        if (propertyName) {
          paramCount++;
          query += ` AND operator_name = $${paramCount}`;
          params.push(propertyName);
          console.log(`[DEBUG] Filtering by property: ${propertyName}`);
        }

        // Limit to most recent 10k reviews to prevent memory/payload blowup on large date ranges
        query += ` ORDER BY cb_checkout_date DESC LIMIT 10000`;

        console.log(`[DEBUG] Executing SQL query to fetch reviews`);
        const queryResult = await analyticsPool.query({
          text: query,
          values: params,
          statement_timeout: 120000 // 2 minutes in milliseconds
        });
        console.log(
          `[DEBUG] Found ${queryResult.rows.length} reviews to analyze`
        );

        if (queryResult.rows.length === 0) {
          return {
            success: true,
            message: "No reviews found for the specified period",
            data: {
              reviews_analyzed: 0,
              summary: null,
              positives: [],
              negatives: [],
            },
          };
        }

        // Skip AI analysis if fewer than 5 textual reviews — not enough data for meaningful insights
        if (queryResult.rows.length < 5) {
          console.log(`[DEBUG] Only ${queryResult.rows.length} reviews — skipping AI analysis (minimum 5 required)`);
          return {
            success: true,
            data: {
              reviews_analyzed: queryResult.rows.length,
              summary: "Not enough textual reviews for AI analysis. At least 5 reviews with comments are needed.",
              positives: [],
              negatives: [],
              actionItems: [],
              insufficient_data: true,
            },
          };
        }

        // Analyze reviews using OpenRouter
        console.log(
          `[DEBUG] Starting OpenRouter analysis for ${queryResult.rows.length} reviews`
        );
        const analysis = await analyzeReviews(queryResult.rows);
        console.log(`[DEBUG] OpenRouter analysis completed successfully`);

        return {
          success: true,
          data: {
            reviews_analyzed: queryResult.rows.length,
            summary: analysis.summary,
            positives: analysis.positives,
            negatives: analysis.negatives,
            actionItems: analysis.actionItems || [],
          },
        };
      },
      skipCache === "true"
    );

    res.json(result);
  } catch (error) {
    console.error("[DEBUG] Error in review analysis:", error);
    if (error.response) {
      console.error("[DEBUG] API error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    // If it's a rate limit error, return an honest fallback — no fake data
    if (error.response && error.response.status === 429) {
      console.log("[DEBUG] Rate limit exceeded, returning honest fallback response");
      return res.json({
        success: true,
        data: {
          reviews_analyzed: 0,
          summary: "AI analysis is temporarily unavailable due to rate limiting. Please try again in a few minutes.",
          positives: [],
          negatives: [],
          actionItems: [],
        },
        fallback: true,
        rate_limit_hit: true,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to analyze reviews",
      details: error.message,
    });
  }
});

// Lightweight endpoint for chain-wide average rating + per-property ranking (used by PM shared view for benchmarking)
app.get("/api/analytics/chain-average", async (req, res) => {
  const { startDate, endDate, propertyName, skipCache } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: startDate and endDate",
    });
  }

  try {
    const cacheParams = { startDate, endDate, propertyName: propertyName || "all" };

    const result = await cache.withCache(
      "chain-average",
      cacheParams,
      async () => {
        // Get chain-wide stats
        const chainQuery = `
          SELECT
            ROUND(AVG(latest_review_rating)::numeric, 2) as avg_rating,
            COUNT(*) as total_reviews,
            COUNT(DISTINCT operator_name) as total_properties,
            COUNT(DISTINCT cb_booking_id) as total_checkouts
          FROM proc_checkout2_mv
          WHERE cb_checkout_date >= $1
            AND cb_checkout_date <= $2
            AND latest_review_rating IS NOT NULL
        `;

        // Get per-property rankings
        const rankingQuery = `
          SELECT
            operator_name as property_name,
            ROUND(AVG(latest_review_rating)::numeric, 2) as avg_rating,
            COUNT(*) as review_count
          FROM proc_checkout2_mv
          WHERE cb_checkout_date >= $1
            AND cb_checkout_date <= $2
            AND latest_review_rating IS NOT NULL
          GROUP BY operator_name
          ORDER BY avg_rating DESC, review_count DESC
        `;

        const [chainResult, rankingResult] = await Promise.all([
          analyticsPool.query({ text: chainQuery, values: [startDate, endDate], statement_timeout: 120000 }),
          analyticsPool.query({ text: rankingQuery, values: [startDate, endDate], statement_timeout: 120000 }),
        ]);

        const chainRow = chainResult.rows[0];
        const rankings = rankingResult.rows.map((row, index) => ({
          rank: index + 1,
          property_name: row.property_name,
          avg_rating: parseFloat(row.avg_rating) || 0,
          review_count: parseInt(row.review_count) || 0,
        }));

        // Find the requesting property's rank if specified
        let propertyRank = null;
        if (propertyName) {
          propertyRank = rankings.find(
            (r) => r.property_name.toLowerCase() === propertyName.toLowerCase()
          ) || null;
        }

        return {
          success: true,
          data: {
            avg_rating: parseFloat(chainRow.avg_rating) || 0,
            total_reviews: parseInt(chainRow.total_reviews) || 0,
            total_properties: parseInt(chainRow.total_properties) || 0,
            total_checkouts: parseInt(chainRow.total_checkouts) || 0,
            review_rate: chainRow.total_checkouts > 0
              ? parseFloat(((chainRow.total_reviews / chainRow.total_checkouts) * 100).toFixed(1))
              : 0,
            property_rank: propertyRank,
            top_3: rankings.slice(0, 3),
          },
        };
      },
      skipCache === "true"
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching chain average:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chain average",
      details: error.message,
    });
  }
});

// Inventory-wise (room type) rating breakdown
app.get("/api/analytics/inventory-ratings", async (req, res) => {
  const { startDate, endDate, propertyName, skipCache } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: "startDate and endDate are required" });
  }

  try {
    const cacheParams = { startDate, endDate, propertyName: propertyName || "all" };
    const result = await cache.withCache(
      "inventory-ratings",
      cacheParams,
      async () => {
        // Step 1: Get reviews with booking IDs and codes from analyticsPool
        const reviewParams = [startDate, endDate];
        let propertyFilter = "";
        if (propertyName) {
          reviewParams.push(propertyName);
          propertyFilter = `AND operator_name = $3`;
        }

        const reviewQuery = `
          SELECT
            cb_booking_id as booking_id,
            cb_booking_code as booking_code,
            latest_review_rating as rating,
            latest_review_comment as comment,
            operator_name as property_name
          FROM proc_checkout2_mv
          WHERE cb_checkout_date >= $1
            AND cb_checkout_date <= $2
            AND latest_review_rating IS NOT NULL
            ${propertyFilter}
          ORDER BY cb_checkout_date DESC
          LIMIT 50000
        `;

        const reviewResult = await analyticsPool.query({
          text: reviewQuery,
          values: reviewParams,
          statement_timeout: 60000,
        });

        if (reviewResult.rows.length === 0) {
          return { success: true, data: [] };
        }

        // Step 2: Get room names from core_booking on main DB (pool)
        // Try matching by both id AND code since cb_booking_id might not align with core_booking.id
        const bookingIds = [...new Set(reviewResult.rows.map(r => r.booking_id).filter(Boolean))];
        const bookingCodes = [...new Set(reviewResult.rows.map(r => r.booking_code).filter(Boolean))];
        if (bookingIds.length === 0 && bookingCodes.length === 0) {
          return { success: true, data: [] };
        }

        // Query by ID first, then by code as fallback — combine results
        let roomsResult = { rows: [] };
        try {
          if (bookingIds.length > 0) {
            roomsResult = await pool.query(
              `SELECT id, code, rooms FROM core_booking WHERE id = ANY($1) AND rooms IS NOT NULL`,
              [bookingIds]
            );
          }
          // If ID matching found nothing, try matching by booking code
          if (roomsResult.rows.length === 0 && bookingCodes.length > 0) {
            roomsResult = await pool.query(
              `SELECT id, code, rooms FROM core_booking WHERE code = ANY($1) AND rooms IS NOT NULL`,
              [bookingCodes]
            );
          }
        } catch (dbErr) {
          console.warn("[WARN] Could not fetch rooms from core_booking:", dbErr.message);
          return { success: true, data: [] };
        }

        // Parse rooms JSONB — key by both id and code for flexible matching
        const roomsByBookingId = {};
        const roomsByBookingCode = {};
        for (const row of roomsResult.rows) {
          try {
            const roomsArr = typeof row.rooms === "string" ? JSON.parse(row.rooms) : row.rooms;
            if (Array.isArray(roomsArr)) {
              const names = [];
              for (const room of roomsArr) {
                const name = room.name || room.room_name || room.type;
                if (name) names.push(name);
              }
              if (names.length > 0) {
                roomsByBookingId[row.id] = names;
                if (row.code) roomsByBookingCode[row.code] = names;
              }
            }
          } catch (e) { /* skip unparseable */ }
        }

        // Step 3: Join in-memory and aggregate per inventory name
        const inventoryStats = {};
        for (const review of reviewResult.rows) {
          const roomNames = roomsByBookingId[review.booking_id] || roomsByBookingCode[review.booking_code];
          if (!roomNames || roomNames.length === 0) continue;

          for (const invName of roomNames) {
            if (!inventoryStats[invName]) {
              inventoryStats[invName] = { review_count: 0, total_rating: 0, positive_count: 0, negative_count: 0, text_review_count: 0 };
            }
            const stat = inventoryStats[invName];
            stat.review_count++;
            stat.total_rating += parseFloat(review.rating);
            if (review.rating >= 4) stat.positive_count++;
            if (review.rating <= 2) stat.negative_count++;
            if (review.comment && review.comment.trim()) stat.text_review_count++;
          }
        }

        // Step 4: Format and sort
        const data = Object.entries(inventoryStats)
          .map(([name, stat]) => ({
            inventory_name: name,
            review_count: stat.review_count,
            avg_rating: parseFloat((stat.total_rating / stat.review_count).toFixed(2)),
            positive_count: stat.positive_count,
            negative_count: stat.negative_count,
            text_review_count: stat.text_review_count,
          }))
          .sort((a, b) => b.review_count - a.review_count);

        return { success: true, data };
      },
      skipCache === "true"
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching inventory ratings:", error);

    if (error.message && (error.message.includes("cannot extract") || error.message.includes("does not exist"))) {
      return res.json({
        success: true,
        data: [],
        note: "Room type data is not available in the expected format.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch inventory ratings",
      details: error.message,
    });
  }
});

// Add new endpoint to get WATI templates
app.get("/api/wati/get-templates", async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.WATI_API_ENDPOINT}/api/v1/getMessageTemplates`,
      {
        headers: {
          Authorization: process.env.WATI_ACCESS_TOKEN,
        },
      }
    );

    // Filter and map the templates to only include specified fields
    const filteredTemplates = response.data.messageTemplates.map(
      (template) => ({
        id: template.id,
        templateName: template.elementName,
        category: template.category,
        customParams: template.customParams,
        status: template.status,
        body: template.body,
        header: template.header,
        footer: template.footer,
        buttons: template.buttons,
      })
    );

    // Return the filtered templates data
    res.json({
      success: true,
      templates: filteredTemplates,
      pagination: response.data.link,
    });
  } catch (error) {
    console.error("Error fetching WATI templates:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates",
      details: error.message,
    });
  }
});

// Add new endpoint for average ratings by property
app.get("/api/analytics/average-ratings", async (req, res) => {
  const { startDate, endDate } = req.query;

  // Validate required parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: startDate and endDate",
      received: { startDate, endDate },
    });
  }

  try {
    const query = `
      SELECT
        operator_name AS property_name,
        AVG(latest_review_rating) AS average_rating
      FROM
        proc_checkout2_mv
      WHERE
        cb_checkout_date >= $1
        AND cb_checkout_date <= $2
        AND latest_review_rating IS NOT NULL
      GROUP BY
        operator_name
      ORDER BY
        average_rating DESC
    `;

    const result = await analyticsPool.query(query, [startDate, endDate]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching average ratings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch average ratings",
      details: error.message,
    });
  }
});

// Add cache management endpoints
app.get("/api/cache/status", async (req, res) => {
  try {
    const keys = await redisClient.keys('ops-backend:*');
    const info = await redisClient.info('memory');

    res.json({
      success: true,
      cache_status: {
        total_keys: keys.length,
        keys: keys.slice(0, 10), // Show first 10 keys
        memory_info: info
      }
    });
  } catch (error) {
    console.error("Error getting cache status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cache status",
      details: error.message,
    });
  }
});

app.post("/api/cache/clear", async (req, res) => {
  try {
    await cache.clear();
    res.json({
      success: true,
      message: "Cache cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
      details: error.message,
    });
  }
});

// ============ NATURAL LANGUAGE QUERY ENDPOINTS ============

// POST /api/analytics/nl-query — Two-step: pick tables, then generate SQL
app.post("/api/analytics/nl-query", async (req, res) => {
  const { question, properties, isAdmin, dateRange, currentProperty } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({
      success: false,
      error: humanizeQueryError(null, "empty_question"),
    });
  }

  // Block cross-property queries for non-"All Properties" users
  if (currentProperty) {
    const currentLocation = currentProperty.replace(/^(zostel|zostel\s+plus|zostel\s+homes|zo\s+house)\s+/i, "").toLowerCase().trim();
    const currentFirstWord = currentLocation.replace(/^(plus|homes)\s+/i, "").split(/[\s(]/)[0].trim();
    const questionLower = question.toLowerCase();

    // Method 1: Check "Zostel <location>" mentions
    const propertyMentionRegex = /\b(?:zostel|zostel\s+plus|zostel\s+homes)\s+([a-z]+(?:\s*\([^)]*\))?)/gi;
    const mentions = [...question.matchAll(propertyMentionRegex)];
    for (const match of mentions) {
      const mentionedLocation = match[1].trim().toLowerCase();
      if (mentionedLocation !== currentLocation && mentionedLocation !== currentFirstWord &&
          !currentLocation.includes(mentionedLocation) && !mentionedLocation.includes(currentLocation)) {
        return res.status(403).json({
          success: false,
          error: `You're currently viewing ${currentProperty}. You can only query data for this property. Switch to "All Properties" to query across properties.`,
        });
      }
    }

    // Method 2: Check bare property location names (e.g., "Panchgani" without "Zostel" prefix)
    const propertyLocations = await getPropertyLocations();
    // Skip generic brand words and common words that aren't location-specific
    const skipWords = new Set(["zostel", "plus", "homes", "house", "home", "test"]);
    for (const [location, fullName] of propertyLocations) {
      if (location.length < 4) continue; // skip very short names to avoid false positives
      if (skipWords.has(location)) continue; // skip brand/generic words
      // Check if this location appears as a word in the question
      const locRegex = new RegExp(`\\b${location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (locRegex.test(questionLower)) {
        // It's mentioned — check if it's a different property
        const isSameProperty = location === currentLocation || location === currentFirstWord ||
          currentLocation.includes(location) || location.includes(currentFirstWord);
        if (!isSameProperty) {
          return res.status(403).json({
            success: false,
            error: `You're currently viewing ${currentProperty}. You can only query data for this property. Switch to "All Properties" to query across properties.`,
          });
        }
      }
    }

    // Method 3: Block "all properties" / "every property" / "across all" / "company-wide" queries from a property page
    const allPropsRegex = /\b(all\s+propert(y|ies)|every\s+propert(y|ies)|across\s+all|company[\s-]?wide|all\s+zostels?|all\s+locations?|chain[\s-]?wide|all\s+hostels?|every\s+hostels?|every\s+locations?)\b/i;
    if (allPropsRegex.test(question)) {
      return res.status(403).json({
        success: false,
        error: `You're currently viewing ${currentProperty}. You can only query data for this property. Switch to "All Properties" to see data across all properties.`,
      });
    }
  }

  if (question.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Question is too long. Please keep it under 1000 characters.",
    });
  }

  if (!NL_QUERY_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Natural language query is not configured. Please set up the API key.",
    });
  }

  try {
    // 1. Get full schema (cached)
    const { schema, tableList } = await getAnalyticsSchema();

    // 2. STEP 1: Ask LLM to pick relevant tables (cheap — only table names sent)
    console.log("[NL Query] Step 1: Picking relevant tables...");
    let relevantTableNames;
    try {
      const tablePickPrompt = `You are a database expert. Given the list of database tables below, identify which tables are most likely needed to answer the user's question.

AVAILABLE TABLES:
${tableList}

IMPORTANT TABLE NOTES:
- "proc_checkout2_mv" is the PRIMARY data source for PAST/HISTORICAL data. It has checked-out bookings with guest, review, and property data. Use for past questions.
- "zostel_core_booking" has ALL bookings including FUTURE/CURRENT. Use for "tomorrow", "next week", "upcoming", "currently staying" questions. ALWAYS pair with "zostel_core_booking_guests" and "zostel_core_bookingguest" for guest details.
- For PAST questions about bookings, checkouts, guests, reviews, properties — include "proc_checkout2_mv".
- For FUTURE/CURRENT questions (tomorrow, upcoming, next week) — include "zostel_core_booking", "zostel_core_booking_guests", "zostel_core_bookingguest", and "zostel_core_operator".
- "zostel_core_operator" has property/hostel metadata (name, code, city, state, type).
- "proc_user_data_plus" has rich user analytics (total bookings, zostels stayed, recency, new guest flag, nights stayed, cities, friends). Use for user/guest behavior questions.
- "zostel_core_bookingguest" has guest profile details. "zostel_core_booking_guests" links bookings to guests.
- For REVENUE questions: ALWAYS use "proc_zostel_monthly_revenue" (monthly, has "Property" name + curr_revenue — most reliable for historical revenue). Also include "rev_weekly_yoy_property" for weekly revenue (has property_name). Use "proc_d1_7_rev_occ_rns2" ONLY for forward-looking (next 7 days) revenue/occupancy. DO NOT use "proc_zostel_daily_revenue" — it's sparse and incomplete (only ~30 properties, mostly cancellation/no-show rows, NOT actual realised revenue).
- For OCCUPANCY questions (historical/past): use "property_occupancy_mv" (has property_name, stay_date, occupied_rooms, total_rooms — one row per property per day, back to 2016). Compute occupancy as: ROUND(occupied_rooms::numeric / NULLIF(total_rooms, 0) * 100, 2).
- For OCCUPANCY (forward-looking next 7 days): use "proc_d1_7_rev_occ_rns" (pre-aggregated, one row per property, has d1_occupancy_pct through d14_occupancy_pct columns). DO NOT use "proc_d1_7_rev_occ_rns2" for occupancy — it has per-source rows that will give duplicate/wrong results.
- For OCCUPANCY snapshot (yesterday, MTD, last 14 days): use "mv_realized_rev_occ_daily" (one row per property, has "Occupancy %", "MTD Occupancy %", "Occupancy % (Last 14 Days)", "Total Units", "Units Occupied (Yday)").
- For OCCUPANCY (weekly): use "weekly_property_occupancy_report" (has property, "Last Week Occ %", mtd_occupancy_current).
- For OCCUPANCY on future dates / festivals / events beyond 7 days: use "zostel_core_booking" + "zostel_core_operator" (count active bookings overlapping the target date).
- For DEMAND/GBV questions: use "proc_daily_demand_report" or "proc_demand_gbv_arrival_month".
- For BOOKING SOURCE / OTA / CHANNEL questions: use "zostel_core_booking" + "zostel_core_operatorbookingsource" + optionally "core_source_mapping". Do NOT rely on proc_checkout2_mv.cb_origin (it's always 1).
- For "loyal guests" / "top guests" / "repeat guests" at a property: use "proc_checkout2_mv" ONLY (count bookings per guest with property filter). Do NOT use proc_user_data_plus for property-level loyalty — its total_zostel_bookings is chain-wide.

USER QUESTION: ${question.trim()}

Return ONLY a JSON array of table names, nothing else. Example: ["table1", "table2"]
Pick only the tables that are directly relevant (usually 1-5 tables). ALWAYS include "proc_checkout2_mv" for booking/checkout/review/guest/property questions.`;

      const tablePickResponse = await callLLM(tablePickPrompt, 500);

      // Parse table names from response
      const jsonMatch = tablePickResponse.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        relevantTableNames = JSON.parse(jsonMatch[0]).map(t => t.toLowerCase().trim());
      } else {
        relevantTableNames = Object.keys(schema).slice(0, 20); // fallback: first 20 tables
      }
      console.log(`[NL Query] Step 1 selected ${relevantTableNames.length} tables:`, relevantTableNames);
    } catch (step1Error) {
      console.error("[NL Query] Step 1 error:", step1Error.message);
      // Fallback: use all tables with "core_", "proc_", "booking" in name
      relevantTableNames = Object.keys(schema).filter(t =>
        t.startsWith("core_") || t.startsWith("proc_") || t.includes("booking") || t.includes("review") || t.includes("operator")
      );
      console.log(`[NL Query] Step 1 fallback: ${relevantTableNames.length} tables`);
    }

    // 3. STEP 1.5: Build schema + auto-sample data from selected tables
    const detailedSchema = getSchemaForTables(schema, relevantTableNames);
    console.log(`[NL Query] Step 1.5: Fetching sample data for ${relevantTableNames.length} tables...`);
    const sampleData = await getSampleData(relevantTableNames);
    const sampleStr = formatSampleData(sampleData);
    console.log(`[NL Query] Step 2: Generating SQL (schema: ${detailedSchema.length} chars, samples: ${sampleStr.length} chars)...`);

    // Date context — LLM interprets time from the question itself, dashboard dates only as fallback
    const currentYear = new Date().getFullYear();
    const dateContext = `\nDATE INTERPRETATION: Derive the time range from the user's question. Today is ${new Date().toISOString().split('T')[0]}. Examples:
- "this month" = date_trunc('month', CURRENT_DATE) to CURRENT_DATE
- "last month" = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') to date_trunc('month', CURRENT_DATE) - INTERVAL '1 day'
- "today" = CURRENT_DATE
- "yesterday" = CURRENT_DATE - INTERVAL '1 day'
- "last 7 days" / "last week" = CURRENT_DATE - INTERVAL '7 days' to CURRENT_DATE
- "last 30 days" = CURRENT_DATE - INTERVAL '30 days' to CURRENT_DATE
- "this year" = date_trunc('year', CURRENT_DATE) to CURRENT_DATE
- Indian festivals/holidays: Resolve to approximate dates. Holi ${currentYear} = ~March 14 ${currentYear}, Diwali ${currentYear} = ~October/November ${currentYear}, Christmas = Dec 25, New Year = Jan 1. For festival occupancy, check bookings around that date (±2 days).
- If the question mentions a FUTURE date/festival, use zostel_core_booking (has future bookings). For PAST dates, use proc_checkout2_mv.
- If NO time reference in the question${dateRange && dateRange.startDate ? `, use fallback range: ${dateRange.startDate} to ${dateRange.endDate}` : ", include ALL data (no date filter)"}
\n`;

    // Build property context
    const escapedProperty = currentProperty ? currentProperty.replace(/'/g, "''") : "";
    const propertyContext = currentProperty
      ? `\n⚠️ MANDATORY PROPERTY FILTER — YOU MUST APPLY THIS:
The user is viewing "${currentProperty}". ALL queries MUST filter to this property only.
Words like "our", "we", "my", "this property" refer to "${currentProperty}".
You MUST add a WHERE clause filtering to this property in EVERY query. No exceptions.

Use the correct filter column for each table:
- proc_checkout2_mv: WHERE operator_name = '${escapedProperty}'
- zostel_core_operator: WHERE name = '${escapedProperty}'
- proc_zostel_monthly_revenue: WHERE "Property" = '${escapedProperty}'
- proc_d1_7_rev_occ_rns2: WHERE property_name = '${escapedProperty}'
- proc_d1_7_rev_occ_rns: WHERE property = '${escapedProperty}'
- property_occupancy_mv: WHERE property_name = '${escapedProperty}'
- mv_realized_rev_occ_daily: WHERE property = '${escapedProperty}'
- weekly_property_occupancy_report: WHERE property = '${escapedProperty}'
- proc_user_data_plus: JOIN with proc_checkout2_mv and filter by operator_name = '${escapedProperty}'
- rev_weekly_yoy_property: WHERE property_name = '${escapedProperty}'
Use ILIKE '%keyword%' if unsure of exact casing/name match.\n`
      : "";

    const sqlPrompt = `You are a PostgreSQL expert. Convert the user's question into a single SELECT query using the schema and sample data below.

DATABASE SCHEMA:
${detailedSchema}
${sampleStr}
${dateContext}${propertyContext}
KEY TABLES:
- proc_checkout2_mv: PAST DATA ONLY — checked-out bookings with guest/review data. Use for historical queries. Filter by cb_checkout_date.
  COUNTING (important — guests ≠ checkouts):
  - Total CHECKOUTS/BOOKINGS = COUNT(DISTINCT cb_booking_code) — unique bookings
  - Total GUESTS/PEOPLE/CUSTOMERS = COUNT(cb_booking_code) — all rows (one row per guest; group bookings have multiple guests)
  Pick the right count: "guests"/"people"/"customers" → COUNT(cb_booking_code), "bookings"/"checkouts" → COUNT(DISTINCT cb_booking_code)
- zostel_core_booking: ALL bookings including FUTURE/CURRENT ones. Has start_date, end_date, status, operator_id. Use for "tomorrow", "next week", "upcoming", or current occupancy queries. status=2 means confirmed, status=3 means checked-in.
  - To find guests staying on a specific date: WHERE start_date <= '{date}' AND end_date > '{date}'
- zostel_core_bookingguest: guest profile (gender, name, email, mobile). Gender values: 'M', 'F', 'O' (single chars, NOT 'Male'/'Female').
- zostel_core_booking_guests: links bookings to guests (booking_id, bookingguest_id)
- Revenue tables (ORDER OF PREFERENCE):
  1. proc_zostel_monthly_revenue: BEST for historical revenue. Has "Property" (property name string), curr_revenue, prev_revenue, month_start_date, year, month_number, is_current_month. Filter by year + month_number. For "last 30 days" or date ranges, SUM curr_revenue across relevant months.
  2. rev_weekly_yoy_property: weekly revenue per property. Has property_name, revenue_last_week, revenue_same_week_last_year, delta_pct. Good for "last week" revenue comparisons.
  3. proc_d1_7_rev_occ_rns2: FORWARD-LOOKING only (next 7 days). Has property_name, operator_id, day_date, revenue_day, source_l1, source_l2. Use ONLY for forward-looking REVENUE (not occupancy — has per-source duplicate rows).
  4. DO NOT use proc_zostel_daily_revenue — it's SPARSE (only ~30 of 90 properties), mostly has cancellation/no-show rows, and will return wrong/null results for most properties.
- Occupancy tables (ORDER OF PREFERENCE):
  1. property_occupancy_mv: BEST for historical daily occupancy (2016 to present). Has property_name, stay_date, occupied_rooms, total_rooms. Compute occupancy: ROUND(occupied_rooms::numeric / NULLIF(total_rooms, 0) * 100, 2) AS occupancy_pct. One row per property per day.
  2. mv_realized_rev_occ_daily: SNAPSHOT of yesterday/MTD/14-day occupancy. One row per property. Columns: property, "Occupancy %" (yesterday), "MTD Occupancy %", "Occupancy % (Last 14 Days)", "Total Units", "Available Units (Yday)", "Units Occupied (Yday)". Use for "what's our current occupancy" or "yesterday's occupancy".
  3. proc_d1_7_rev_occ_rns: FORWARD-LOOKING occupancy (pre-aggregated, one row per property). Has d1_occupancy_pct through d14_occupancy_pct, d1_7_occupancy_pct (7-day average). Use for "tomorrow's occupancy", "next week occupancy".
  4. weekly_property_occupancy_report: Weekly occupancy per property. Has property, "Last Week Occ %", "LY Occ %" (last year same week), mtd_occupancy_current, mtd_occupancy_ly.
  5. ⚠️ DO NOT use proc_d1_7_rev_occ_rns2 for occupancy — it has per-booking-source rows (OTA, Offline, etc.) causing duplicate dates and wrong occupancy totals.
- zostel_core_operator: property metadata (name, code, city, state, type)
- Booking source / OTA tables:
  - zostel_core_operatorbookingsource: lookup table for booking sources (id, name like 'Booking.com', 'Goibibo', 'HostelWorld', 'Zostel - Website', 'Walk In', etc.)
  - core_source_mapping: maps source_name → source_group ('OTA', 'Zostel Sources', 'Walk-in', 'Offline Sources')
  - For "which OTA" or "booking source" questions: JOIN zostel_core_booking.source_id = zostel_core_operatorbookingsource.id to get source name. Then optionally JOIN core_source_mapping ON zostel_core_operatorbookingsource.name = core_source_mapping.source_name for source group.
  - proc_checkout2_mv does NOT have source/OTA information (cb_origin is always 1). Use zostel_core_booking for source data.

KEY RELATIONSHIPS:
- proc_checkout2_mv.cb_operator_id = zostel_core_operator.id
- proc_checkout2_mv.cbg_bookingguest_id = zostel_core_bookingguest.id
- zostel_core_booking.operator_id = zostel_core_operator.id
- zostel_core_booking_guests.booking_id = zostel_core_booking.id
- zostel_core_booking_guests.bookingguest_id = zostel_core_bookingguest.id
- To get guest details for a booking: zostel_core_booking → zostel_core_booking_guests → zostel_core_bookingguest
- proc_d1_7_rev_occ_rns2.operator_id = zostel_core_operator.id (also has property_name directly — no join needed for property name)
- property_occupancy_mv.property_name = zostel_core_operator.name (no join needed — property_name already contains property names)
- mv_realized_rev_occ_daily.property = zostel_core_operator.name (no join needed)
- proc_d1_7_rev_occ_rns.property = zostel_core_operator.name (no join needed)
- weekly_property_occupancy_report.property = zostel_core_operator.name (no join needed)
- proc_zostel_monthly_revenue."Property" = zostel_core_operator.name (exact match, no join needed — "Property" column already contains property names like 'Zostel Plus Panchgani')
- proc_user_data_plus → filter by property using mobile_number: WHERE mobile_number IN (SELECT DISTINCT bg_mobile FROM proc_checkout2_mv WHERE operator_name = 'PropertyName'). WARNING: mv_uid in proc_user_data_plus is a surrogate row ID — do NOT use it to join with other tables.
- ⚠️ "LOYAL GUESTS" / "TOP GUESTS" / "REPEAT GUESTS" at a specific property: Do NOT use proc_user_data_plus.total_zostel_bookings (that's chain-wide). Instead, count bookings directly from proc_checkout2_mv grouped by bg_name/bg_mobile with the property filter applied. Example: SELECT bg_name, bg_mobile, COUNT(DISTINCT cb_booking_code) AS visits FROM proc_checkout2_mv WHERE operator_name = 'PropertyName' GROUP BY bg_name, bg_mobile ORDER BY visits DESC LIMIT 10.
- Booking source / OTA breakdown: zostel_core_booking.source_id → zostel_core_operatorbookingsource.id (has name like 'Booking.com', 'Goibibo', 'HostelWorld'). For source GROUP (OTA vs Zostel Sources vs Walk-in), use core_source_mapping (source_name → source_group). Forward-looking source breakdown: proc_d1_7_rev_occ_rns2 has source_l1 (group) and source_l2 (specific OTA).

CHOOSING THE RIGHT TABLE:
- Past/historical questions (last month, yesterday, this year) → use proc_checkout2_mv
- Future/current questions (tomorrow, next week, upcoming, currently staying) → use zostel_core_booking + zostel_core_booking_guests + zostel_core_bookingguest
- Revenue (historical/past) → use proc_zostel_monthly_revenue. Filter by year + month_number. "Property" has property name strings (e.g., 'Zostel Plus Panchgani'). curr_revenue has the amount per month.
  - "this month" → WHERE is_current_month = 1
  - "last month" → WHERE year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') AND month_number = LPAD(EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::text, 2, '0')
  - "last 30 days" → SUM of current month + previous month: WHERE (is_current_month = 1) OR (year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') AND month_number = LPAD(EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::text, 2, '0'))
  - "this year" → WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
  - NOTE: This table has MONTHLY granularity. "Last 30 days" returns sum of current + previous month (approximate).
- Revenue (last week / weekly) → use rev_weekly_yoy_property. Has property_name and revenue_last_week.
- Revenue (forward-looking next 7 days) → use proc_d1_7_rev_occ_rns2. Has property_name, day_date, revenue_day. SUM(revenue_day) per day_date for total daily revenue.
- Occupancy (historical/past — "which dates had low occupancy", "occupancy last month", etc.) → use property_occupancy_mv. Has stay_date, occupied_rooms, total_rooms. Compute: ROUND(occupied_rooms::numeric / NULLIF(total_rooms, 0) * 100, 2) AS occupancy_pct.
- Occupancy (yesterday / current / MTD / last 14 days snapshot) → use mv_realized_rev_occ_daily. One row per property. Use "Occupancy %" for yesterday, "MTD Occupancy %" for month-to-date, "Occupancy % (Last 14 Days)" for 14-day average.
- Occupancy (forward-looking next 7-14 days) → use proc_d1_7_rev_occ_rns. One row per property. Use d1_occupancy_pct (tomorrow), d2_occupancy_pct (day after), etc. d1_7_occupancy_pct for 7-day average.
- Occupancy (weekly comparison / YoY) → use weekly_property_occupancy_report. Has "Last Week Occ %", mtd_occupancy_current, and LY comparisons.
- Occupancy (future dates beyond 14 days, festivals, events) → use zostel_core_booking. Count bookings where start_date <= target_date AND end_date > target_date AND status IN (2,3).
- ⚠️ DO NOT use proc_d1_7_rev_occ_rns2 for occupancy — it has per-source duplicate rows that will give wrong results.
- NEVER use proc_zostel_daily_revenue for per-property revenue — it's incomplete and will give wrong results.

RULES:
- Return ONLY the raw SQL query. No explanation, no markdown, no code fences.
- IMPORTANT: Column names shown in double quotes (like "Property") MUST be double-quoted in SQL. PostgreSQL is case-sensitive for quoted identifiers.
- Use SAMPLE DATA above to understand actual column values, enum codes, and data patterns. Match the exact values you see.
- Use only tables and columns that exist in the schema above.
- Do NOT guess foreign keys — use KEY RELATIONSHIPS or match on column names visible in sample data.
- For booking/checkout counts: COUNT(DISTINCT cb_booking_code). For guest counts: COUNT(cb_booking_code). See COUNTING guide above.
- REVIEW RATINGS (proc_checkout2_mv.latest_review_rating, scale 1-10):
  - "low rating" / "negative reviews" / "bad reviews" = WHERE ROUND(latest_review_rating) <= 3
  - "critical reviews" = WHERE ROUND(latest_review_rating) <= 2
  - "positive reviews" / "good reviews" = WHERE ROUND(latest_review_rating) >= 4
  - "1 star reviews" = WHERE latest_review_rating = 1 (exact)
  - "5 star reviews" = WHERE latest_review_rating = 5 (exact)
  - Reviews exist when latest_review_rating IS NOT NULL.
- For revenue questions, ALWAYS use proc_zostel_monthly_revenue (historical) or rev_weekly_yoy_property (weekly). Use proc_d1_7_rev_occ_rns2 ONLY for forward-looking revenue. NEVER use proc_zostel_daily_revenue.
- When matching property names, use ILIKE '%keyword%' for fuzzy matching (e.g., ILIKE '%panchgani%' to match 'Zostel Plus Panchgani').
- Add ORDER BY when results should be ranked or sorted.
- Add LIMIT when the question asks for "top N" or similar.
- Return a single SELECT statement only.

USER QUESTION: ${question.trim()}`;

    let rawSql;
    try {
      rawSql = await callLLM(sqlPrompt, 2000);
    } catch (llmError) {
      console.error("[NL Query] Step 2 LLM error:", llmError.message);
      const context = llmError.code === "ECONNABORTED" ? "llm_timeout" : "llm_failure";
      return res.status(502).json({
        success: false,
        error: humanizeQueryError(llmError, context),
      });
    }

    if (!rawSql) {
      return res.status(502).json({
        success: false,
        error: humanizeQueryError(null, "no_sql"),
      });
    }

    // 4. Validate SQL
    const validation = validateAndSanitizeSQL(rawSql);
    if (!validation.valid) {
      console.log("[NL Query] Unsafe SQL rejected:", rawSql);
      return res.status(400).json({
        success: false,
        error: humanizeQueryError(null, validation.error),
      });
    }

    // 5. Apply property filter for non-admin users
    let finalSql = validation.sql;
    if (!isAdmin && properties && properties.length > 0) {
      finalSql = applyPropertyFilter(finalSql, properties, false);
    }

    // 6. Execute query (with one retry on SQL error)
    const startTime = Date.now();
    let result;
    try {
      result = await analyticsPool.query({
        text: finalSql,
        timeout: 30000,
      });
    } catch (pgError) {
      console.log(`[NL Query] PG error (will retry): ${pgError.message}`);
      // Retry: send the error back to LLM to self-correct
      try {
        const retryPrompt = `The following SQL query failed with this PostgreSQL error:

ERROR: ${pgError.message}

FAILED SQL:
${validation.sql}

AVAILABLE SCHEMA:
${detailedSchema}

Fix the query. Use ONLY columns that exist in the schema. Return ONLY the corrected raw SQL, no explanation.`;
        const retrySql = await callLLM(retryPrompt, 2000);
        const retryValidation = validateAndSanitizeSQL(retrySql);
        if (retryValidation.valid) {
          let retryFinalSql = retryValidation.sql;
          if (!isAdmin && properties && properties.length > 0) {
            retryFinalSql = applyPropertyFilter(retryFinalSql, properties, false);
          }
          result = await analyticsPool.query({ text: retryFinalSql, timeout: 30000 });
          finalSql = retryFinalSql;
          console.log(`[NL Query] Retry succeeded!`);
        } else {
          throw pgError; // retry SQL also invalid, fall through
        }
      } catch (retryError) {
        console.error("[NL Query] Retry also failed:", retryError.message);
        return res.status(400).json({
          success: false,
          error: humanizeQueryError(pgError),
          sql: validation.sql,
        });
      }
    }
    const executionTimeMs = Date.now() - startTime;

    // 7. Extract column names from result fields
    const columns = result.fields ? result.fields.map(f => f.name) : [];

    console.log(`[NL Query] SQL: ${finalSql}`);
    console.log(`[NL Query] Success: ${result.rowCount} rows in ${executionTimeMs}ms`);

    // 8. Check for all-null results and add helpful hints
    let hint = null;
    const isFutureQuery = /\b(tomorrow|next\s+week|next\s+month|upcoming|future|will\s+be)\b/i.test(question);
    if (result.rowCount === 0) {
      hint = "No data found for this query. Try adjusting the time range or being more specific.";
    } else if (result.rowCount === 1) {
      const row = result.rows[0];
      const allNull = Object.values(row).every(v => v === null);
      if (allNull) {
        hint = "The query returned no matching data. This could mean: no data exists for the specified time period, or the filters were too restrictive. Try a different time range or broader criteria.";
      }
    }
    // Add disclaimer for future/predictive queries
    if (isFutureQuery && !hint) {
      hint = "⚠️ Based on current bookings data. Actual numbers may change due to new bookings, cancellations, or modifications.";
    }

    res.json({
      success: true,
      data: {
        sql: validation.sql,
        rows: result.rows,
        rowCount: result.rowCount,
        columns,
        executionTimeMs,
        hint,
        propertyContext: currentProperty || null,
      },
    });
  } catch (error) {
    console.error("[NL Query] Unexpected error:", error);
    res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  }
});

// GET /api/analytics/nl-query/schema — Return cached DB schema
app.get("/api/analytics/nl-query/schema", async (req, res) => {
  try {
    const { schema } = await getAnalyticsSchema();
    const tableCount = Object.keys(schema).length;
    const columnCount = Object.values(schema).reduce((sum, cols) => sum + cols.length, 0);

    res.json({
      success: true,
      data: {
        tables: schema,
        tableCount,
        columnCount,
      },
    });
  } catch (error) {
    console.error("[NL Query] Schema fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch database schema.",
    });
  }
});

// Property type code to display name mapping
// Add new type_codes here when they are added to the database
const PROPERTY_TYPE_MAP = {
  'H': 'Zostel',
  'HO': 'Zo House',
  'B': 'Zostel Homes',
  'P': 'Zostel Plus',
};

// Add new endpoint for properties and slack channels
app.get("/api/properties-and-slack", async (req, res) => {
  try {
    const query = `
      SELECT
        name as property_name,
        data->>'slack_channel_id' AS slack_channel_id,
        type_code,
        code as property_code
      FROM core_operator
      WHERE status = 1
      ORDER BY name
    `;

    const result = await pool.query(query);

    // Map type_code to display name, flag unknown codes
    const data = result.rows.map(row => ({
      ...row,
      property_type: PROPERTY_TYPE_MAP[row.type_code] || `Unknown (${row.type_code})`,
    }));

    // Get unique property types (dynamic from data)
    const propertyTypes = [...new Set(data.map(r => r.property_type))].filter(t => t).sort();

    // Check for any unknown type_codes and log them
    const unknownTypeCodes = [...new Set(result.rows
      .filter(r => !PROPERTY_TYPE_MAP[r.type_code])
      .map(r => r.type_code)
    )];

    if (unknownTypeCodes.length > 0) {
      console.warn(`[Properties API] Unknown type_codes found: ${unknownTypeCodes.join(', ')}. Please add these to PROPERTY_TYPE_MAP.`);
    }

    res.json({
      success: true,
      count: data.length,
      data: data,
      propertyTypes: propertyTypes,
      unknownTypeCodes: unknownTypeCodes, // Helps identify when new types are added
    });
  } catch (error) {
    console.error("Error fetching properties and slack channels:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties and slack channels",
      details: error.message,
    });
  }
});

app.get("/api/properties-and-codes", async (req, res) => {
  try {
    const query = `
      SELECT
        name as property_name,
        code as property_code
      FROM core_operator
      WHERE status = 1
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching properties and codes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties and codes",
      details: error.message,
    });
  }
});

// Add notification API functions and endpoint
const NOTIS_URL = process.env.NOTIS_URL;
const NOTIS_HEADERS = {
  "client-key": process.env.NOTIS_CLIENT_KEY,
  "client-device-id": process.env.NOTIS_CLIENT_DEVICE_ID,
  "client-device-secret": process.env.NOTIS_CLIENT_DEVICE_SECRET,
  "Content-Type": "application/json",
};

async function createNotificationTemplate(
  templateName,
  title,
  body,
  imageUrl,
  headers
) {
  try {
    const response = await axios.post(
      `${NOTIS_URL}/api/v1/cas/templates/`,
      {
        name: templateName,
        content: {
          title: title,
          body: body || "",
          image: imageUrl || "",
        },
        channel: "fcm",
        category: "promotion",
      },
      { headers }
    );

    return response.data.id;
  } catch (error) {
    // Check for duplicate template name error
    if (
      error.response?.status === 400 &&
      error.response?.data?.name?.[0]?.includes("already exists")
    ) {
      throw new Error(
        "Campaign name already exists. Please use a different name."
      );
    }
    throw error;
  }
}

async function createMassCommunication(
  campaignName,
  templateId,
  reach = "custom",
  attributes = {},
  headers
) {
  try {
    const response = await axios.post(
      `${NOTIS_URL}/api/v1/cas/mass-communications/`,
      {
        name: campaignName,
        application: "b9e7a8a0-c21f-43e1-bf26-b023be6bc102",
        template: templateId,
        reach: reach,
        attributes: attributes,
        metadata: {},
      },
      { headers }
    );

    return response.data.id;
  } catch (error) {
    throw error;
  }
}

async function addDeliveries(massCommunicationId, userIds, headers) {
  try {
    await axios.post(
      `${NOTIS_URL}/api/v1/cas/mass-communications/${massCommunicationId}/deliveries/add/`,
      {
        users: userIds,
      },
      { headers }
    );
  } catch (error) {
    throw error;
  }
}

async function startMassCommunication(massCommunicationId, headers) {
  try {
    await axios.post(
      `${NOTIS_URL}/api/v1/cas/mass-communications/${massCommunicationId}/start/`,
      {},
      { headers }
    );
    return true;
  } catch (error) {
    throw error;
  }
}

// Add function to fetch user IDs from mobile numbers
async function getUserIdsFromMobileNumbers(mobileNumbers) {
  try {
    // Format mobile numbers for SQL query
    const formattedMobiles = mobileNumbers.map((num) => `'${num}'`).join(",");

    const query = `
      SELECT
        user_id
      FROM zo_authentication_usermobile um
      WHERE um.primary = TRUE
        AND um.mobile_number IN (${formattedMobiles})
    `;

    const result = await analyticsPool.query(query);

    // Extract user_ids from the result
    const userIds = result.rows.map((row) => row.user_id);

    // Log if some mobile numbers didn't match any users
    if (userIds.length < mobileNumbers.length) {
      console.log(
        `Warning: Only ${userIds.length} user IDs found for ${mobileNumbers.length} mobile numbers`
      );
    }

    return userIds;
  } catch (error) {
    console.error("Error fetching user IDs from mobile numbers:", error);
    throw error;
  }
}

// Update send-notification endpoint to use mobile numbers
app.post("/api/send-notification", async (req, res) => {
  const {
    title,
    body,
    campaign_name,
    image,
    mobile_numbers,
    method = "test",
    minDate,
    maxDate,
    propertyCodes,
    cities,
    nearbyLocation,
    nearbyRadius,
    // Add new authentication parameters
    token,
    device_id,
    device_secret,
  } = req.body;

  // Validate required parameters
  if (
    !title ||
    !campaign_name ||
    !Array.isArray(mobile_numbers) ||
    mobile_numbers.length === 0
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters. Required: title and campaign_name",
      received: { title, campaign_name, mobile_numbers },
    });
  }

  try {
    // Create headers using provided auth details or fallback to env variables
    const headers = {
      "client-key": process.env.NOTIS_CLIENT_KEY,
      "client-device-id": device_id || process.env.NOTIS_CLIENT_DEVICE_ID,
      "client-device-secret":
        device_secret || process.env.NOTIS_CLIENT_DEVICE_SECRET,
      Authorization: token
        ? `Bearer ${token}`
        : `Bearer ${process.env.NOTIS_TOKEN}`,
      "Content-Type": "application/json",
    };

    let user_ids = [];
    let reach = "custom";
    let all_attributes = [];
    let attributes = {};
    let massCommunicationId = "";
    let massCommunicationIds = [];

    switch (method) {
      case "test":
        user_ids = await getUserIdsFromMobileNumbers(mobile_numbers);
        break;
      case "properties_visited":
        user_ids = await getUserIdsFromPropertiesVisited(propertyCodes);
        break;
      case "home_location":
        reach = "nearby";
        cities.forEach((city) => {
          all_attributes.push({
            coordinates: city.coordinates,
            distance: city.radius,
            location_type: "home_location",
          });
        });
        break;
      case "nearby":
        reach = "nearby";
        attributes = {
          coordinates: nearbyLocation,
          distance: nearbyRadius,
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid method",
          received: { method },
        });
    }

    // Check if any user IDs were found
    if (
      (method === "test" || method === "properties_visited") &&
      user_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "No valid user IDs found for the provided mobile numbers",
        received: { mobile_numbers_count: mobile_numbers.length },
      });
    }

    // Step 1: Create notification template
    const templateId = await createNotificationTemplate(
      campaign_name,
      title,
      body,
      image,
      headers
    );
    console.log("Template created with ID:", templateId);

    // Step 2: Create mass communication
    if (method === "home_location" && all_attributes.length > 0) {
      all_attributes.forEach(async (attribute) => {
        massCommunicationId = await createMassCommunication(
          campaign_name,
          templateId,
          reach,
          attribute,
          headers
        );
        massCommunicationIds.push(massCommunicationId);
        console.log("Mass communication created with ID:", massCommunicationId);
      });
      await addDeliveries(massCommunicationIds, user_ids, headers);
      console.log("Deliveries added successfully");
    } else {
      massCommunicationId = await createMassCommunication(
        campaign_name,
        templateId,
        reach,
        attributes ? attributes : {},
        headers
      );
      console.log("Mass communication created with ID:", massCommunicationId);
    }

    // Step 3: Add deliveries (users)
    if (user_ids.length > 0) {
      await addDeliveries(massCommunicationId, user_ids, headers);
      console.log("Deliveries added successfully");
    }

    // Step 4: Start the mass communication
    if (massCommunicationIds.length > 0) {
      massCommunicationIds.forEach(async (massCommunicationId) => {
        await startMassCommunication(massCommunicationId, headers);
        console.log("Mass communication started successfully");
      });
    } else {
      await startMassCommunication(massCommunicationId, headers);
      console.log("Mass communication started successfully");
    }

    res.json({
      success: true,
      message: "Notification sent successfully",
      data: {
        template_id: templateId,
        mass_communication_id:
          massCommunicationIds.length > 0
            ? massCommunicationIds
            : massCommunicationId,
        mobile_numbers_count:
          mobile_numbers.length > 0 ? mobile_numbers.length : 0,
        users_found: user_ids.length > 0 ? user_ids.length : 0,
      },
    });
  } catch (error) {
    console.error("Error sending notification:", error);

    // Handle specific error for duplicate campaign name
    if (error.message.includes("Campaign name already exists")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to send notification",
      details: error.message,
    });
  }
});

// Add authentication endpoints
app.post("/api/auth/generate-otp", async (req, res) => {
  console.log("Generating OTP");
  const { mobile_country_code, mobile_number } = req.body;
  console.log("Mobile country code:", mobile_country_code);
  console.log("Mobile number:", mobile_number);
  // Validate required parameters
  if (!mobile_country_code || !mobile_number) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required parameters: mobile_country_code and mobile_number",
      received: { mobile_country_code, mobile_number },
    });
  }

  try {
    const response = await axios.post(
      `${NOTIS_URL}/api/v1/auth/login/mobile/otp/`,
      {
        mobile_country_code,
        mobile_number,
      },
      { headers: NOTIS_HEADERS }
    );

    res.json({
      success: true,
      message: response.data.message || "OTP sent successfully",
    });
  } catch (error) {
    console.error(
      "Error generating OTP:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      success: false,
      error: "Failed to generate OTP",
      details: error.response?.data || error.message,
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { mobile_country_code, mobile_number, otp } = req.body;

  // Validate required parameters
  if (!mobile_country_code || !mobile_number || !otp) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required parameters: mobile_country_code, mobile_number, and otp",
      received: { mobile_country_code, mobile_number, otp },
    });
  }

  try {
    const response = await axios.post(
      `${NOTIS_URL}/api/v1/auth/login/mobile/`,
      {
        mobile_country_code,
        mobile_number,
        otp,
      },
      { headers: NOTIS_HEADERS }
    );

    // Check if user has cas-admin role and add isAdmin flag
    const responseData = response.data;
    if (
      responseData.user &&
      Array.isArray(responseData.user.roles) &&
      responseData.user.roles.includes("cas-admin")
    ) {
      responseData.isAdmin = true;
    }

    // Return the modified response
    res.json(responseData);
  } catch (error) {
    console.error("Error during login:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: "Login failed",
      details: error.response?.data || error.message,
    });
  }
});

app.post("/api/auth/refresh-token", async (req, res) => {
  const { refresh_token, token, device_id, device_secret } = req.body;

  // Validate required parameter
  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameter: refresh_token",
      received: { refresh_token },
    });
  }

  const headers = {
    "client-key": process.env.NOTIS_CLIENT_KEY,
    "client-device-id": device_id || process.env.NOTIS_CLIENT_DEVICE_ID,
    "client-device-secret":
      device_secret || process.env.NOTIS_CLIENT_DEVICE_SECRET,
    Authorization: token
      ? `Bearer ${token}`
      : `Bearer ${process.env.NOTIS_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(
      `${NOTIS_URL}/api/v1/auth/login/refresh/`,
      {
        refresh_token,
      },
      {
        headers: headers,
      }
    );

    // Return the complete response from the authentication service
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error refreshing token:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      success: false,
      error: "Failed to refresh token",
      details: error.response?.data || error.message,
    });
  }
});

