import { ExternalLink, Calendar, Shield, Eye, Share2, BookmarkPlus } from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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

const API_URL = "http://localhost:5002";

export default function NewsCard({ article }: NewsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  // Check if article is bookmarked
  useEffect(() => {
    if (isAuthenticated && token && article.title) {
      fetch(`${API_URL}/api/bookmarks/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ articleTitle: article.title }),
      })
        .then(res => res.json())
        .then(data => {
          setIsBookmarked(data.isBookmarked);
          setBookmarkId(data.bookmarkId);
        })
        .catch(err => console.error('Check bookmark error:', err));
    }
  }, [isAuthenticated, token, article.title]);

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to bookmark articles");
      return;
    }

    if (isBookmarked) {
      // Remove bookmark
      if (bookmarkId) {
        try {
          const response = await fetch(`${API_URL}/api/bookmarks/${bookmarkId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setIsBookmarked(false);
            setBookmarkId(null);
            toast.success("Removed from bookmarks");
          } else {
            toast.error("Failed to remove bookmark");
          }
        } catch (error) {
          toast.error("Failed to remove bookmark");
        }
      }
    } else {
      // Add bookmark
      try {
        const response = await fetch(`${API_URL}/api/bookmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ article }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsBookmarked(true);
          setBookmarkId(data.bookmark?._id || null);
          toast.success("Article bookmarked!");
        } else {
          toast.error(data.error || "Failed to bookmark article");
        }
      } catch (error) {
        toast.error("Failed to bookmark article");
      }
    }
  };

  // Fallback copy function
  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success("Link copied to clipboard!");
      } else {
        toast.error("Failed to copy link");
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error("Failed to copy link");
    }
  };

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

  const shareOptions = {
    twitter: () => {
      const text = encodeURIComponent(`${article.title} - NewsSense AI`);
      const url = article.sources[0]?.url || window.location.href;
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
      toast.success("Opening Twitter...");
    },
    facebook: () => {
      const url = article.sources[0]?.url || window.location.href;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      toast.success("Opening Facebook...");
    },
    linkedin: () => {
      const text = encodeURIComponent(`${article.title} - NewsSense AI`);
      const url = article.sources[0]?.url || window.location.href;
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${text}`, '_blank');
      toast.success("Opening LinkedIn...");
    },
    whatsapp: () => {
      const text = encodeURIComponent(`${article.title} - ${article.summary.substring(0, 100)}...`);
      const url = article.sources[0]?.url || window.location.href;
      window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
      toast.success("Opening WhatsApp...");
    },
    email: () => {
      const subject = encodeURIComponent(`${article.title} - NewsSense AI`);
      const body = encodeURIComponent(`${article.title}\n\n${article.summary}\n\nRead more: ${article.sources[0]?.url || window.location.href}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
      toast.success("Opening email client...");
    },
    copyLink: () => {
      try {
        const url = article.sources[0]?.url || window.location.href;
        console.log('Copying URL:', url); // Debug log

        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            toast.success("Link copied to clipboard!");
          }).catch((err) => {
            console.error('Clipboard API failed:', err);
            // Fallback for older browsers
            fallbackCopyToClipboard(url);
          });
        } else {
          // Fallback for older browsers
          fallbackCopyToClipboard(url);
        }
      } catch (err) {
        console.error('Copy failed:', err);
        toast.error("Failed to copy link");
      }
    }
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
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={shareOptions.copyLink}>
                  📋 Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={shareOptions.twitter}>
                  🐦 Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareOptions.facebook}>
                  📘 Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareOptions.linkedin}>
                  💼 LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareOptions.whatsapp}>
                  💬 WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareOptions.email}>
                  📧 Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className={`text-muted-foreground hover:text-primary ${isBookmarked ? 'text-primary' : ''}`}
              onClick={handleBookmark}
            >
              <BookmarkPlus className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 font-medium"
              onClick={() => setIsModalOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Read More
            </Button>
          </div>
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

            {/* Share Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Published on {formatDate(article.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Share this article:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={shareOptions.copyLink}>
                        📋 Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={shareOptions.twitter}>
                        🐦 Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOptions.facebook}>
                        📘 Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOptions.linkedin}>
                        💼 LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOptions.whatsapp}>
                        💬 WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOptions.email}>
                        📧 Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="text-right mt-2">
                <p className="text-sm text-muted-foreground">Analysis by NewsSense AI</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
