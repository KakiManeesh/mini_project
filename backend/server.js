const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.log('Continuing without database connection...');
    });
} else {
  console.log('MONGODB_URI not found. Server will run but authentication features will not work.');
  console.log('Please create a .env file in the backend directory with MONGODB_URI.');
}

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

// User schema for authentication
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Bookmark schema
const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  article: {
    title: String,
    summary: String,
    credibility: Number,
    sources: [{ name: String, url: String }],
    category: String,
    publishedAt: String,
    content: String,
  },
}, { timestamps: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Authentication routes

// Sign up
app.post('/api/register', async (req, res) => {
  try {
    // Check if database is connected
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: 'Database not available. Please configure MONGODB_URI in .env file' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to register user' });
  }
});

// Log in
app.post('/api/login', async (req, res) => {
  try {
    // Check if database is connected
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: 'Database not available. Please configure MONGODB_URI in .env file' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Failed to login' });
  }
});

// API route for analyzing news
app.post('/api/analyze-news', async (req, res) => {
  try {
    const { query, category, region = "global", language = "en" } = req.body;
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
          gnewsUrl = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&country=${country}&max=10&lang=${language}`;
        } else {
          gnewsUrl = `https://gnews.io/api/v4/search?token=${GNEWS_API_KEY}&q=${query}&max=10&lang=${language}`;
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
          const indiaGnewsUrl = `https://gnews.io/api/v4/search?token=${GNEWS_API_KEY}&q=india&max=10&lang=${language}`;
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

    console.log(`Successfully processed ${processedArticles.length} articles`);

    res.json({ articles: processedArticles });
  } catch (error) {
    console.error("Error in analyze-news:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Bookmark routes
// Add bookmark
app.post('/api/bookmarks', verifyToken, async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { article } = req.body;
    const userId = req.userId;

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      userId,
      'article.title': article.title
    });

    if (existingBookmark) {
      return res.status(400).json({ error: 'Article already bookmarked' });
    }

    const bookmark = new Bookmark({
      userId,
      article,
    });

    await bookmark.save();
    res.json({ message: 'Article bookmarked successfully', bookmark });
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ error: error.message || 'Failed to bookmark article' });
  }
});

// Get all bookmarks for user
app.get('/api/bookmarks', verifyToken, async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const userId = req.userId;
    const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 });

    const articles = bookmarks.map(bookmark => bookmark.article);
    res.json({ articles });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: error.message || 'Failed to get bookmarks' });
  }
});

// Remove bookmark
app.delete('/api/bookmarks/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    if (bookmark.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Bookmark.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove bookmark' });
  }
});

// Check if article is bookmarked
app.post('/api/bookmarks/check', verifyToken, async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.json({ isBookmarked: false });
    }

    const { articleTitle } = req.body;
    const userId = req.userId;

    const bookmark = await Bookmark.findOne({
      userId,
      'article.title': articleTitle
    });

    res.json({ isBookmarked: !!bookmark, bookmarkId: bookmark?._id });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.json({ isBookmarked: false });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT}`);
});
