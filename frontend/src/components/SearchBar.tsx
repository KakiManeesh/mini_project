import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string, category: string) => void;
  category: string;
  isLoading: boolean;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  category,
  isLoading,
  placeholder
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("query") as string;
    if (query.trim()) {
      onSearch(query, category);
    }
  };

  const defaultPlaceholder = `Search within ${category.charAt(0).toUpperCase() + category.slice(1)}...`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="query"
            placeholder={placeholder || defaultPlaceholder}
            className="h-12 pl-10 text-base"
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 px-6"
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
    </form>
  );
}
