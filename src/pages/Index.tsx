import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NewsCard from "@/components/NewsCard";
import { supabase } from "@/integrations/supabase/client";
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

  const handleSearch = async (query: string, category: string) => {
    setIsLoading(true);
    setArticles([]);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-news", {
        body: { query, category },
      });

      if (error) throw error;

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

        {!isLoading && articles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              Search for news to see AI-verified results
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
