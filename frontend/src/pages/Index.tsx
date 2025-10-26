import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NewsCard from "@/components/NewsCard";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRegion } from "@/hooks/use-region";
import { useLanguage } from "@/hooks/use-language";

interface Article {
  title: string;
  summary: string;
  credibility: number;
  sources: Array<{
    name: string;
    url: string;
  }>;
  category: string;
  publishedAt: string;
}

export default function Index() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { region } = useRegion();
  const { language } = useLanguage();

  const handleSearch = useCallback(async (query: string, category: string) => {
    setIsLoading(true);
    setArticles([]);

    try {
      const response = await fetch("http://localhost:5002/api/analyze-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, category, region, language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.articles && data.articles.length > 0) {
        setArticles(data.articles);
        toast.success(`Found ${data.articles.length} verified articles`);
      } else {
        toast.info("No articles found for this search");
      }
    } catch (error: unknown) {
      console.error("Search error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch news");
    } finally {
      setIsLoading(false);
    }
  }, [region, language]);

  // Fetch top news on component mount and when region changes
  useEffect(() => {
    handleSearch("latest", "general");
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero onSearch={handleSearch} isLoading={isLoading} />

      <main className="container mx-auto px-4 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Analyzing Latest News</h3>
              <p className="text-muted-foreground">
                AI is processing articles from multiple sources for accuracy and credibility...
              </p>
            </div>
          </div>
        )}

        {!isLoading && articles.length > 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Latest AI-Verified News</h2>
              <p className="text-muted-foreground">
                {articles.length} articles analyzed and verified by AI for accuracy and credibility
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, idx) => (
                <NewsCard key={idx} article={article} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">No News Found</h3>
              <p className="text-muted-foreground mb-4">
                Try searching for a different topic or check your internet connection.
              </p>
              <button
                onClick={() => handleSearch("latest", "general")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh News
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
