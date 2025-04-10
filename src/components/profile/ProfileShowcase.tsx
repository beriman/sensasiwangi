import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { 
  Trophy, 
  Award, 
  Star, 
  TrendingUp, 
  Edit,
  Plus,
  X,
  DragHandleDots2Icon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProfileShowcaseProps {
  userId: string;
  className?: string;
  isCurrentUser?: boolean;
}

interface ShowcaseItem {
  id: string;
  type: "badge" | "achievement" | "leaderboard";
  item_id: string;
  display_order: number;
  custom_caption?: string;
  item_details: any;
}

interface FavoriteBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: number;
  display_order: number;
}

interface FavoriteAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tier: number;
  category: string;
  display_order: number;
}

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  level: number;
  exp_points: number;
  profile_customization: any;
  favorite_badges: FavoriteBadge[];
  favorite_achievements: FavoriteAchievement[];
  showcase_items: ShowcaseItem[];
}

export default function ProfileShowcase({
  userId,
  className = "",
  isCurrentUser = false
}: ProfileShowcaseProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("badges");
  
  // For editing showcase
  const [selectedItems, setSelectedItems] = useState<ShowcaseItem[]>([]);
  const [availableBadges, setAvailableBadges] = useState<FavoriteBadge[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<FavoriteAchievement[]>([]);
  const [availableLeaderboardRanks, setAvailableLeaderboardRanks] = useState<any[]>([]);
  
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);
  
  useEffect(() => {
    if (profile) {
      // Initialize selected items from profile
      setSelectedItems(profile.showcase_items || []);
      
      // Fetch available items for showcase
      if (isCurrentUser) {
        fetchAvailableItems();
      }
    }
  }, [profile]);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc(
        'get_user_profile_with_customization',
        { user_id_param: userId }
      );
      
      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile showcase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableItems = async () => {
    if (!user) return;
    
    try {
      // Fetch user badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("forum_user_badges")
        .select(`
          badge_id,
          badge:badge_id(
            id,
            name,
            description,
            icon,
            color,
            tier
          )
        `)
        .eq("user_id", user.id);
      
      if (badgesError) throw badgesError;
      
      // Fetch user achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("forum_user_achievements")
        .select(`
          achievement_id,
          achievement:achievement_id(
            id,
            title,
            description,
            icon,
            color,
            tier,
            category
          )
        `)
        .eq("user_id", user.id);
      
      if (achievementsError) throw achievementsError;
      
      // Fetch user leaderboard ranks
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("forum_leaderboard_history")
        .select("*")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: false })
        .limit(10);
      
      if (leaderboardError) throw leaderboardError;
      
      // Process badges
      const badges = badgesData.map((item, index) => ({
        ...item.badge,
        display_order: index
      }));
      
      // Process achievements
      const achievements = achievementsData.map((item, index) => ({
        ...item.achievement,
        display_order: index
      }));
      
      setAvailableBadges(badges);
      setAvailableAchievements(achievements);
      setAvailableLeaderboardRanks(leaderboardData || []);
    } catch (error) {
      console.error("Error fetching available items:", error);
      toast({
        title: "Error",
        description: "Failed to load available items for showcase",
        variant: "destructive",
      });
    }
  };
  
  const saveShowcase = async () => {
    if (!isCurrentUser || !user) return;
    
    try {
      setSaving(true);
      
      // Format showcase items for the API
      const showcaseItems = selectedItems.map((item, index) => ({
        type: item.type,
        id: item.item_id,
        caption: item.custom_caption
      }));
      
      const { error } = await supabase.rpc(
        'update_showcase_items',
        {
          user_id_param: user.id,
          showcase_items: showcaseItems
        }
      );
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile showcase saved successfully",
      });
      
      // Close dialog and refresh profile
      setIsEditDialogOpen(false);
      fetchUserProfile();
    } catch (error) {
      console.error("Error saving profile showcase:", error);
      toast({
        title: "Error",
        description: "Failed to save profile showcase",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const addItemToShowcase = (type: "badge" | "achievement" | "leaderboard", itemId: string, details: any) => {
    // Check if already added
    if (selectedItems.some(item => item.type === type && item.item_id === itemId)) {
      return;
    }
    
    // Add to selected items
    setSelectedItems([
      ...selectedItems,
      {
        id: `temp-${Date.now()}`,
        type,
        item_id: itemId,
        display_order: selectedItems.length,
        item_details: details
      }
    ]);
  };
  
  const removeItemFromShowcase = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };
  
  const updateItemCaption = (index: number, caption: string) => {
    const newItems = [...selectedItems];
    newItems[index].custom_caption = caption;
    setSelectedItems(newItems);
  };
  
  const moveItemUp = (index: number) => {
    if (index === 0) return;
    
    const newItems = [...selectedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    setSelectedItems(newItems);
  };
  
  const moveItemDown = (index: number) => {
    if (index === selectedItems.length - 1) return;
    
    const newItems = [...selectedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    setSelectedItems(newItems);
  };
  
  const renderShowcaseItem = (item: ShowcaseItem) => {
    switch (item.type) {
      case "badge":
        return (
          <div className="flex items-center p-4 border rounded-md bg-white">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.item_details.color || 'bg-gray-100'}`}>
              {item.item_details.icon ? (
                <span className="text-xl">{item.item_details.icon}</span>
              ) : (
                <Award className="h-6 w-6" />
              )}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="font-medium">{item.item_details.name}</h3>
              <p className="text-sm text-gray-500 truncate">{item.custom_caption || item.item_details.description}</p>
            </div>
          </div>
        );
      
      case "achievement":
        return (
          <div className="flex items-center p-4 border rounded-md bg-white">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.item_details.color || 'bg-gray-100'}`}>
              {item.item_details.icon ? (
                <span className="text-xl">{item.item_details.icon}</span>
              ) : (
                <Trophy className="h-6 w-6" />
              )}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="font-medium">{item.item_details.title}</h3>
              <p className="text-sm text-gray-500 truncate">{item.custom_caption || item.item_details.description}</p>
            </div>
          </div>
        );
      
      case "leaderboard":
        return (
          <div className="flex items-center p-4 border rounded-md bg-white">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="font-medium">
                Rank #{item.item_details.rank} - {item.item_details.leaderboard_type}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {item.custom_caption || `${item.item_details.period} leaderboard with ${item.item_details.score} points`}
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  const renderEditableShowcaseItem = (item: ShowcaseItem, index: number) => {
    return (
      <div className="flex items-center p-4 border rounded-md bg-white">
        <div className="flex items-center flex-1">
          <DragHandleDots2Icon className="h-5 w-5 text-gray-400 mr-2 cursor-move" />
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            item.type === "badge" ? (item.item_details.color || 'bg-gray-100') :
            item.type === "achievement" ? (item.item_details.color || 'bg-gray-100') :
            "bg-blue-100 text-blue-600"
          }`}>
            {item.type === "badge" ? (
              item.item_details.icon ? (
                <span className="text-lg">{item.item_details.icon}</span>
              ) : (
                <Award className="h-5 w-5" />
              )
            ) : item.type === "achievement" ? (
              item.item_details.icon ? (
                <span className="text-lg">{item.item_details.icon}</span>
              ) : (
                <Trophy className="h-5 w-5" />
              )
            ) : (
              <TrendingUp className="h-5 w-5" />
            )}
          </div>
          
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="font-medium">
              {item.type === "badge" ? item.item_details.name :
               item.type === "achievement" ? item.item_details.title :
               `Rank #${item.item_details.rank} - ${item.item_details.leaderboard_type}`}
            </h3>
            
            <Textarea
              placeholder="Add a custom caption (optional)"
              className="mt-2 text-sm"
              value={item.custom_caption || ""}
              onChange={(e) => updateItemCaption(index, e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1 ml-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => moveItemUp(index)}
            disabled={index === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => moveItemDown(index)}
            disabled={index === selectedItems.length - 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => removeItemFromShowcase(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  const renderBadgeOptions = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableBadges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50"
            onClick={() => addItemToShowcase("badge", badge.id, badge)}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.color || 'bg-gray-100'}`}>
              {badge.icon ? (
                <span className="text-lg">{badge.icon}</span>
              ) : (
                <Award className="h-5 w-5" />
              )}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="font-medium">{badge.name}</h3>
              <p className="text-sm text-gray-500 truncate">{badge.description}</p>
            </div>
            
            <Button variant="ghost" size="sm" className="ml-2">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {availableBadges.length === 0 && (
          <div className="col-span-2 text-center py-6 text-gray-500">
            <Award className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>You don't have any badges yet</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderAchievementOptions = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50"
            onClick={() => addItemToShowcase("achievement", achievement.id, achievement)}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.color || 'bg-gray-100'}`}>
              {achievement.icon ? (
                <span className="text-lg">{achievement.icon}</span>
              ) : (
                <Trophy className="h-5 w-5" />
              )}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="font-medium">{achievement.title}</h3>
              <p className="text-sm text-gray-500 truncate">{achievement.description}</p>
            </div>
            
            <Button variant="ghost" size="sm" className="ml-2">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {availableAchievements.length === 0 && (
          <div className="col-span-2 text-center py-6 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>You don't have any achievements yet</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderLeaderboardOptions = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableLeaderboardRanks.map((rank) => (
          <div
            key={rank.id}
            className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50"
            onClick={() => addItemToShowcase("leaderboard", rank.id, rank)}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="font-medium">
                Rank #{rank.rank} - {rank.leaderboard_type}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {rank.period} leaderboard with {rank.score} points
              </p>
            </div>
            
            <Button variant="ghost" size="sm" className="ml-2">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {availableLeaderboardRanks.length === 0 && (
          <div className="col-span-2 text-center py-6 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>You don't have any leaderboard ranks yet</p>
          </div>
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Showcase</CardTitle>
          <CardDescription>Display your favorite achievements and badges</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading showcase..." />
        </CardContent>
      </Card>
    );
  }
  
  if (!profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Showcase</CardTitle>
          <CardDescription>Display your favorite achievements and badges</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">Failed to load profile showcase</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Showcase</CardTitle>
          <CardDescription>Display your favorite achievements and badges</CardDescription>
        </div>
        
        {isCurrentUser && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Showcase
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {profile.showcase_items && profile.showcase_items.length > 0 ? (
          <div className="space-y-4">
            {profile.showcase_items.map((item) => (
              <div key={item.id}>
                {renderShowcaseItem(item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">
              {isCurrentUser 
                ? "You haven't added any items to your showcase yet" 
                : "This user hasn't added any items to their showcase yet"}
            </p>
            
            {isCurrentUser && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Items to Showcase
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Edit Showcase Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Showcase</DialogTitle>
            <DialogDescription>
              Add your favorite badges, achievements, and leaderboard ranks to your profile showcase.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div>
              <h3 className="text-lg font-medium mb-4">Your Showcase</h3>
              
              {selectedItems.length > 0 ? (
                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div key={item.id || index}>
                      {renderEditableShowcaseItem(item, index)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md">
                  <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    Add items to your showcase from the tabs below
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Add Items</h3>
              
              <Tabs defaultValue="badges" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="badges" className="flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    Badges
                  </TabsTrigger>
                  <TabsTrigger value="achievements" className="flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    Achievements
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Leaderboard
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="badges">
                  {renderBadgeOptions()}
                </TabsContent>
                
                <TabsContent value="achievements">
                  {renderAchievementOptions()}
                </TabsContent>
                
                <TabsContent value="leaderboard">
                  {renderLeaderboardOptions()}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveShowcase} disabled={saving}>
              {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
