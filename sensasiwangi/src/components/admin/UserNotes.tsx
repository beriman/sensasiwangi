// @ts-ignore
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
// @ts-ignore
import { Button } from "../ui/button";
// @ts-ignore
import { Textarea } from "../ui/textarea";
// @ts-ignore
import { ScrollArea } from "../ui/scroll-area";
// @ts-ignore
import { Loader2, StickyNote, Plus, Save, Trash2 } from "lucide-react";
// @ts-ignore
import { useToast } from "../ui/use-toast";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";

interface UserNote {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
  admin: {
    full_name?: string;
    username?: string;
  };
}

interface UserNotesProps {
  userId: string;
}

export default function UserNotes({ userId }: UserNotesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const fetchUserNotes = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("admin_user_notes")
          .select(
            "id, note, created_at, updated_at, admin:admin_id(full_name, username)",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNotes(data ? data.map(note => ({
          id: note.id,
          note: note.note,
          created_at: note.created_at,
          updated_at: note.updated_at,
          admin: {
            full_name: note.admin?.[0]?.full_name,
            username: note.admin?.[0]?.username
          }
        })) : []);
      } catch (error) {
        console.error("Error fetching user notes:", error);
        toast({
          title: "Error",
          description: "Failed to load user notes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserNotes();
  }, [user, userId, toast]);

  const handleAddNote = async () => {
    if (!user || !newNote.trim()) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("admin_user_notes")
        .insert({
          user_id: userId,
          admin_id: user.id,
          note: newNote.trim(),
        })
        .select(
          "id, note, created_at, updated_at, admin:admin_id(full_name, username)",
        )
        .single();

      if (error) throw error;

      if (data) {
        const formattedNote: UserNote = {
          id: data.id,
          note: data.note,
          created_at: data.created_at,
          updated_at: data.updated_at,
          admin: {
            full_name: data.admin?.[0]?.full_name,
            username: data.admin?.[0]?.username
          }
        };
        setNotes([formattedNote, ...notes]);
      }
      setNewNote("");
      setAdding(false);
      toast({
        title: "Note Added",
        description: "User note has been added successfully",
      });
    } catch (error) {
      console.error("Error adding user note:", error);
      toast({
        title: "Error",
        description: "Failed to add user note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || !window.confirm("Are you sure you want to delete this note?"))
      return;

    try {
      const { error } = await supabase
        .from("admin_user_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      setNotes(notes.filter((note) => note.id !== noteId));
      toast({
        title: "Note Deleted",
        description: "User note has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user note:", error);
      toast({
        title: "Error",
        description: "Failed to delete user note",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <StickyNote className="h-5 w-5 mr-2 text-amber-500" />
          Admin Notes
        </CardTitle>
        <CardDescription>
          Internal notes about this user (only visible to admins)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!adding ? (
          <Button
            onClick={() => setAdding(true)}
            variant="outline"
            className="w-full mb-4"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Note
          </Button>
        ) : (
          <div className="mb-4 space-y-2">
            <Textarea
              placeholder="Enter your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAdding(false);
                  setNewNote("");
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save Note
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>No admin notes for this user yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-amber-50 rounded-md border border-amber-100"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-gray-500">
                      By{" "}
                      {note.admin?.full_name || note.admin?.username || "Admin"}{" "}
                      •{" "}
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}



