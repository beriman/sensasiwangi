import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { 
  User, 
  Palette, 
  Award, 
  Trophy, 
  Crown, 
  ImageIcon, 
  CheckCircle,
  Lock
} from "lucide-react";

interface ProfileCustomizationProps {
  userId: string;
  className?: string;
  isCurrentUser?: boolean;
}

interface ProfileTitle {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  required_level: number;
}

interface ProfileFrame {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  css_class: string;
  required_level: number;
}

interface ProfileBackground {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  css_class: string;
  required_level: number;
}

interface ProfileCustomization {
  title: {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
  } | null;
  frame: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    css_class: string;
  } | null;
  background: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    css_class: string;
  } | null;
  theme: string | null;
  accent_color: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  level: number;
  exp_points: number;
  profile_customization: ProfileCustomization;
  available_customization: {
    titles: ProfileTitle[];
    frames: ProfileFrame[];
    backgrounds: ProfileBackground[];
  };
}

export default function ProfileCustomization({
  userId,
  className = "",
  isCurrentUser = false
}: ProfileCustomizationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("titles");
  
  // Selected customization options
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedAccentColor, setSelectedAccentColor] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);
  
  useEffect(() => {
    if (profile) {
      // Initialize selected values from profile
      setSelectedTitle(profile.profile_customization.title?.id || null);
      setSelectedFrame(profile.profile_customization.frame?.id || null);
      setSelectedBackground(profile.profile_customization.background?.id || null);
      setSelectedTheme(profile.profile_customization.theme || null);
      setSelectedAccentColor(profile.profile_customization.accent_color || null);
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
        description: "Failed to load profile customization options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveProfileCustomization = async () => {
    if (!isCurrentUser || !user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase.rpc(
        'update_profile_customization',
        {
          user_id_param: user.id,
          title_id_param: selectedTitle,
          frame_id_param: selectedFrame,
          background_id_param: selectedBackground,
          theme_param: selectedTheme,
          accent_color_param: selectedAccentColor
        }
      );
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile customization saved successfully",
      });
      
      // Refresh profile
      fetchUserProfile();
    } catch (error) {
      console.error("Error saving profile customization:", error);
      toast({
        title: "Error",
        description: "Failed to save profile customization",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const renderTitleOptions = () => {
    if (!profile) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.available_customization.titles.map((title) => (
          <div
            key={title.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedTitle === title.id 
                ? "border-primary bg-primary/10" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedTitle(title.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${title.color || "bg-gray-100"}`}>
                  {title.icon ? (
                    <span className="text-xl">{title.icon}</span>
                  ) : (
                    <Crown className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium">{title.title}</h3>
                  <p className="text-sm text-gray-500">{title.description}</p>
                </div>
              </div>
              
              {selectedTitle === title.id && (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Requires Level {title.required_level}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderFrameOptions = () => {
    if (!profile) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profile.available_customization.frames.map((frame) => (
          <div
            key={frame.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedFrame === frame.id 
                ? "border-primary bg-primary/10" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedFrame(frame.id)}
          >
            <div className="flex flex-col items-center">
              <div className={`relative mb-3 ${frame.css_class}`}>
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                    alt={profile.username} 
                  />
                  <AvatarFallback>{profile.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>
              
              <h3 className="font-medium text-center">{frame.name}</h3>
              <p className="text-sm text-gray-500 text-center mt-1">{frame.description}</p>
              
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Requires Level {frame.required_level}
                </Badge>
              </div>
              
              {selectedFrame === frame.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderBackgroundOptions = () => {
    if (!profile) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.available_customization.backgrounds.map((background) => (
          <div
            key={background.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedBackground === background.id 
                ? "border-primary bg-primary/10" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedBackground(background.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-md ${background.css_class} flex items-center justify-center`}>
                  <ImageIcon className="h-6 w-6 text-white/70" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium">{background.name}</h3>
                  <p className="text-sm text-gray-500">{background.description}</p>
                </div>
              </div>
              
              {selectedBackground === background.id && (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Requires Level {background.required_level}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderThemeOptions = () => {
    const themes = [
      { id: "light", name: "Light", description: "Light theme with white background" },
      { id: "dark", name: "Dark", description: "Dark theme with black background" },
      { id: "system", name: "System", description: "Follow system theme preference" }
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedTheme === theme.id 
                ? "border-primary bg-primary/10" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedTheme(theme.id)}
          >
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-md flex items-center justify-center ${
                theme.id === "light" 
                  ? "bg-white border" 
                  : theme.id === "dark" 
                    ? "bg-gray-900 text-white" 
                    : "bg-gradient-to-r from-gray-100 to-gray-900"
              }`}>
                <Palette className="h-8 w-8" />
              </div>
              
              <h3 className="font-medium mt-2">{theme.name}</h3>
              <p className="text-sm text-gray-500 text-center mt-1">{theme.description}</p>
              
              {selectedTheme === theme.id && (
                <div className="mt-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderAccentColorOptions = () => {
    const colors = [
      { id: "blue", name: "Blue", color: "bg-blue-500" },
      { id: "green", name: "Green", color: "bg-green-500" },
      { id: "purple", name: "Purple", color: "bg-purple-500" },
      { id: "pink", name: "Pink", color: "bg-pink-500" },
      { id: "amber", name: "Amber", color: "bg-amber-500" },
      { id: "red", name: "Red", color: "bg-red-500" }
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {colors.map((color) => (
          <div
            key={color.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedAccentColor === color.id 
                ? "border-primary bg-primary/10" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedAccentColor(color.id)}
          >
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full ${color.color}`}></div>
              <h3 className="font-medium mt-2">{color.name}</h3>
              
              {selectedAccentColor === color.id && (
                <div className="mt-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Profile Customization</CardTitle>
          <CardDescription>Personalize your profile appearance</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading customization options..." />
        </CardContent>
      </Card>
    );
  }
  
  if (!profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Profile Customization</CardTitle>
          <CardDescription>Personalize your profile appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">Failed to load profile customization options</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Profile Customization
        </CardTitle>
        <CardDescription>Personalize your profile appearance</CardDescription>
      </CardHeader>
      <CardContent>
        {!isCurrentUser ? (
          <div className="text-center py-6">
            <Lock className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">
              Only the profile owner can customize their profile
            </p>
          </div>
        ) : (
          <>
            <Tabs defaultValue="titles" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="titles" className="flex items-center">
                  <Crown className="h-4 w-4 mr-1" />
                  Titles
                </TabsTrigger>
                <TabsTrigger value="frames" className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Frames
                </TabsTrigger>
                <TabsTrigger value="backgrounds" className="flex items-center">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Backgrounds
                </TabsTrigger>
                <TabsTrigger value="theme" className="flex items-center">
                  <Palette className="h-4 w-4 mr-1" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="accent" className="flex items-center">
                  <Palette className="h-4 w-4 mr-1" />
                  Accent Color
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="titles">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Select a Title</h3>
                    {renderTitleOptions()}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="frames">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Select a Profile Frame</h3>
                    {renderFrameOptions()}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="backgrounds">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Select a Profile Background</h3>
                    {renderBackgroundOptions()}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="theme">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Select a Theme</h3>
                    {renderThemeOptions()}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="accent">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Select an Accent Color</h3>
                    {renderAccentColorOptions()}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={saveProfileCustomization}
                disabled={saving}
              >
                {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
