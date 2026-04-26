export type PostStatus = "pending" | "posted" | "failed" | "cancelled";

export interface SocialPost {
  id: string;
  content: string;
  scheduled_at: string;
  status: PostStatus;
  posted_at: string | null;
  x_tweet_id: string | null;
  error: string | null;
  attempt_count: number;
  created_at: string;
}
