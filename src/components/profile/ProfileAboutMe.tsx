import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import {
  User,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Plus,
  Trash2
} from "lucide-react";

interface ProfileAboutMeProps {
  userId: string;
  className?: string;
  isCurrentUser?: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  interests?: string[];
  joined_at: string;
}

export default function ProfileAboutMe({
  userId,
  className = "",
  isCurrentUser = false
}: ProfileAboutMeProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Editing state
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);
  
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setWebsite(profile.website || "");
      setInterests(profile.interests || []);
    }
  }, [profile]);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, bio, location, website, interests, created_at as joined_at")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!user || !isCurrentUser) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("users")
        .update({
          bio,
          location,
          website,
          interests
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      // Update local state
      setProfile({
        ...profile!,
        bio,
        location,
        website,
        interests
      });
      
      setEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    
    // Check if interest already exists
    if (interests.includes(newInterest.trim())) {
      toast({
        title: "Interest already exists",
        description: "This interest is already in your list",
        variant: "destructive",
      });
      return;
    }
    
    setInterests([...interests, newInterest.trim()]);
    setNewInterest("");
  };
  
  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };
  
  const handleCancel = () => {
    // Reset to original values
    if (profile) {
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setWebsite(profile.website || "");
      setInterests(profile.interests || []);
    }
    
    setEditing(false);
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">About</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading profile..." />
        </CardContent>
      </Card>
    );
  }
  
  if (!profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">About</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <p className="text-gray-500">Profile not found</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-medium">About</CardTitle>
          {!editing && profile.bio && (
            <CardDescription className="line-clamp-1">
              {profile.bio.substring(0, 50)}{profile.bio.length > 50 ? "..." : ""}
            </CardDescription>
          )}
        </div>
        
        {isCurrentUser && !editing && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditing(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        
        {isCurrentUser && editing && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <LoadingSpinner size="sm" className="mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Bio</label>
              <Textarea
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                placeholder="Your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <Input
                placeholder="Your website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Interests</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                    {interest}
                    <button 
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an interest"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddInterest}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.bio ? (
              <div className="whitespace-pre-line text-gray-700">
                {profile.bio}
              </div>
            ) : isCurrentUser ? (
              <p className="text-gray-500 italic">
                Add a bio to tell people about yourself
              </p>
            ) : (
              <p className="text-gray-500 italic">
                This user hasn't added a bio yet
              </p>
            )}
            
            <div className="pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-700 font-medium">
                    {profile.full_name || profile.username}
                  </span>
                </div>
                
                {profile.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-700">{profile.location}</span>
                  </div>
                )}
                
                {profile.website && (
                  <div className="flex items-center text-sm">
                    <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-700">
                    Joined {new Date(profile.joined_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            {profile.interests && profile.interests.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <h3 className="text-sm font-medium mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
