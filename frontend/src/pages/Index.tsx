import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NewsCard from "@/components/NewsCard";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

  // Fetch top news on component mount
  useEffect(() => {
    handleSearch("latest", "general");
  }, []);

  const handleSearch = async (query: string, category: string) => {
    setIsLoading(true);
    setArticles([]);

    try {
      const response = await fetch("http://localhost:3002/api/analyze-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, category }),
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
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error.message || "Failed to fetch news");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero onSearch={handleSearch} isLoading={isLoading} />
      
      <main className="container mx-auto px-4 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">
              Analyzing news from multiple sources...
            </p>
          </div>
        )}

        {!isLoading && articles.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">AI-Verified Results</h2>
              <p className="mt-2 text-muted-foreground">
                {articles.length} articles analyzed and verified
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, idx) => (
                <NewsCard key={idx} article={article} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
