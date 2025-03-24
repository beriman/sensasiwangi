import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { vote, getUserVote } from "@/lib/forum";
import { VoteType } from "@/types/forum";

interface ThreadVoteProps {
  threadId: string;
  initialVotes?: {
    cendol: number;
    bata: number;
  };
  onVoteComplete?: (newVotes: { cendol: number; bata: number }) => void;
}

export default function ThreadVote({
  threadId,
  initialVotes = { cendol: 0, bata: 0 },
  onVoteComplete,
}: ThreadVoteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchUserVote = async () => {
        try {
          const voteType = await getUserVote(user.id, threadId);
          setUserVote(voteType);
        } catch (error) {
          console.error("Error fetching user vote:", error);
        }
      };

      fetchUserVote();
    }
  }, [user, threadId]);

  const handleVote = async (voteType: VoteType) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to vote on threads.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    try {
      // Calculate new vote counts based on current state and action
      let newVotes = { ...votes };

      if (userVote === voteType) {
        // User is removing their vote
        newVotes[voteType] = Math.max(0, newVotes[voteType] - 1);
        setUserVote(null);
      } else {
        // User is changing vote or adding new vote
        if (userVote) {
          // Remove previous vote
          newVotes[userVote] = Math.max(0, newVotes[userVote] - 1);
        }
        // Add new vote
        newVotes[voteType] = newVotes[voteType] + 1;
        setUserVote(voteType);
      }

      // Update UI immediately for better UX
      setVotes(newVotes);

      // Send to server
      const { levelUp } = await vote(user.id, voteType, threadId);

      // Notify if someone leveled up
      if (levelUp) {
        toast({
          title: "Level Up!",
          description: `Thread author has leveled up to level ${levelUp.newLevel}!`,
        });
      }

      // Callback with new vote counts
      if (onVoteComplete) {
        onVoteComplete(newVotes);
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive",
      });
      // Revert UI changes on error
      setUserVote(userVote);
      setVotes(initialVotes);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote("cendol")}
        disabled={isVoting}
        className={`px-2 ${userVote === "cendol" ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        <span>{votes.cendol}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote("bata")}
        disabled={isVoting}
        className={`px-2 ${userVote === "bata" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-red-600 hover:bg-red-50"}`}
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        <span>{votes.bata}</span>
      </Button>
    </div>
  );
}
