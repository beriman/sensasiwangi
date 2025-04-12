// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../../../../supabase/supabase";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
// @ts-ignore
import { LoadingSpinner } from "../../../components/ui/loading-spinner";
// @ts-ignore
import { MessageSquare, MessageCircle } from "lucide-react";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";

interface Thread {
  id: string;
  title: string;
  created_at: string;
  view_count: number;
  reply_count: number;
  category: { name: string };
}

interface Reply {
  id: string;
  created_at: string;
  thread: { id: string; title: string };
}

interface UserForumActivityProps {
  userId: string;
}

export default function UserForumActivity({ userId }: UserForumActivityProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("threads");

  useEffect(() => {
    const fetchForumActivity = async () => {
      try {
        setLoading(true);

        // Fetch user's threads
        const { data: threadsData, error: threadsError } = await supabase
          .from("forum_threads")
          .select(
            "id, title, created_at, view_count, reply_count, category(name)",
          )
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (threadsError) throw threadsError;
        setThreads(threadsData || []);

        // Fetch user's replies
        const { data: repliesData, error: repliesError } = await supabase
          .from("forum_replies")
          .select("id, created_at, thread(id, title)")
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (repliesError) throw repliesError;
        setReplies(repliesData || []);
      } catch (error) {
        console.error("Error fetching forum activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForumActivity();
  }, [userId]);

  if (loading) {
    return <LoadingSpinner text="Loading forum activity..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Forum Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="threads">
              <MessageSquare className="h-4 w-4 mr-2" />
              Threads ({threads.length})
            </TabsTrigger>
            <TabsTrigger value="replies">
              <MessageCircle className="h-4 w-4 mr-2" />
              Replies ({replies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="threads" className="mt-4">
            {threads.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No threads created yet
              </p>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className="border rounded-md p-3 hover:bg-gray-50"
                  >
                    <a href={`/forum/thread/${thread.id}`} className="block">
                      <h3 className="font-medium text-blue-600 hover:text-blue-800">
                        {thread.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-2">
                          {thread.category?.name || "Uncategorized"}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(thread.created_at))} ago
                        </span>
                        <span className="mx-2">•</span>
                        <span>{thread.view_count} views</span>
                        <span className="mx-2">•</span>
                        <span>{thread.reply_count} replies</span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-4">
            {replies.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No replies posted yet
              </p>
            ) : (
              <div className="space-y-3">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="border rounded-md p-3 hover:bg-gray-50"
                  >
                    <a
                      href={`/forum/thread/${reply.thread?.id}`}
                      className="block"
                    >
                      <h3 className="font-medium text-blue-600 hover:text-blue-800">
                        Reply to: {reply.thread?.title}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(reply.created_at))} ago
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


