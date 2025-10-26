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
    const { query, category, region = "global" } = req.body;
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Use GNews if available, fall back to NewsAPI
    const useGNews = GNEWS_API_KEY && GNEWS_API_KEY !== "your_gnews_api_key_here";
    const useNewsAPI = NEWS_API_KEY && NEWS_API_KEY !== "your_news_api_key_here";

    if (!useGNews && !useNewsAPI) {
      // Return mock data if no valid API keys
      return res.json({
        articles: [
          {
            title: "Sample News Article",
            content: "This is a sample article to demonstrate the functionality. Please configure a valid news API key to get real news data.",
            summary: "This is a sample article to demonstrate the functionality. Please configure a valid news API key to get real news data.",
            credibility: 75,
            sources: [{ name: "NewsSense AI", url: "https://newsense-ai.com" }],
            category: category,
            publishedAt: new Date().toISOString(),
          }
        ],
        message: "Using sample data - please configure GNews API key for full article content"
      });
    }

    // Determine country based on region
    const country = region === "indian" ? "in" : "us";
    console.log(`Fetching ${region} news for query: "${query}", category: "${category}", country: "${country}"`);

    let newsData;
    let apiUsed = "none";

    // Try GNews API first (provides full content)
    if (useGNews) {
      try {
        console.log("Trying GNews API first...");
        let gnewsUrl;
        if (category === "general" && query === "latest") {
          gnewsUrl = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&country=${country}&max=10&lang=en`;
        } else {
          gnewsUrl = `https://gnews.io/api/v4/search?token=${GNEWS_API_KEY}&q=${query}&max=10&lang=en`;
        }

        const gnewsResponse = await axios.get(gnewsUrl);
        if (gnewsResponse.status === 200 && gnewsResponse.data.articles && gnewsResponse.data.articles.length > 0) {
          // Enhance articles with full content if available
          const enhancedArticles = await Promise.all(
            gnewsResponse.data.articles.map(async (article) => {
              let fullContent = article.content || article.description || "Content not available";

              // If content seems truncated (less than 500 chars), try to get full article
              if (fullContent && fullContent.length < 500 && article.url) {
                try {
                  console.log(`Fetching full content for: ${article.title.substring(0, 50)}...`);
                  const articleResponse = await axios.get(article.url, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 10000
                  });

                  // Extract article content from HTML (simple extraction)
                  const html = articleResponse.data;
                  const contentMatch = html.match(/<article[^>]*>(.*?)<\/article>/s) ||
                                    html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s) ||
                                    html.match(/<p[^>]*>(.*?)<\/p>/s);

                  if (contentMatch && contentMatch[1]) {
                    // Clean HTML and get text content
                    const cleanContent = contentMatch[1]
                      .replace(/<[^>]*>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();

                    if (cleanContent.length > fullContent.length) {
                      fullContent = cleanContent;
                      console.log(`Enhanced content length: ${fullContent.length} chars`);
                    }
                  }
                } catch (fetchError) {
                  console.log(`Could not fetch full content for ${article.title.substring(0, 50)}...`);
                }
              }

              return {
                ...article,
                content: fullContent,
                source: { name: article.source?.name || 'Unknown Source', id: article.source?.name },
              };
            })
          );

          newsData = { articles: enhancedArticles };
          apiUsed = "gnews";
          console.log(`GNews API succeeded: Found ${newsData.articles.length} articles`);
        }
      } catch (gnewsError) {
        console.log("GNews API failed, trying NewsAPI fallback...", gnewsError.message);
      }
    }

    // Fallback to NewsAPI if GNews failed or unavailable
    if (!newsData && useNewsAPI) {
      try {
        console.log("Using NewsAPI as fallback...");
        let newsUrl;
        if (category === "general" && query === "latest") {
          newsUrl = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=10&apiKey=${NEWS_API_KEY}&language=en`;
        } else {
          newsUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}&language=en`;
        }

        const newsResponse = await axios.get(newsUrl);
        if (newsResponse.status === 200 && newsResponse.data.articles && newsResponse.data.articles.length > 0) {
          newsData = newsResponse.data;
          apiUsed = "newsapi";
          console.log(`NewsAPI succeeded: Found ${newsData.articles.length} articles`);
        }
      } catch (newsError) {
        console.log("NewsAPI also failed...", newsError.message);
      }
    }

    // Special handling for Indian news if no results from direct country search
    if (region === "indian" && (!newsData || !newsData.articles || newsData.articles.length === 0)) {
      console.log(`No direct Indian results, trying broader India search...`);

      // Try GNews India search first
      if (useGNews) {
        try {
          const indiaGnewsUrl = `https://gnews.io/api/v4/search?token=${GNEWS_API_KEY}&q=india&max=10&lang=en`;
          const indiaGnewsResponse = await axios.get(indiaGnewsUrl);

          if (indiaGnewsResponse.status === 200 && indiaGnewsResponse.data.articles && indiaGnewsResponse.data.articles.length > 0) {
            newsData = {
              articles: indiaGnewsResponse.data.articles.map(article => ({
                ...article,
                source: { name: article.source?.name || 'Unknown Source', id: article.source?.name },
              }))
            };
            apiUsed = "gnews-india";
            console.log(`Found ${newsData.articles.length} India-related articles via GNews`);
          }
        } catch (gnewsIndiaError) {
          console.log("GNews India search failed, trying NewsAPI India search...");
        }
      }

      // Fallback to NewsAPI India search
      if (!newsData && useNewsAPI) {
        try {
          const indiaFallbackUrl = `https://newsapi.org/v2/everything?q=india&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}&language=en`;
          const fallbackResponse = await axios.get(indiaFallbackUrl);

          if (fallbackResponse.status === 200 && fallbackResponse.data.articles && fallbackResponse.data.articles.length > 0) {
            newsData = fallbackResponse.data;
            apiUsed = "newsapi-india";
            console.log(`Found ${newsData.articles.length} India-related articles via NewsAPI fallback`);
          }
        } catch (fallbackError) {
          console.log("NewsAPI India fallback also failed");
        }
      }
    }

    // Final check for no results
    if (!newsData || !newsData.articles || newsData.articles.length === 0) {
      return res.json({
        articles: [],
        message: `No articles found for ${region} news. Please try a different region or search query.`
      });
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
          content: article.description || article.content || "No content available",
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
          content: article.description || article.content || "Content unavailable",
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
