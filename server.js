require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini SDK
// Make sure GEMINI_API_KEY is set in your Render Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // Select the model (1.5-flash is fast and usually free-tier friendly)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    /**
     * CONVERT HISTORY: 
     * Your frontend uses 'assistant', but Gemini requires 'model'.
     * Gemini also expects content inside a 'parts' array.
     */
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Start chat session with converted history
    const chat = model.startChat({
      history: formattedHistory,
    });

    // Send the user message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Send JSON back. Your script.js looks for the 'reply' key.
    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini API Error:", error.message);
    
    // Check if it's an API Key issue
    if (error.message.includes("API key")) {
        return res.status(401).json({ error: "Invalid API Key. Check Render Env Variables." });
    }

    res.status(500).json({ 
      error: "Gemini failed to respond", 
      details: error.message 
    });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('PhenilRoopa.ai Backend is Online 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
