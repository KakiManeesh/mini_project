import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRegion } from "@/hooks/use-region";
import { useLanguage } from "@/hooks/use-language";

interface Article {
  title: string;
  content?: string;
  summary: string;
  credibility: number;
  sources: Array<{
    name: string;
    url: string;
  }>;
  category: string;
  publishedAt: string;
}

interface CategoryPageProps {
  category: string;
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { region } = useRegion();
  const { language } = useLanguage();
  const { category: urlCategory } = useParams();

  // Use URL category if available, otherwise use prop
  const currentCategory = urlCategory || category;

  const handleCategorySearch = useCallback(async (categoryName: string, searchQuery: string = "latest") => {
    setIsLoading(true);
    setArticles([]);

    try {
      const response = await fetch("http://localhost:5002/api/analyze-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery, category: categoryName, region, language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.articles && data.articles.length > 0) {
        setArticles(data.articles);
        const searchType = searchQuery === "latest" ? "latest" : `search results for "${searchQuery}"`;
        toast.success(`Found ${data.articles.length} ${searchType} in ${categoryName}`);
      } else {
        const searchType = searchQuery === "latest" ? "latest" : `search results for "${searchQuery}"`;
        toast.info(`No ${searchType} found in ${categoryName}`);
      }
    } catch (error: unknown) {
      console.error("Category search error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch news");
    } finally {
      setIsLoading(false);
    }
  }, [region, language]);

  // Fetch category news on component mount and when region changes
  useEffect(() => {
    if (currentCategory) {
      handleCategorySearch(currentCategory);
    }
  }, [currentCategory, handleCategorySearch]);

  const handleSearch = async (query: string, categoryName: string) => {
    setIsSearching(true);
    await handleCategorySearch(categoryName, query);
    setIsSearching(false);
  };

  const categoryDisplayName = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Category Header */}
      <section className="bg-gradient-to-r from-primary/10 via-background to-background py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {categoryDisplayName} News
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              AI-verified {categoryDisplayName.toLowerCase()} articles with credibility scores
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-4 border-b">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Search {categoryDisplayName} News</h2>
            <p className="text-muted-foreground">
              Find specific topics within {categoryDisplayName.toLowerCase()} category
            </p>
          </div>
          <SearchBar
            onSearch={handleSearch}
            category={currentCategory}
            isLoading={isSearching}
          />
        </div>
      </section>

      {/* Articles Section */}
      <main className="container mx-auto px-4 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Loading {categoryDisplayName} News</h3>
              <p className="text-muted-foreground">
                AI is analyzing the latest {categoryDisplayName.toLowerCase()} articles...
              </p>
            </div>
          </div>
        )}

        {!isLoading && articles.length > 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Latest {categoryDisplayName} Articles</h2>
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
              <h3 className="text-xl font-semibold mb-2">No {categoryDisplayName} News Found</h3>
              <p className="text-muted-foreground mb-4">
                Try a different category or check your internet connection.
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild>
                  <Link to="/">Go Home</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCategorySearch(currentCategory)}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
