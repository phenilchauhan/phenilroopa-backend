// PhenilRoopa.ai — Free Backend for Render.com
// Uses Anthropic Claude API (free $5 credits to start)

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors()); // allows your GitHub Pages site to call this
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "PhenilRoopa.ai backend is running ✦" });
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided." });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "API key not configured on server." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // fast + cheapest
        max_tokens: 1024,
        system: "You are PhenilRoopa.ai — a friendly, helpful, and knowledgeable AI assistant. Be concise but thorough. Use markdown-style formatting when helpful. Be warm and conversational.",
        messages: [{ role: "user", content: message }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err?.error?.message || "API error" });
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text || "No response.";
    const tokens = (data?.usage?.input_tokens || 0) + (data?.usage?.output_tokens || 0);

    res.json({ reply, tokens });

  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
