// @ts-ignore
import React, { ReactNode } from "react";
// @ts-ignore
import { Link } from "react-router-dom";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Search, PlusCircle } from "lucide-react";
// @ts-ignore
import { useParams } from "react-router-dom";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";

interface ForumLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function ForumLayout({
  children,
  title,
  subtitle,
}: ForumLayoutProps) {
  const { user } = useAuth();
  const { categoryId } = useParams();

  return (
    <div className="space-y-6">
      {/* Forum Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {title || "Forum Komunitas"}
          </h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Cari di forum..."
              className="pl-8 bg-white"
            />
          </div>
          {categoryId && user && (
            <Link to={`/forum/new-thread/${categoryId}`}>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Buat Thread
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Forum Content */}
      <div>{children}</div>
    </div>
  );
}


