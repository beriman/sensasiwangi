import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import BadgeDisplay from "./BadgeDisplay";
import { 
  Award, 
  MessageSquare, 
  ThumbsUp, 
  Users,
  Star,
  Sparkles,
  Filter,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ForumBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: string;
  requirement_count: number;
  tier?: number;
  category?: string;
  rarity?: string;
  is_secret?: boolean;
  is_limited_time?: boolean;
}

interface UserBadge extends ForumBadge {
  awarded_at: string;
}

interface BadgeCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function BadgeCollection() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<ForumBadge[]>([]);
  const [badgeCategories, setBadgeCategories] = useState<BadgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | ForumBadge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Stats
  const [badgeStats, setBadgeStats] = useState({
    totalBadges: 0,
    earnedBadges: 0,
    completionPercentage: 0,
    commonBadges: 0,
    uncommonBadges: 0,
    rareBadges: 0,
    epicBadges: 0,
    legendaryBadges: 0
  });
  
  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);
  
  const fetchBadges = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch badge categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("forum_badge_categories")
        .select("*")
        .order("name");
      
      if (categoriesError) throw categoriesError;
      
      // Add "All" category
      const allCategories = [
        { id: "all", name: "All Badges", description: "View all badges", icon: "🏆", color: "bg-gray-100" },
        ...(categoriesData || [])
      ];
      
      setBadgeCategories(allCategories);
      
      // Fetch all badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("forum_badges")
        .select("*")
        .order("tier", { ascending: true })
        .order("requirement_count", { ascending: true });
      
      if (badgesError) throw badgesError;
      
      // Fetch user's earned badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from("forum_user_badges")
        .select(`
          id,
          user_id,
          badge_id,
          awarded_at,
          badge:badge_id(*)
        `)
        .eq("user_id", user.id);
      
      if (userBadgesError) throw userBadgesError;
      
      // Process user badges
      const processedUserBadges = userBadgesData?.map(item => ({
        ...item.badge,
        awarded_at: item.awarded_at
      })) || [];
      
      // Calculate stats
      const totalBadges = badgesData?.length || 0;
      const earnedCount = processedUserBadges.length;
      const completionPercentage = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;
      
      // Count badges by rarity
      const commonBadges = processedUserBadges.filter(b => b.rarity === "common").length;
      const uncommonBadges = processedUserBadges.filter(b => b.rarity === "uncommon").length;
      const rareBadges = processedUserBadges.filter(b => b.rarity === "rare").length;
      const epicBadges = processedUserBadges.filter(b => b.rarity === "epic").length;
      const legendaryBadges = processedUserBadges.filter(b => b.rarity === "legendary").length;
      
      setAllBadges(badgesData || []);
      setEarnedBadges(processedUserBadges);
      setBadgeStats({
        totalBadges,
        earnedBadges: earnedCount,
        completionPercentage,
        commonBadges,
        uncommonBadges,
        rareBadges,
        epicBadges,
        legendaryBadges
      });
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast({
        title: "Error",
        description: "Failed to load badges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleBadgeClick = (badge: UserBadge | ForumBadge) => {
    setSelectedBadge(badge);
    setIsDialogOpen(true);
  };
  
  const filterBadges = (badges: (UserBadge | ForumBadge)[]) => {
    return badges.filter(badge => {
      // Filter by category
      if (activeCategory !== "all" && badge.category !== activeCategory) {
        return false;
      }
      
      // Filter by rarity
      if (rarityFilter !== "all" && badge.rarity !== rarityFilter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !badge.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !badge.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  const sortBadges = (badges: (UserBadge | ForumBadge)[]) => {
    return [...badges].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date('awarded_at' in b ? b.awarded_at : '1970-01-01').getTime() - 
                 new Date('awarded_at' in a ? a.awarded_at : '1970-01-01').getTime();
        case "oldest":
          return new Date('awarded_at' in a ? a.awarded_at : '1970-01-01').getTime() - 
                 new Date('awarded_at' in b ? b.awarded_at : '1970-01-01').getTime();
        case "rarity":
          const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
          return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - 
                 (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
        case "tier":
          return (b.tier || 0) - (a.tier || 0);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };
  
  const getFilteredEarnedBadges = () => {
    return sortBadges(filterBadges(earnedBadges));
  };
  
  const getFilteredUnearnedBadges = () => {
    // Get badges that haven't been earned yet
    const earnedBadgeIds = earnedBadges.map(badge => badge.id);
    const unearnedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));
    
    // Don't show secret badges that haven't been earned yet
    const visibleUnearnedBadges = unearnedBadges.filter(badge => !badge.is_secret);
    
    return sortBadges(filterBadges(visibleUnearnedBadges));
  };
  
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case "all":
        return <Award className="h-4 w-4" />;
      case "Content Creation":
        return <MessageSquare className="h-4 w-4" />;
      case "Community Support":
        return <Users className="h-4 w-4" />;
      case "Recognition":
        return <ThumbsUp className="h-4 w-4" />;
      case "Participation":
        return <Star className="h-4 w-4" />;
      case "Special Events":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Award className="mr-2 h-6 w-6 text-primary" />
            Badge Collection
          </h1>
          <p className="text-gray-500 mt-1">
            Collect badges by participating in the community
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center">
            <Award className="h-4 w-4 mr-1 text-primary" />
            {badgeStats.earnedBadges} / {badgeStats.totalBadges} Badges
          </Badge>
          
          <Progress value={badgeStats.completionPercentage} className="w-24" />
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-sm">Common</span>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold">{badgeStats.commonBadges}</span>
                <span className="text-gray-400 text-sm ml-1">badges</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <span className="text-green-500 text-sm">Uncommon</span>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold">{badgeStats.uncommonBadges}</span>
                <span className="text-gray-400 text-sm ml-1">badges</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <span className="text-blue-500 text-sm">Rare</span>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold">{badgeStats.rareBadges}</span>
                <span className="text-gray-400 text-sm ml-1">badges</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <span className="text-purple-500 text-sm">Epic</span>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold">{badgeStats.epicBadges}</span>
                <span className="text-gray-400 text-sm ml-1">badges</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <span className="text-amber-500 text-sm">Legendary</span>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold">{badgeStats.legendaryBadges}</span>
                <span className="text-gray-400 text-sm ml-1">badges</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search badges..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={rarityFilter}
            onValueChange={setRarityFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="tier">Tier</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
        <TabsList className="mb-4">
          {badgeCategories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center">
              {getCategoryIcon(category.id)}
              <span className="ml-1">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="space-y-6">
          {/* Earned Badges */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Earned Badges ({getFilteredEarnedBadges().length})</h2>
            {getFilteredEarnedBadges().length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-gray-500">You haven't earned any badges in this category yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {getFilteredEarnedBadges().map(badge => (
                  <div key={badge.id} className="flex flex-col items-center">
                    <BadgeDisplay 
                      badge={badge} 
                      size="md" 
                      onClick={() => handleBadgeClick(badge)}
                    />
                    <div className="mt-2 text-xs text-center font-medium line-clamp-1 w-full">
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Unearned Badges */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Badges to Earn ({getFilteredUnearnedBadges().length})</h2>
            {getFilteredUnearnedBadges().length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-gray-500">No more badges to earn in this category.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {getFilteredUnearnedBadges().map(badge => (
                  <div key={badge.id} className="flex flex-col items-center opacity-60 hover:opacity-80 transition-opacity">
                    <BadgeDisplay 
                      badge={badge} 
                      size="md" 
                      onClick={() => handleBadgeClick(badge)}
                    />
                    <div className="mt-2 text-xs text-center font-medium line-clamp-1 w-full">
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Tabs>
      
      {/* Badge Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Badge Details</DialogTitle>
            <DialogDescription>
              Learn more about this badge and how to earn it
            </DialogDescription>
          </DialogHeader>
          
          {selectedBadge && (
            <div className="flex flex-col items-center space-y-4">
              <BadgeDisplay badge={selectedBadge} size="lg" showTooltip={false} />
              
              <div className="text-center">
                <h3 className="text-lg font-semibold">{selectedBadge.name}</h3>
                
                {'awarded_at' in selectedBadge ? (
                  <Badge variant="success" className="mt-1">
                    Earned on {new Date(selectedBadge.awarded_at).toLocaleDateString()}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1">Not Earned Yet</Badge>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-gray-600">{selectedBadge.description}</p>
              </div>
              
              <div className="w-full">
                <h4 className="text-sm font-medium mb-1">Requirements:</h4>
                <p className="text-sm text-gray-600">
                  {selectedBadge.requirement_type === "threads" && `Create ${selectedBadge.requirement_count} thread${selectedBadge.requirement_count !== 1 ? 's' : ''}`}
                  {selectedBadge.requirement_type === "replies" && `Post ${selectedBadge.requirement_count} repl${selectedBadge.requirement_count !== 1 ? 'ies' : 'y'}`}
                  {selectedBadge.requirement_type === "cendol_received" && `Receive ${selectedBadge.requirement_count} cendol${selectedBadge.requirement_count !== 1 ? 's' : ''}`}
                  {selectedBadge.requirement_type === "cendol_given" && `Give ${selectedBadge.requirement_count} cendol${selectedBadge.requirement_count !== 1 ? 's' : ''}`}
                  {selectedBadge.requirement_type === "level" && `Reach level ${selectedBadge.requirement_count}`}
                  {selectedBadge.requirement_type === "exp" && `Earn ${selectedBadge.requirement_count} experience points`}
                  {selectedBadge.requirement_type === "special" && "Complete a special action or achievement"}
                </p>
              </div>
              
              {selectedBadge.tier && (
                <div className="w-full">
                  <h4 className="text-sm font-medium mb-1">Tier:</h4>
                  <div className="flex items-center">
                    {Array.from({ length: selectedBadge.tier }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400" fill="currentColor" />
                    ))}
                    {Array.from({ length: 5 - (selectedBadge.tier || 0) }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" fill="currentColor" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      Tier {selectedBadge.tier} of 5
                    </span>
                  </div>
                </div>
              )}
              
              {selectedBadge.rarity && (
                <div className="w-full">
                  <h4 className="text-sm font-medium mb-1">Rarity:</h4>
                  <p className={`text-sm ${
                    selectedBadge.rarity === "common" ? "text-gray-600" :
                    selectedBadge.rarity === "uncommon" ? "text-green-600" :
                    selectedBadge.rarity === "rare" ? "text-blue-600" :
                    selectedBadge.rarity === "epic" ? "text-purple-600" :
                    "text-amber-600"
                  }`}>
                    {selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1)}
                  </p>
                </div>
              )}
              
              {selectedBadge.is_limited_time && (
                <div className="w-full">
                  <h4 className="text-sm font-medium mb-1">Availability:</h4>
                  <p className="text-sm text-amber-600">
                    Limited Time Badge
                    {selectedBadge.end_date && ` (Available until ${new Date(selectedBadge.end_date).toLocaleDateString()})`}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
