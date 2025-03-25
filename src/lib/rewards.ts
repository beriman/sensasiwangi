import { supabase } from "../../supabase/supabase";

// Record a daily login and award EXP
export async function recordDailyLogin(userId: string): Promise<{
  expAwarded: number;
  streakCount: number;
  isNewLogin: boolean;
}> {
  // Check if user already logged in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existingLogin, error: checkError } = await supabase
    .from("daily_login_rewards")
    .select("id, exp_awarded, streak_count")
    .eq("user_id", userId)
    .gte("login_date", today.toISOString())
    .lt("login_date", new Date(today.getTime() + 86400000).toISOString())
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw checkError;
  }

  // If already logged in today, return existing data
  if (existingLogin) {
    return {
      expAwarded: existingLogin.exp_awarded,
      streakCount: existingLogin.streak_count,
      isNewLogin: false,
    };
  }

  // Record new login (the trigger will handle streak calculation and EXP award)
  const { data: newLogin, error: insertError } = await supabase
    .from("daily_login_rewards")
    .insert({
      user_id: userId,
    })
    .select("exp_awarded, streak_count")
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    expAwarded: newLogin.exp_awarded,
    streakCount: newLogin.streak_count,
    isNewLogin: true,
  };
}

// Get user's login streak information
export async function getUserLoginStreak(userId: string): Promise<{
  currentStreak: number;
  lastLoginDate: string | null;
  totalLogins: number;
}> {
  // Get the most recent login
  const { data: recentLogin, error: recentError } = await supabase
    .from("daily_login_rewards")
    .select("login_date, streak_count")
    .eq("user_id", userId)
    .order("login_date", { ascending: false })
    .limit(1)
    .single();

  if (recentError && recentError.code !== "PGRST116") {
    throw recentError;
  }

  // Get total number of logins
  const { count, error: countError } = await supabase
    .from("daily_login_rewards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw countError;
  }

  return {
    currentStreak: recentLogin?.streak_count || 0,
    lastLoginDate: recentLogin?.login_date || null,
    totalLogins: count || 0,
  };
}

// Mark tutorial as seen
export async function markTutorialAsSeen(userId: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ has_seen_tutorial: true })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

// Check if user has seen tutorial
export async function hasTutorialBeenSeen(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("has_seen_tutorial")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data?.has_seen_tutorial || false;
}
