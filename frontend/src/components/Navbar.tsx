import { Newspaper, LogIn, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useRegion } from "@/hooks/use-region";
import LanguageSelector from "./LanguageSelector";

export default function Navbar() {
  const navigate = useNavigate();
  const { region, setRegion } = useRegion();

  const handleRegionToggle = (checked: boolean) => {
    setRegion(checked ? "indian" : "global");
  };

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

        <div className="flex items-center gap-4">
          {/* Region Toggle */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2">
              <Globe className={`h-4 w-4 ${region === "global" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${region === "global" ? "text-primary" : "text-muted-foreground"}`}>
                Global
              </span>
            </div>

            <Switch
              checked={region === "indian"}
              onCheckedChange={handleRegionToggle}
              className="data-[state=checked]:bg-primary"
            />

            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${region === "indian" ? "text-primary" : "text-muted-foreground"}`}>
                Indian
              </span>
              <MapPin className={`h-4 w-4 ${region === "indian" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>

          {/* Language Selector */}
          <LanguageSelector />

          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </div>
      </div>
    </nav>
  );
}
