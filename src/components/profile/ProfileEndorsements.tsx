import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import {
  ThumbsUp,
  Award,
  Plus,
  X,
  Check,
  Loader2
} from "lucide-react";

interface ProfileEndorsementsProps {
  userId: string;
  className?: string;
}

interface Endorsement {
  id: string;
  skill: string;
  count: number;
  endorsed_by_current_user: boolean;
}

interface EndorsementUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function ProfileEndorsements({
  userId,
  className = ""
}: ProfileEndorsementsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedEndorsement, setSelectedEndorsement] = useState<string | null>(null);
  const [endorsementUsers, setEndorsementUsers] = useState<EndorsementUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const isCurrentUser = user && user.id === userId;
  
  useEffect(() => {
    fetchEndorsements();
  }, [userId]);
  
  const fetchEndorsements = async () => {
    try {
      setLoading(true);
      
      // Get all endorsements for the user
      const { data, error } = await supabase
        .from("user_endorsements")
        .select(`
          id,
          skill,
          count,
          endorsed_by_current_user:user_endorsements_given(id)
        `)
        .eq("user_id", userId)
        .eq("endorsed_by_current_user.endorser_id", user?.id || "")
        .order("count", { ascending: false });
      
      if (error) throw error;
      
      // Format the data
      const formattedEndorsements: Endorsement[] = data.map(item => ({
        id: item.id,
        skill: item.skill,
        count: item.count,
        endorsed_by_current_user: item.endorsed_by_current_user.length > 0
      }));
      
      setEndorsements(formattedEndorsements);
    } catch (error) {
      console.error("Error fetching endorsements:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddEndorsement = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to endorse skills",
        variant: "destructive",
      });
      return;
    }
    
    if (!newSkill.trim()) {
      toast({
        title: "Skill required",
        description: "Please enter a skill to endorse",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Check if the skill already exists
      const { data: existingSkill, error: checkError } = await supabase
        .from("user_endorsements")
        .select("id")
        .eq("user_id", userId)
        .ilike("skill", newSkill.trim())
        .single();
      
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      
      if (existingSkill) {
        // Skill exists, add endorsement
        const { error: endorseError } = await supabase
          .from("user_endorsements_given")
          .insert({
            endorsement_id: existingSkill.id,
            endorser_id: user.id,
            endorsed_user_id: userId
          });
        
        if (endorseError) throw endorseError;
        
        // Update count
        const { error: updateError } = await supabase
          .rpc("increment_endorsement_count", {
            endorsement_id_param: existingSkill.id
          });
        
        if (updateError) throw updateError;
      } else {
        // Skill doesn't exist, create it
        const { data: newEndorsement, error: createError } = await supabase
          .from("user_endorsements")
          .insert({
            user_id: userId,
            skill: newSkill.trim(),
            count: 1
          })
          .select("id")
          .single();
        
        if (createError) throw createError;
        
        // Add endorsement record
        const { error: endorseError } = await supabase
          .from("user_endorsements_given")
          .insert({
            endorsement_id: newEndorsement.id,
            endorser_id: user.id,
            endorsed_user_id: userId
          });
        
        if (endorseError) throw endorseError;
      }
      
      toast({
        title: "Skill endorsed",
        description: `You've endorsed ${newSkill.trim()}`,
      });
      
      setNewSkill("");
      setShowAddForm(false);
      fetchEndorsements();
    } catch (error) {
      console.error("Error adding endorsement:", error);
      toast({
        title: "Error",
        description: "Failed to endorse skill",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEndorse = async (endorsementId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to endorse skills",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Add endorsement
      const { error: endorseError } = await supabase
        .from("user_endorsements_given")
        .insert({
          endorsement_id: endorsementId,
          endorser_id: user.id,
          endorsed_user_id: userId
        });
      
      if (endorseError) throw endorseError;
      
      // Update count
      const { error: updateError } = await supabase
        .rpc("increment_endorsement_count", {
          endorsement_id_param: endorsementId
        });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Skill endorsed",
        description: "You've endorsed this skill",
      });
      
      fetchEndorsements();
    } catch (error) {
      console.error("Error endorsing skill:", error);
      toast({
        title: "Error",
        description: "Failed to endorse skill",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleRemoveEndorsement = async (endorsementId: string) => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      // Remove endorsement
      const { error: removeError } = await supabase
        .from("user_endorsements_given")
        .delete()
        .eq("endorsement_id", endorsementId)
        .eq("endorser_id", user.id);
      
      if (removeError) throw removeError;
      
      // Update count
      const { error: updateError } = await supabase
        .rpc("decrement_endorsement_count", {
          endorsement_id_param: endorsementId
        });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Endorsement removed",
        description: "Your endorsement has been removed",
      });
      
      fetchEndorsements();
    } catch (error) {
      console.error("Error removing endorsement:", error);
      toast({
        title: "Error",
        description: "Failed to remove endorsement",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const fetchEndorsementUsers = async (endorsementId: string) => {
    try {
      setLoadingUsers(true);
      setSelectedEndorsement(endorsementId);
      
      const { data, error } = await supabase
        .from("user_endorsements_given")
        .select(`
          endorser:endorser_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq("endorsement_id", endorsementId)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      setEndorsementUsers(data.map(item => item.endorser));
    } catch (error) {
      console.error("Error fetching endorsement users:", error);
      toast({
        title: "Error",
        description: "Failed to load endorsers",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Skills & Endorsements</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading endorsements..." />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Skills & Endorsements</CardTitle>
        
        {!isCurrentUser && user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              <X className="h-4 w-4 mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {showAddForm ? "Cancel" : "Endorse"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Endorse a skill</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter a skill (e.g. JavaScript, UI Design)"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                onClick={handleAddEndorsement}
                disabled={submitting || !newSkill.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Add
              </Button>
            </div>
          </div>
        )}
        
        {endorsements.length > 0 ? (
          <div className="space-y-3">
            {endorsements.map((endorsement) => (
              <div key={endorsement.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{endorsement.skill}</h3>
                    <div className="flex items-center mt-1">
                      <ThumbsUp className="h-3.5 w-3.5 text-blue-500 mr-1" />
                      <span className="text-sm text-gray-600">{endorsement.count} endorsements</span>
                    </div>
                  </div>
                  
                  {!isCurrentUser && user && (
                    <div>
                      {endorsement.endorsed_by_current_user ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEndorsement(endorsement.id)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEndorse(endorsement.id)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <ThumbsUp className="h-4 w-4 mr-1" />
                          )}
                          Endorse
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      if (selectedEndorsement === endorsement.id) {
                        setSelectedEndorsement(null);
                      } else {
                        fetchEndorsementUsers(endorsement.id);
                      }
                    }}
                  >
                    {selectedEndorsement === endorsement.id ? "Hide endorsers" : "Show endorsers"}
                  </Button>
                  
                  {selectedEndorsement === endorsement.id && (
                    <div className="mt-2 pl-2 border-l-2 border-gray-200">
                      {loadingUsers ? (
                        <div className="flex items-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : endorsementUsers.length > 0 ? (
                        <div className="space-y-2 py-1">
                          {endorsementUsers.map((endorser) => (
                            <div key={endorser.id} className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-gray-200 mr-2 overflow-hidden">
                                {endorser.avatar_url ? (
                                  <img
                                    src={endorser.avatar_url}
                                    alt={endorser.username}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-xs font-medium text-gray-600">
                                    {endorser.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm">{endorser.username}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-2">No endorsers found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Award className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No endorsements yet</p>
            {!isCurrentUser && user && (
              <p className="text-sm text-gray-400 mt-1">
                Be the first to endorse {isCurrentUser ? "your" : "their"} skills
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
