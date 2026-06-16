require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── GET /tasks ────────────────────────────────────────────────────────────────
app.get("/tasks", async (req, res) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── POST /tasks ───────────────────────────────────────────────────────────────
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "El título es obligatorio." });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title: title.trim(), done: false }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ── PATCH /tasks/:id ──────────────────────────────────────────────────────────
app.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;

  if (typeof done !== "boolean") {
    return res.status(400).json({ error: "'done' debe ser true o false." });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ done })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── DELETE /tasks/:id ─────────────────────────────────────────────────────────
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Tarea eliminada." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  TaskFlow API corriendo en http://localhost:${PORT}`);
});
