import { Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryButtons from "./CategoryButtons";
import SearchBar from "./SearchBar";

interface HeroProps {
  onSearch: (query: string, category: string) => void;
  isLoading: boolean;
}

const categories = [
  "technology",
  "business",
  "entertainment",
  "health",
  "science",
  "sports",
  "general",
];

export default function Hero({ onSearch, isLoading }: HeroProps) {
  const handleSearch = (query: string, category: string) => {
    onSearch(query, category);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered News Intelligence</span>
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Discover Truth in <br />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Every Story
          </span>
        </h1>

        <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
          AI-verified news summaries with credibility scores from multiple sources
        </p>

        {/* Category Navigation Buttons */}
        <div className="mb-10">
          <CategoryButtons categories={categories} />
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            category="general"
            isLoading={isLoading}
            placeholder="Search any topic... (e.g., AI ethics, climate change)"
          />
        </div>
      </div>
    </section>
  );
}
