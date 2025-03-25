export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

export interface UserFollower {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  is_following?: boolean;
}

export interface UserFollowing {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}
