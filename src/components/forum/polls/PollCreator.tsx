import React, { useState } from "react";
import { 
  ChartBarIcon, 
  PlusIcon, 
  TrashIcon, 
  GripVertical,
  Calendar,
  Image as ImageIcon,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PollOption {
  id: string;
  text: string;
  image_url?: string;
  color?: string;
}

interface PollCreatorProps {
  threadId: string;
  onPollCreated?: (pollId: string) => void;
  onCancel?: () => void;
}

export default function PollCreator({ 
  threadId, 
  onPollCreated,
  onCancel
}: PollCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [maxChoices, setMaxChoices] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublicResults, setIsPublicResults] = useState(true);
  const [closeDate, setCloseDate] = useState<Date | undefined>(undefined);
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "", color: "#3b82f6" },
    { id: "2", text: "", color: "#ef4444" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const addOption = () => {
    const colors = [
      "#3b82f6", // blue
      "#ef4444", // red
      "#10b981", // green
      "#f59e0b", // amber
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#6366f1", // indigo
      "#14b8a6", // teal
      "#f97316", // orange
      "#84cc16"  // lime
    ];
    
    const newId = (options.length + 1).toString();
    const colorIndex = options.length % colors.length;
    
    setOptions([
      ...options,
      { id: newId, text: "", color: colors[colorIndex] }
    ]);
  };
  
  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast({
        title: "Error",
        description: "A poll must have at least 2 options",
        variant: "destructive",
      });
      return;
    }
    
    setOptions(options.filter(option => option.id !== id));
  };
  
  const updateOption = (id: string, field: keyof PollOption, value: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, [field]: value } : option
    ));
  };
  
  const handleMaxChoicesChange = (value: string) => {
    const maxChoicesValue = parseInt(value);
    setMaxChoices(maxChoicesValue);
    
    // If max choices is greater than 1, enable multiple choice
    if (maxChoicesValue > 1) {
      setIsMultipleChoice(true);
    }
  };
  
  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poll title",
        variant: "destructive",
      });
      return false;
    }
    
    if (options.some(option => !option.text.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all poll options",
        variant: "destructive",
      });
      return false;
    }
    
    if (options.length < 2) {
      toast({
        title: "Error",
        description: "A poll must have at least 2 options",
        variant: "destructive",
      });
      return false;
    }
    
    if (isMultipleChoice && (maxChoices < 2 || maxChoices > options.length)) {
      toast({
        title: "Error",
        description: `Max choices must be between 2 and ${options.length}`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Format options for API
      const formattedOptions = options.map(option => ({
        text: option.text,
        image_url: option.image_url,
        color: option.color
      }));
      
      // Create poll
      const { data, error } = await supabase.rpc(
        'create_poll',
        {
          thread_id_param: threadId,
          title_param: title,
          description_param: description,
          is_multiple_choice_param: isMultipleChoice,
          max_choices_param: maxChoices,
          is_anonymous_param: isAnonymous,
          is_public_results_param: isPublicResults,
          close_date_param: closeDate?.toISOString(),
          options_param: formattedOptions,
          user_id_param: user.id
        }
      );
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Poll created successfully",
      });
      
      // Call onPollCreated callback
      if (onPollCreated) {
        onPollCreated(data);
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-md bg-white">
      <div className="flex items-center gap-2 mb-4">
        <ChartBarIcon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Create Poll</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="poll-title">Poll Title</Label>
          <Input
            id="poll-title"
            placeholder="Ask a question..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="poll-description">Description (Optional)</Label>
          <Textarea
            id="poll-description"
            placeholder="Add more context to your poll..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>
        
        <div>
          <Label>Poll Options</Label>
          <div className="space-y-2 mt-2">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: option.color }}
                />
                
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(option.id, "text", e.target.value)}
                  className="flex-1"
                />
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        "#3b82f6", // blue
                        "#ef4444", // red
                        "#10b981", // green
                        "#f59e0b", // amber
                        "#8b5cf6", // purple
                        "#ec4899", // pink
                        "#6366f1", // indigo
                        "#14b8a6", // teal
                        "#f97316", // orange
                        "#84cc16"  // lime
                      ].map((color) => (
                        <div
                          key={color}
                          className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                            option.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateOption(option.id, "color", color)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(option.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full mt-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="multiple-choice">Multiple Choice</Label>
              <Switch
                id="multiple-choice"
                checked={isMultipleChoice}
                onCheckedChange={(checked) => {
                  setIsMultipleChoice(checked);
                  if (!checked) {
                    setMaxChoices(1);
                  } else {
                    setMaxChoices(2);
                  }
                }}
              />
            </div>
            
            {isMultipleChoice && (
              <div>
                <Label htmlFor="max-choices">Max Choices</Label>
                <Select
                  value={maxChoices.toString()}
                  onValueChange={handleMaxChoicesChange}
                >
                  <SelectTrigger id="max-choices">
                    <SelectValue placeholder="Select max choices" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: options.length - 1 }, (_, i) => i + 2).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                    <SelectItem value={options.length.toString()}>
                      {options.length} (All)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="anonymous-voting">Anonymous Voting</Label>
              <Switch
                id="anonymous-voting"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="public-results">Public Results</Label>
              <Switch
                id="public-results"
                checked={isPublicResults}
                onCheckedChange={setIsPublicResults}
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label>Poll Duration</Label>
          <div className="flex items-center mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !closeDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {closeDate ? format(closeDate, "PPP") : "No end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={closeDate}
                  onSelect={setCloseDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            
            {closeDate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCloseDate(undefined)}
                className="ml-2"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Create Poll
        </Button>
      </div>
    </div>
  );
}
