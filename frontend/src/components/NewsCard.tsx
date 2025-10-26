import { ExternalLink, Calendar, Shield, Eye } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewsCardProps {
  article: {
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
  };
}

export default function NewsCard({ article }: NewsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <>
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
            <span>{formatDateShort(article.publishedAt)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 font-medium"
            onClick={() => setIsModalOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Read More
          </Button>
        </CardFooter>
      </Card>

      {/* Article Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold leading-tight pr-8">
                  {article.title}
                </DialogTitle>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary">
                    {article.category}
                  </Badge>
                  <Badge className={`${getCredibilityColor(article.credibility)}`}>
                    <Shield className="mr-1 h-3 w-3" />
                    {article.credibility}% {getCredibilityLabel(article.credibility)}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Full Article Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Complete Article</h3>
              </div>
              <div className="bg-white dark:bg-gray-900 border p-6 rounded-lg max-h-[60vh] overflow-y-auto">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {article.content || "Full article content not available"}
                  </p>
                </div>
                {(!article.content || article.content.length < 200) && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground italic text-sm">
                      📄 This appears to be a preview. For the complete article, please visit the source links below.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Summary & Analysis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">AI Summary & Analysis</h3>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-foreground leading-relaxed mb-3">
                  {article.summary}
                </p>
                <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-muted-foreground">
                    <strong>AI Credibility Analysis:</strong> This content has been evaluated by NewsSense AI and scored {article.credibility}% credibility based on source reliability, content quality, and factual presentation.
                  </p>
                </div>
              </div>
            </div>

            {/* All Sources */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                Sources ({article.sources.length})
              </h3>
              <div className="grid gap-2">
                {article.sources.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Visit Source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Article Metadata */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Published on {formatDate(article.publishedAt)}</span>
                </div>
                <div className="text-right">
                  <p>Analysis by NewsSense AI</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
