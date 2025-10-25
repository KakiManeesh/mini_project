import { Newspaper, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2">
            <Newspaper className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">NewsSense AI</span>
        </div>

        <Button 
          variant="outline"
          onClick={() => navigate("/auth")}
          className="gap-2"
        >
          <LogIn className="h-4 w-4" />
          Login
        </Button>
      </div>
    </nav>
  );
}
