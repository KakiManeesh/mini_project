const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Continuing without database connection...');
  });

// Article schema for MongoDB
const articleSchema = new mongoose.Schema({
  title: String,
  summary: String,
  credibility: Number,
  sources: [{ name: String, url: String }],
  category: String,
  publishedAt: String,
});

const Article = mongoose.model('Article', articleSchema);

// API route for analyzing news
app.post('/api/analyze-news', async (req, res) => {
  try {
    const { query, category } = req.body;
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    if (!NEWS_API_KEY || NEWS_API_KEY === "your_news_api_key_here") {
      // Return mock data if no valid NewsAPI key
      return res.json({
        articles: [
          {
            title: "Sample News Article",
            summary: "This is a sample article to demonstrate the functionality. Please configure a valid NewsAPI key to get real news data.",
            credibility: 75,
            sources: [{ name: "NewsSense AI", url: "https://newsense-ai.com" }],
            category: category,
            publishedAt: new Date().toISOString(),
          }
        ],
        message: "Using sample data - please configure NewsAPI key for real news"
      });
    }

    console.log(`Fetching news for query: "${query}", category: "${category}"`);

    // Fetch news from NewsAPI
    let newsUrl;
    if (category === "general" && query === "latest") {
      newsUrl = `https://newsapi.org/v2/top-headlines?country=us&pageSize=3&apiKey=${NEWS_API_KEY}&language=en`;
    } else {
      newsUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}&language=en`;
    }

    const newsResponse = await axios.get(newsUrl);
    const newsData = newsResponse.data;

    if (newsResponse.status !== 200) {
      throw new Error(newsData.message || "Failed to fetch news");
    }

    if (!newsData.articles || newsData.articles.length === 0) {
      return res.json({ articles: [], message: "No articles found" });
    }

    console.log(`Found ${newsData.articles.length} articles`);

    // Process articles with AI
    const processedArticles = [];

    for (const article of newsData.articles.slice(0, 6)) {
      try {
        // Create prompt for Gemini
        const prompt = `Analyze this news article and provide:
1. A concise 2-3 sentence summary
2. A credibility score from 0-100 based on:
   - Source reliability (${article.source.name})
   - Content quality and factual tone
   - Presence of citations or verifiable claims

Article Title: ${article.title}
Source: ${article.source.name}
Content: ${article.description || article.content || "No content available"}

Respond in JSON format:
{
  "summary": "your summary here",
  "credibility": 85,
  "reasoning": "brief explanation"
}`;

        // Call Gemini API
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            },
          }
        );

        const geminiData = geminiResponse.data;

        if (!geminiData.candidates || geminiData.candidates.length === 0) {
          processedArticles.push({
            title: article.title,
            summary: article.description || "No summary available",
            credibility: 70,
            sources: [{ name: article.source.name, url: article.url }],
            category: category,
            publishedAt: article.publishedAt,
          });
          continue;
        }

        const responseText = geminiData.candidates[0].content.parts[0].text;
        
        // Extract JSON from response
        let aiAnalysis;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiAnalysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (parseError) {
          aiAnalysis = {
            summary: article.description || "No summary available",
            credibility: 70,
          };
        }

        processedArticles.push({
          title: article.title,
          summary: aiAnalysis.summary,
          credibility: Math.min(100, Math.max(0, aiAnalysis.credibility || 70)),
          sources: [{ name: article.source.name, url: article.url }],
          category: category,
          publishedAt: article.publishedAt,
        });
      } catch (articleError) {
        console.error(`Error processing article "${article.title}":`, articleError);
        processedArticles.push({
          title: article.title,
          summary: article.description || "Summary unavailable",
          credibility: 65,
          sources: [{ name: article.source.name, url: article.url }],
          category: category,
          publishedAt: article.publishedAt,
        });
      }
    }

    console.log(`Successfully processed ${processedArticles.length} articles`);

    res.json({ articles: processedArticles });
  } catch (error) {
    console.error("Error in analyze-news:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT}`);
});
