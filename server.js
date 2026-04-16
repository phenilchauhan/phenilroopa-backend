import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

// health check
app.get("/", (req, res) => {
  res.send("Gemini Backend Running");
});

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!API_KEY) {
      return res.json({ reply: "API key not configured on server" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("GEMINI RAW RESPONSE:", JSON.stringify(data, null, 2));

    // ✅ SAFE FIX (THIS IS THE MAIN FIX)
    let reply = "No response from Gemini";

    if (data?.candidates?.length > 0) {
      reply = data.candidates[0]?.content?.parts?.[0]?.text;
    } 
    else if (data?.error?.message) {
      reply = data.error.message;
    } 
    else if (data?.promptFeedback?.blockReason) {
      reply = "Blocked: " + data.promptFeedback.blockReason;
    }

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "Server error: " + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
