import { ExternalLink, Calendar, Shield } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NewsCardProps {
  article: {
    title: string;
    summary: string;
    credibility: number;
    sources: Array<{
      name: string;
      url: string;
    }>;
    category: string;
    publishedAt: string;
  };
}

export default function NewsCard({ article }: NewsCardProps) {
  const getCredibilityColor = (score: number) => {
    if (score >= 80) return "bg-success text-white";
    if (score >= 60) return "bg-warning text-white";
    return "bg-destructive text-white";
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 80) return "High Credibility";
    if (score >= 60) return "Moderate Credibility";
    return "Low Credibility";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <Card className="group h-full transition-all duration-300 hover:shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="shrink-0">
            {article.category}
          </Badge>
          <Badge className={`shrink-0 ${getCredibilityColor(article.credibility)}`}>
            <Shield className="mr-1 h-3 w-3" />
            {article.credibility}%
          </Badge>
        </div>
        
        <h3 className="line-clamp-2 text-xl font-bold leading-tight group-hover:text-primary transition-colors">
          {article.title}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">AI Summary</p>
          <p className="text-foreground leading-relaxed">
            {article.summary}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Sources ({article.sources.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {article.sources.slice(0, 3).map((source, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                asChild
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  {source.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            ))}
            {article.sources.length > 3 && (
              <Badge variant="secondary" className="h-7">
                +{article.sources.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(article.publishedAt)}</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {getCredibilityLabel(article.credibility)}
        </span>
      </CardFooter>
    </Card>
  );
}
