import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/lib/supabase";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ProfileRadarChartProps {
  userId: string;
  className?: string;
}

interface CategoryReputation {
  category_id: string;
  category_name: string;
  reputation_score: number;
  max_score: number;
}

export default function ProfileRadarChart({
  userId,
  className = ""
}: ProfileRadarChartProps) {
  const [loading, setLoading] = useState(true);
  const [categoryReputations, setCategoryReputations] = useState<CategoryReputation[]>([]);
  
  useEffect(() => {
    fetchCategoryReputations();
  }, [userId]);
  
  const fetchCategoryReputations = async () => {
    try {
      setLoading(true);
      
      // Fetch user's reputation in each category
      const { data: reputationData, error: reputationError } = await supabase
        .from("forum_user_category_reputation")
        .select(`
          category_id,
          reputation_score,
          category:category_id (
            name
          )
        `)
        .eq("user_id", userId);
      
      if (reputationError) throw reputationError;
      
      // Fetch all categories to ensure we have a complete set
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("forum_categories")
        .select("id, name");
      
      if (categoriesError) throw categoriesError;
      
      // Get the maximum reputation score for normalization
      const { data: maxScoreData, error: maxScoreError } = await supabase
        .from("forum_user_category_reputation")
        .select("reputation_score")
        .order("reputation_score", { ascending: false })
        .limit(1);
      
      if (maxScoreError) throw maxScoreError;
      
      const maxScore = maxScoreData && maxScoreData.length > 0 
        ? maxScoreData[0].reputation_score 
        : 100; // Default max score
      
      // Create a complete set of category reputations
      const formattedReputations: CategoryReputation[] = categoriesData.map((category) => {
        const userReputation = reputationData?.find(rep => rep.category_id === category.id);
        return {
          category_id: category.id,
          category_name: category.name,
          reputation_score: userReputation ? userReputation.reputation_score : 0,
          max_score: maxScore
        };
      });
      
      setCategoryReputations(formattedReputations);
    } catch (error) {
      console.error("Error fetching category reputations:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const chartData = {
    labels: categoryReputations.map(rep => rep.category_name),
    datasets: [
      {
        label: 'Reputation',
        data: categoryReputations.map(rep => (rep.reputation_score / rep.max_score) * 100),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
      }
    ]
  };
  
  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const value = categoryReputations[index].reputation_score;
            return `Reputation: ${value}`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Expertise Areas</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading expertise data..." />
        </CardContent>
      </Card>
    );
  }
  
  if (categoryReputations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Expertise Areas</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <p className="text-gray-500">No expertise data available yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Participate in different categories to build your expertise profile
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">Expertise Areas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Radar data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {categoryReputations
            .sort((a, b) => b.reputation_score - a.reputation_score)
            .slice(0, 4)
            .map((rep) => (
              <div key={rep.category_id} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                <span className="text-sm font-medium">{rep.category_name}</span>
                <span className="text-sm text-gray-500">{rep.reputation_score}</span>
              </div>
            ))
          }
        </div>
      </CardContent>
    </Card>
  );
}
