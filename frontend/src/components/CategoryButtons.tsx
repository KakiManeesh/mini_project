import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CategoryButtonsProps {
  categories: string[];
  basePath?: string;
}

export default function CategoryButtons({ categories, basePath = "" }: CategoryButtonsProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mx-auto">
      {categories.map((category) => {
        const categoryPath = `/${category}`;
        const isActive = currentPath === categoryPath || (currentPath === "/" && category === "general");

        return (
          <Button
            key={category}
            asChild
            variant={isActive ? "default" : "outline"}
            className={`h-12 capitalize transition-all duration-200 hover:scale-105 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-lg"
                : "hover:bg-primary/10 hover:border-primary/50"
            }`}
          >
            <Link to={categoryPath} className="w-full">
              {category}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
