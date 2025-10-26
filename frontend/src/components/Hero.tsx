import { Search, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("query") as string;
    const category = formData.get("category") as string;
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

        <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
          AI-verified news summaries with credibility scores from multiple sources
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="query"
                placeholder="Search any topic... (e.g., AI ethics, climate change)"
                className="h-12 pl-10 text-base"
                required
              />
            </div>

            <Select name="category" defaultValue="technology">
              <SelectTrigger className="h-12 w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Search News"}
          </Button>
        </form>
      </div>
    </section>
  );
}
