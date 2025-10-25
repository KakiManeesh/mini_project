import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category } = await req.json();
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!NEWS_API_KEY || !GEMINI_API_KEY) {
      throw new Error("API keys not configured");
    }

    console.log(`Fetching news for query: "${query}", category: "${category}"`);

    // Fetch news from NewsAPI
    const newsUrl = new URL("https://newsapi.org/v2/everything");
    newsUrl.searchParams.append("q", query);
    newsUrl.searchParams.append("apiKey", NEWS_API_KEY);
    newsUrl.searchParams.append("language", "en");
    newsUrl.searchParams.append("sortBy", "publishedAt");
    newsUrl.searchParams.append("pageSize", "10");

    const newsResponse = await fetch(newsUrl.toString());
    const newsData = await newsResponse.json();

    console.log(`NewsAPI response status: ${newsResponse.status}`);

    if (!newsResponse.ok) {
      console.error("NewsAPI error:", newsData);
      throw new Error(newsData.message || "Failed to fetch news");
    }

    if (!newsData.articles || newsData.articles.length === 0) {
      return new Response(
        JSON.stringify({ articles: [], message: "No articles found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        const geminiData = await geminiResponse.json();
        console.log(`Gemini response for article: ${article.title.substring(0, 50)}...`);

        if (!geminiData.candidates || geminiData.candidates.length === 0) {
          console.warn("No Gemini response, using fallback");
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
          console.warn("Failed to parse AI response, using fallback");
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
        // Add article with basic info if processing fails
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

    return new Response(
      JSON.stringify({ articles: processedArticles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-news function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
