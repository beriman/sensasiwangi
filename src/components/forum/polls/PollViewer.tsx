import React, { useState, useEffect } from "react";
import { 
  ChartBarIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon,
  UserIcon,
  CalendarIcon,
  CheckIcon,
  RefreshCwIcon,
  XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow, format, isPast } from "date-fns";

interface PollOption {
  id: string;
  option_text: string;
  image_url?: string;
  color?: string;
  vote_count: number;
  percentage: number;
}

interface Poll {
  id: string;
  thread_id: string;
  title: string;
  description?: string;
  is_multiple_choice: boolean;
  max_choices: number;
  is_anonymous: boolean;
  is_public_results: boolean;
  close_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_open: boolean;
  total_votes: number;
  options: PollOption[];
  user_votes: string[];
}

interface PollViewerProps {
  pollId: string;
  threadId: string;
  className?: string;
}

export default function PollViewer({ 
  pollId, 
  threadId,
  className = ""
}: PollViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  
  useEffect(() => {
    fetchPoll();
  }, [pollId]);
  
  useEffect(() => {
    if (poll) {
      // Initialize selected options from user votes
      setSelectedOptions(poll.user_votes || []);
      
      // Show results if user has voted or poll is closed
      setShowResults(
        (poll.user_votes && poll.user_votes.length > 0) || 
        !poll.is_open || 
        (poll.is_public_results && poll.total_votes > 0)
      );
      
      // Fetch poll creator
      if (poll.created_by) {
        fetchCreator(poll.created_by);
      }
    }
  }, [poll]);
  
  const fetchPoll = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc(
        'get_poll_results',
        {
          poll_id_param: pollId,
          user_id_param: user.id
        }
      );
      
      if (error) throw error;
      
      setPoll(data);
    } catch (error) {
      console.error("Error fetching poll:", error);
      toast({
        title: "Error",
        description: "Failed to load poll",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCreator = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .eq("id", creatorId)
        .single();
      
      if (error) throw error;
      
      setCreator(data);
    } catch (error) {
      console.error("Error fetching poll creator:", error);
    }
  };
  
  const handleOptionSelect = (optionId: string) => {
    if (!poll || !poll.is_open) return;
    
    if (poll.is_multiple_choice) {
      // For multiple choice polls
      if (selectedOptions.includes(optionId)) {
        // Remove option if already selected
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        // Add option if not at max choices
        if (selectedOptions.length < poll.max_choices) {
          setSelectedOptions([...selectedOptions, optionId]);
        } else {
          toast({
            title: "Max choices reached",
            description: `You can only select up to ${poll.max_choices} options`,
            variant: "destructive",
          });
        }
      }
    } else {
      // For single choice polls
      setSelectedOptions([optionId]);
    }
  };
  
  const handleVote = async () => {
    if (!user || !poll) return;
    
    if (selectedOptions.length === 0) {
      toast({
        title: "No option selected",
        description: "Please select at least one option",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase.rpc(
        'vote_on_poll',
        {
          poll_id_param: pollId,
          option_ids: selectedOptions,
          user_id_param: user.id
        }
      );
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
      
      // Refresh poll
      fetchPoll();
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleToggleResults = () => {
    setShowResults(!showResults);
  };
  
  const handleClosePoll = async () => {
    if (!user || !poll) return;
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase.rpc(
        'close_poll',
        {
          poll_id_param: pollId,
          user_id_param: user.id
        }
      );
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Poll has been closed",
      });
      
      // Refresh poll
      fetchPoll();
    } catch (error) {
      console.error("Error closing poll:", error);
      toast({
        title: "Error",
        description: "Failed to close poll",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderPollStatus = () => {
    if (!poll) return null;
    
    if (!poll.is_open) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          <LockIcon className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
    }
    
    if (poll.close_date) {
      const closeDate = new Date(poll.close_date);
      const isExpired = isPast(closeDate);
      
      if (isExpired) {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <LockIcon className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Closes {formatDistanceToNow(closeDate, { addSuffix: true })}
          </Badge>
        );
      }
    }
    
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        <ChartBarIcon className="h-3 w-3 mr-1" />
        Open
      </Badge>
    );
  };
  
  const renderVoteCount = () => {
    if (!poll) return null;
    
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800">
        <UserIcon className="h-3 w-3 mr-1" />
        {poll.total_votes} {poll.total_votes === 1 ? "vote" : "votes"}
      </Badge>
    );
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading poll..." />
        </CardContent>
      </Card>
    );
  }
  
  if (!poll) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Poll not found or you don't have permission to view it</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-primary" />
            <CardTitle>{poll.title}</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {renderPollStatus()}
            {renderVoteCount()}
          </div>
        </div>
        
        {poll.description && (
          <CardDescription>{poll.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {showResults ? (
          // Show poll results
          <div className="space-y-4">
            {poll.options.sort((a, b) => b.vote_count - a.vote_count).map((option) => {
              const isSelected = poll.user_votes && poll.user_votes.includes(option.id);
              
              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className={`w-3 h-3 rounded-full mr-2`}
                        style={{ backgroundColor: option.color || '#3b82f6' }}
                      />
                      <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>
                        {option.option_text}
                        {isSelected && <CheckIcon className="h-3 w-3 ml-1 inline text-green-500" />}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {option.percentage}% ({option.vote_count})
                    </div>
                  </div>
                  
                  <Progress 
                    value={option.percentage} 
                    className="h-2"
                    style={{ 
                      backgroundColor: `${option.color || '#3b82f6'}20`,
                      "--progress-background": option.color || '#3b82f6'
                    } as any}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          // Show voting interface
          <div className="space-y-4">
            {poll.is_multiple_choice ? (
              // Multiple choice poll
              <div className="space-y-3">
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleOptionSelect(option.id)}
                      disabled={!poll.is_open}
                      style={{ 
                        "--checkbox-background": option.color || '#3b82f6',
                        "--checkbox-border": option.color || '#3b82f6'
                      } as any}
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="cursor-pointer"
                    >
                      {option.option_text}
                    </Label>
                  </div>
                ))}
                
                {poll.is_open && (
                  <p className="text-xs text-gray-500">
                    Select up to {poll.max_choices} {poll.max_choices === 1 ? "option" : "options"}
                  </p>
                )}
              </div>
            ) : (
              // Single choice poll
              <RadioGroup
                value={selectedOptions[0] || ""}
                onValueChange={(value) => setSelectedOptions([value])}
                disabled={!poll.is_open}
              >
                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem
                        id={`option-${option.id}`}
                        value={option.id}
                        disabled={!poll.is_open}
                        style={{ 
                          "--radio-background": option.color || '#3b82f6',
                          "--radio-border": option.color || '#3b82f6'
                        } as any}
                      />
                      <Label
                        htmlFor={`option-${option.id}`}
                        className="cursor-pointer"
                      >
                        {option.option_text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center">
            {poll.is_anonymous && (
              <div className="flex items-center mr-3">
                <UserIcon className="h-3 w-3 mr-1" />
                <span>Anonymous voting</span>
              </div>
            )}
            
            {poll.close_date && (
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>
                  {isPast(new Date(poll.close_date))
                    ? `Closed on ${format(new Date(poll.close_date), "PPP")}`
                    : `Closes on ${format(new Date(poll.close_date), "PPP")}`}
                </span>
              </div>
            )}
          </div>
          
          {creator && (
            <div className="flex items-center">
              <span className="mr-1">Created by</span>
              <span className="font-medium">{creator.username}</span>
            </div>
          )}
        </div>
        
        <div className="w-full flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleResults}
            disabled={!poll.is_public_results && poll.total_votes === 0}
          >
            {showResults ? (
              <>
                <XIcon className="h-4 w-4 mr-1" />
                Hide Results
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4 mr-1" />
                Show Results
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            {poll.is_open && user && poll.created_by === user.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClosePoll}
                disabled={submitting}
              >
                <LockIcon className="h-4 w-4 mr-1" />
                Close Poll
              </Button>
            )}
            
            {poll.is_open && (
              <Button
                size="sm"
                onClick={handleVote}
                disabled={submitting || selectedOptions.length === 0}
              >
                {submitting ? (
                  <LoadingSpinner size="sm" className="mr-1" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-1" />
                )}
                Vote
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
