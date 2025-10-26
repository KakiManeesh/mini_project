import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import NewsCard from "@/components/NewsCard";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = "http://localhost:5002";

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
    content?: string;
}

export default function Bookmarks() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token, isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        fetchBookmarks();
    }, [isAuthenticated, token]);

    const fetchBookmarks = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/bookmarks`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setArticles(data.articles || []);
            } else {
                toast.error("Failed to fetch bookmarks");
            }
        } catch (error) {
            toast.error("Failed to fetch bookmarks");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-12">
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">Please Login</h3>
                            <p className="text-muted-foreground mb-4">
                                You need to login to view your bookmarked articles.
                            </p>
                            <Button onClick={() => window.location.href = '/auth'}>
                                Go to Login
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12">
                <div className="space-y-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-3">
                                <Bookmark className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold">My Bookmarks</h1>
                        </div>
                        <p className="text-muted-foreground">
                            Your saved articles from {user?.name || 'NewsSense AI'}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="relative">
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2">Loading bookmarks...</h3>
                                <p className="text-muted-foreground">
                                    Fetching your saved articles...
                                </p>
                            </div>
                        </div>
                    ) : articles.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {articles.map((article, idx) => (
                                <NewsCard key={idx} article={article} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="rounded-lg bg-muted p-12">
                                <Bookmark className="h-24 w-24 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start bookmarking articles to save them for later reading.
                                </p>
                                <Button onClick={() => window.location.href = '/'}>
                                    Browse News
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

