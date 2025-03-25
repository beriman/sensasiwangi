import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Edit,
  Award,
  Calendar as CalendarIcon2,
} from "lucide-react";
import { ForumSeasonalEvent, ForumEventChallenge } from "@/types/forum";
import {
  createSeasonalEvent,
  updateSeasonalEvent,
  deleteSeasonalEvent,
  getSeasonalEvents,
  getSeasonalEvent,
  createEventChallenge,
  updateEventChallenge,
  deleteEventChallenge,
} from "@/lib/forum";

type Badge = {
  id: string;
  badge_name: string;
  badge_description: string;
  is_seasonal?: boolean;
};

const SeasonalEventsManagement = () => {
  const [events, setEvents] = useState<ForumSeasonalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ForumSeasonalEvent | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
  });
  const [newChallenge, setNewChallenge] = useState({
    name: "",
    description: "",
    requirementType: "threads",
    requirementCount: 5,
    badgeId: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchBadges();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getSeasonalEvents(true);
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        variant: "destructive",
        title: "Error fetching events",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id, badge_name, badge_description, is_seasonal")
        .order("badge_name", { ascending: true });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const fetchEventDetails = async (eventId: string) => {
    try {
      const event = await getSeasonalEvent(eventId);
      setSelectedEvent(event);
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast({
        variant: "destructive",
        title: "Error fetching event details",
        description: "Please try again later.",
      });
    }
  };

  const handleAddEvent = async () => {
    try {
      if (!newEvent.name) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please enter an event name.",
        });
        return;
      }

      if (editMode && editId) {
        await updateSeasonalEvent(editId, {
          name: newEvent.name,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          isActive: newEvent.isActive,
        });

        toast({
          title: "Event updated",
          description: "Event has been successfully updated.",
        });
      } else {
        await createSeasonalEvent({
          name: newEvent.name,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          isActive: newEvent.isActive,
        });

        toast({
          title: "Event added",
          description: "Event has been successfully created.",
        });
      }

      // Reset form and close dialog
      setNewEvent({
        name: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      });
      setEditMode(false);
      setEditId("");
      setIsEventDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error adding/updating event:", error);
      toast({
        variant: "destructive",
        title: "Error saving event",
        description: "Please try again later.",
      });
    }
  };

  const handleAddChallenge = async () => {
    try {
      if (!selectedEvent) return;

      if (!newChallenge.name) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please enter a challenge name.",
        });
        return;
      }

      if (editMode && editId) {
        await updateEventChallenge(editId, {
          name: newChallenge.name,
          description: newChallenge.description,
          requirementType: newChallenge.requirementType as
            | "threads"
            | "replies"
            | "votes"
            | "exp",
          requirementCount: newChallenge.requirementCount,
          badgeId: newChallenge.badgeId || null,
        });

        toast({
          title: "Challenge updated",
          description: "Challenge has been successfully updated.",
        });
      } else {
        await createEventChallenge({
          eventId: selectedEvent.id,
          name: newChallenge.name,
          description: newChallenge.description,
          requirementType: newChallenge.requirementType as
            | "threads"
            | "replies"
            | "votes"
            | "exp",
          requirementCount: newChallenge.requirementCount,
          badgeId: newChallenge.badgeId,
        });

        toast({
          title: "Challenge added",
          description: "Challenge has been successfully created.",
        });
      }

      // Reset form and close dialog
      setNewChallenge({
        name: "",
        description: "",
        requirementType: "threads",
        requirementCount: 5,
        badgeId: "",
      });
      setEditMode(false);
      setEditId("");
      setIsChallengeDialogOpen(false);
      fetchEventDetails(selectedEvent.id);
    } catch (error) {
      console.error("Error adding/updating challenge:", error);
      toast({
        variant: "destructive",
        title: "Error saving challenge",
        description: "Please try again later.",
      });
    }
  };

  const handleEditEvent = (event: ForumSeasonalEvent) => {
    setNewEvent({
      name: event.name,
      description: event.description || "",
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      isActive: event.is_active,
    });
    setEditMode(true);
    setEditId(event.id);
    setIsEventDialogOpen(true);
  };

  const handleEditChallenge = (challenge: ForumEventChallenge) => {
    setNewChallenge({
      name: challenge.name,
      description: challenge.description || "",
      requirementType: challenge.requirement_type,
      requirementCount: challenge.requirement_count,
      badgeId: challenge.badge_id || "",
    });
    setEditMode(true);
    setEditId(challenge.id);
    setIsChallengeDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This will also delete all associated challenges and user progress.",
      )
    ) {
      try {
        await deleteSeasonalEvent(eventId);
        toast({
          title: "Event deleted",
          description: "Event has been successfully deleted.",
        });
        fetchEvents();
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({
          variant: "destructive",
          title: "Error deleting event",
          description: "Please try again later.",
        });
      }
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this challenge? This will also delete all user progress for this challenge.",
      )
    ) {
      try {
        await deleteEventChallenge(challengeId);
        toast({
          title: "Challenge deleted",
          description: "Challenge has been successfully deleted.",
        });
        if (selectedEvent) {
          fetchEventDetails(selectedEvent.id);
        }
      } catch (error) {
        console.error("Error deleting challenge:", error);
        toast({
          variant: "destructive",
          title: "Error deleting challenge",
          description: "Please try again later.",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  const getRequirementTypeLabel = (type: string) => {
    switch (type) {
      case "threads":
        return "Create Threads";
      case "replies":
        return "Post Replies";
      case "votes":
        return "Receive Votes";
      case "exp":
        return "Earn EXP Points";
      default:
        return type;
    }
  };

  const isEventActive = (event: ForumSeasonalEvent) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    return event.is_active && now >= startDate && now <= endDate;
  };

  const isEventUpcoming = (event: ForumSeasonalEvent) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    return event.is_active && now < startDate;
  };

  const isEventPast = (event: ForumSeasonalEvent) => {
    const now = new Date();
    const endDate = new Date(event.end_date);
    return now > endDate;
  };

  const getEventStatusBadge = (event: ForumSeasonalEvent) => {
    if (!event.is_active) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">
          Inactive
        </span>
      );
    } else if (isEventActive(event)) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
    } else if (isEventUpcoming(event)) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          Upcoming
        </span>
      );
    } else if (isEventPast(event)) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">
          Ended
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center justify-between">
                <span>Seasonal Events</span>
                <div className="flex space-x-2">
                  <Dialog
                    open={isEventDialogOpen}
                    onOpenChange={setIsEventDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Plus className="w-4 h-4 mr-1" /> New Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editMode ? "Edit Event" : "Create New Event"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="eventName">Event Name</Label>
                          <Input
                            id="eventName"
                            value={newEvent.name}
                            onChange={(e) =>
                              setNewEvent({ ...newEvent, name: e.target.value })
                            }
                            placeholder="e.g. Summer Perfume Challenge"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="eventDescription">Description</Label>
                          <Textarea
                            id="eventDescription"
                            value={newEvent.description}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe the seasonal event"
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(newEvent.startDate, "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={newEvent.startDate}
                                  onSelect={(date) =>
                                    setNewEvent({
                                      ...newEvent,
                                      startDate: date || new Date(),
                                    })
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid gap-2">
                            <Label>End Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(newEvent.endDate, "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={newEvent.endDate}
                                  onSelect={(date) =>
                                    setNewEvent({
                                      ...newEvent,
                                      endDate: date || new Date(),
                                    })
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={newEvent.isActive}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                isActive: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Label
                            htmlFor="isActive"
                            className="text-sm font-medium text-gray-700"
                          >
                            Active
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEventDialogOpen(false);
                            setEditMode(false);
                            setEditId("");
                            setNewEvent({
                              name: "",
                              description: "",
                              startDate: new Date(),
                              endDate: new Date(
                                new Date().setMonth(new Date().getMonth() + 1),
                              ),
                              isActive: true,
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddEvent}>
                          {editMode ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={fetchEvents}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.length === 0 && !loading ? (
                  <p className="text-center text-gray-500 py-4">
                    No events found
                  </p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedEvent?.id === event.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}
                      onClick={() => fetchEventDetails(event.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {event.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <CalendarIcon2 className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {formatDate(event.start_date)} -{" "}
                              {formatDate(event.end_date)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getEventStatusBadge(event)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <p className="text-center text-gray-500 py-4">
                    Loading events...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center justify-between">
                <span>
                  {selectedEvent ? (
                    <>
                      {selectedEvent.name} - Challenges
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {formatDate(selectedEvent.start_date)} -{" "}
                        {formatDate(selectedEvent.end_date)}
                      </span>
                    </>
                  ) : (
                    "Select an event to manage challenges"
                  )}
                </span>
                {selectedEvent && (
                  <Dialog
                    open={isChallengeDialogOpen}
                    onOpenChange={setIsChallengeDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Challenge
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editMode ? "Edit Challenge" : "Add New Challenge"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="challengeName">Challenge Name</Label>
                          <Input
                            id="challengeName"
                            value={newChallenge.name}
                            onChange={(e) =>
                              setNewChallenge({
                                ...newChallenge,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. Post 10 Reviews"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="challengeDescription">
                            Description (Optional)
                          </Label>
                          <Textarea
                            id="challengeDescription"
                            value={newChallenge.description}
                            onChange={(e) =>
                              setNewChallenge({
                                ...newChallenge,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe what users need to do"
                            rows={2}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="requirementType">
                            Requirement Type
                          </Label>
                          <select
                            id="requirementType"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={newChallenge.requirementType}
                            onChange={(e) =>
                              setNewChallenge({
                                ...newChallenge,
                                requirementType: e.target.value,
                              })
                            }
                          >
                            <option value="threads">Create Threads</option>
                            <option value="replies">Post Replies</option>
                            <option value="votes">Receive Votes</option>
                            <option value="exp">Earn EXP Points</option>
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="requirementCount">
                            Required Count
                          </Label>
                          <Input
                            id="requirementCount"
                            type="number"
                            min="1"
                            value={newChallenge.requirementCount}
                            onChange={(e) =>
                              setNewChallenge({
                                ...newChallenge,
                                requirementCount: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="badgeId">
                            Award Badge (Optional)
                          </Label>
                          <select
                            id="badgeId"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={newChallenge.badgeId}
                            onChange={(e) =>
                              setNewChallenge({
                                ...newChallenge,
                                badgeId: e.target.value,
                              })
                            }
                          >
                            <option value="">Select a badge (optional)</option>
                            {badges
                              .filter((badge) => badge.is_seasonal)
                              .map((badge) => (
                                <option key={badge.id} value={badge.id}>
                                  {badge.badge_name}
                                </option>
                              ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Only seasonal badges are shown. Create seasonal
                            badges in the Badges tab.
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsChallengeDialogOpen(false);
                            setEditMode(false);
                            setEditId("");
                            setNewChallenge({
                              name: "",
                              description: "",
                              requirementType: "threads",
                              requirementCount: 5,
                              badgeId: "",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddChallenge}>
                          {editMode ? "Update" : "Add"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedEvent ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon2 className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    No event selected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select an event from the list to view and manage its
                    challenges.
                  </p>
                </div>
              ) : selectedEvent.challenges &&
                selectedEvent.challenges.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3">Challenge</th>
                        <th className="px-6 py-3">Requirement</th>
                        <th className="px-6 py-3">Badge</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEvent.challenges.map((challenge) => (
                        <tr key={challenge.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {challenge.name}
                            </div>
                            {challenge.description && (
                              <div className="text-sm text-gray-500">
                                {challenge.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {getRequirementTypeLabel(
                                challenge.requirement_type,
                              )}
                              : {challenge.requirement_count}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {challenge.badge ? (
                              <div className="flex items-center">
                                <Award className="h-4 w-4 text-yellow-500 mr-2" />
                                <div className="text-sm text-gray-900">
                                  {challenge.badge.badge_name}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                No badge
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleEditChallenge(challenge)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeleteChallenge(challenge.id)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    No challenges yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a challenge to this event.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => setIsChallengeDialogOpen(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Challenge
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SeasonalEventsManagement;
