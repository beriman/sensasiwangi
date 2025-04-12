// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { useParams, useNavigate } from "react-router-dom";
// @ts-ignore
import MainLayout from "../../components/layout/MainLayout";
// @ts-ignore
import ForumLayout from "../../components/forum/ForumLayout";
// @ts-ignore
import ForumCategoryList from "../../components/forum/ForumCategoryList";
// @ts-ignore
import ForumThreadList from "../../components/forum/ForumThreadList";
// @ts-ignore
import ForumThreadDetail from "../../components/forum/ForumThreadDetail";
// @ts-ignore
import ForumNewThread from "../../components/forum/ForumNewThread";
// @ts-ignore
import { LoadingScreen } from "../../components/ui/loading-spinner";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";

export default function Forum() {
  const { user } = useAuth();
  const { categoryId, threadId, action } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [threadTitle, setThreadTitle] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      if (categoryId) {
        try {
          // Fetch category name
          const { data, error } = await supabase
            .from("forum_categories")
            .select("name")
            .eq("id", categoryId)
            .single();
          
          if (error) throw error;
          setCategoryName(data.name);
        } catch (error) {
          console.error("Error fetching category:", error);
          navigate("/forum");
        }
      }
      
      if (threadId) {
        try {
          // Fetch thread title
          const { data, error } = await supabase
            .from("forum_threads")
            .select("title")
            .eq("id", threadId)
            .single();
          
          if (error) throw error;
          setThreadTitle(data.title);
        } catch (error) {
          console.error("Error fetching thread:", error);
          navigate(categoryId ? `/forum/category/${categoryId}` : "/forum");
        }
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [categoryId, threadId, navigate]);

  const renderContent = () => {
    if (loading) {
      return <LoadingScreen text="Loading forum..." />;
    }

    // New thread form
    if (action === "new-thread" && categoryId) {
      return (
        <ForumLayout 
          title={`New Thread in ${categoryName}`}
          subtitle="Share your thoughts, questions, or ideas with the community"
        >
          <ForumNewThread categoryId={categoryId} />
        </ForumLayout>
      );
    }
    
    // Thread detail
    if (threadId) {
      return (
        <ForumLayout 
          title={threadTitle}
          subtitle={categoryName ? `Posted in ${categoryName}` : undefined}
        >
          <ForumThreadDetail threadId={threadId} />
        </ForumLayout>
      );
    }
    
    // Thread list for a category
    if (categoryId) {
      return (
        <ForumLayout 
          title={categoryName}
          subtitle="Browse threads in this category"
        >
          <ForumThreadList categoryId={categoryId} />
        </ForumLayout>
      );
    }
    
    // Category list (forum home)
    return (
      <ForumLayout 
        title="Forum Komunitas"
        subtitle="Diskusikan dengan sesama penggemar wewangian dan bagikan pengetahuan Anda"
      >
        <ForumCategoryList />
      </ForumLayout>
    );
  };

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  );
}


