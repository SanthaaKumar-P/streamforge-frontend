// Mock data for Netflix Show Management System
export type ShowStatus = "approved" | "pending" | "rejected" | "review" | "production";
export type ProductionStage = "planning" | "pre-production" | "production" | "post-production" | "completed";

export interface Show {
  id: string;
  title: string;
  genre: string;
  language: string;
  episodes: number;
  budget: number;
  creator: string;
  submittedAt: string;
  status: ShowStatus;
  stage: ProductionStage;
  poster: string;
  progress: number;
  priority: "low" | "medium" | "high" | "critical";
  team: number;
  deadline: string;
  description: string;
}

const posters = [
  "https://images.unsplash.com/photo-1489599735734-79b4212bea3f?w=400&auto=format",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&auto=format",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&auto=format",
  "https://images.unsplash.com/photo-1518676590629-3dcba9c5a555?w=400&auto=format",
  "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&auto=format",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format",
  "https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=400&auto=format",
  "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&auto=format",
  "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&auto=format",
  "https://images.unsplash.com/photo-1626814026042-59cfd7dab7a7?w=400&auto=format",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&auto=format",
  "https://images.unsplash.com/photo-1543536448-1b0b7b8dfe97?w=400&auto=format",
];

const titles = [
  "Nightfall Protocol", "The Crimson Empire", "Shadow Circuit", "Ocean of Stars",
  "Neon Requiem", "The Last Cartographer", "Echoes of Tomorrow", "Silent Verdict",
  "Blackwater Kings", "The Vanishing Hour", "Cascade", "Midnight in Seoul",
];

const genres = ["Drama", "Thriller", "Sci-Fi", "Crime", "Fantasy", "Comedy", "Documentary", "Action"];
const creators = ["A. Nakamura", "L. Okonkwo", "M. Herrera", "S. Reyes", "K. Bishnoi", "J. Volkov", "T. Nguyen", "R. Andersson"];
const stages: ProductionStage[] = ["planning", "pre-production", "production", "post-production", "completed"];
const statuses: ShowStatus[] = ["approved", "pending", "rejected", "review", "production"];

export const shows: Show[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `SH-${1000 + i}`,
  title: titles[i],
  genre: genres[i % genres.length],
  language: ["English", "Korean", "Spanish", "Japanese", "Hindi"][i % 5],
  episodes: 6 + (i % 8),
  budget: 4_000_000 + i * 850_000,
  creator: creators[i % creators.length],
  submittedAt: new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
  status: statuses[i % statuses.length],
  stage: stages[i % stages.length],
  poster: posters[i % posters.length],
  progress: 15 + ((i * 13) % 80),
  priority: (["low", "medium", "high", "critical"] as const)[i % 4],
  team: 8 + (i % 22),
  deadline: new Date(Date.now() + (30 + i * 6) * 86_400_000).toISOString(),
  description: "A gripping narrative that redefines the genre with striking visuals and deeply human characters.",
}));

export const stats = {
  totalShows: 248,
  approved: 132,
  rejected: 41,
  review: 37,
  production: 28,
  users: 1_842,
  revenue: 24_680_000,
  notifications: 12,
};

export const revenueSeries = [
  { month: "Jan", revenue: 12.4, target: 14 },
  { month: "Feb", revenue: 15.1, target: 15 },
  { month: "Mar", revenue: 18.6, target: 16 },
  { month: "Apr", revenue: 17.2, target: 17 },
  { month: "May", revenue: 21.9, target: 19 },
  { month: "Jun", revenue: 24.7, target: 22 },
  { month: "Jul", revenue: 28.2, target: 25 },
  { month: "Aug", revenue: 31.6, target: 28 },
];

export const genreDistribution = [
  { name: "Drama", value: 32 },
  { name: "Thriller", value: 24 },
  { name: "Sci-Fi", value: 18 },
  { name: "Crime", value: 14 },
  { name: "Fantasy", value: 8 },
  { name: "Other", value: 4 },
];

export const submissionsTrend = [
  { week: "W1", submissions: 22, approvals: 12 },
  { week: "W2", submissions: 28, approvals: 15 },
  { week: "W3", submissions: 34, approvals: 21 },
  { week: "W4", submissions: 31, approvals: 20 },
  { week: "W5", submissions: 42, approvals: 27 },
  { week: "W6", submissions: 48, approvals: 33 },
  { week: "W7", submissions: 44, approvals: 30 },
  { week: "W8", submissions: 52, approvals: 39 },
];

export const activities = [
  { id: 1, user: "Ava Chen", role: "Content Manager", action: "approved", target: "Nightfall Protocol", time: "2 min ago" },
  { id: 2, user: "Marco Herrera", role: "Producer", action: "updated budget for", target: "The Crimson Empire", time: "18 min ago" },
  { id: 3, user: "Sana Kapoor", role: "Creator", action: "submitted", target: "Cascade", time: "1 hour ago" },
  { id: 4, user: "Elias Ward", role: "Director", action: "added notes to", target: "Silent Verdict", time: "3 hours ago" },
  { id: 5, user: "Ren Ito", role: "Administrator", action: "granted access to", target: "Midnight in Seoul", time: "5 hours ago" },
  { id: 6, user: "Priya Shah", role: "Content Manager", action: "requested changes on", target: "Echoes of Tomorrow", time: "Yesterday" },
];

export const notifications = [
  { id: 1, type: "approval", title: "Show approved", body: "Nightfall Protocol was approved by A. Chen.", time: "2m", unread: true },
  { id: 2, type: "budget", title: "Budget alert", body: "Crimson Empire is at 92% of allocated budget.", time: "34m", unread: true },
  { id: 3, type: "deadline", title: "Deadline approaching", body: "Ocean of Stars post-production ends in 4 days.", time: "2h", unread: true },
  { id: 4, type: "system", title: "System update", body: "Analytics engine v3.4 deployed successfully.", time: "1d", unread: false },
  { id: 5, type: "approval", title: "Rejection", body: "Silent Verdict pitch was rejected.", time: "2d", unread: false },
];

export const auditLogs = Array.from({ length: 14 }).map((_, i) => ({
  id: `LOG-${9000 + i}`,
  date: new Date(Date.now() - i * 3_600_000).toISOString(),
  user: ["Ava Chen", "Marco Herrera", "Sana Kapoor", "Ren Ito", "Elias Ward"][i % 5],
  role: ["Content Manager", "Producer", "Creator", "Administrator", "Director"][i % 5],
  action: ["Approved show", "Updated budget", "Submitted show", "Granted role", "Added notes", "Rejected pitch", "Deleted asset"][i % 7],
  status: (["success", "success", "warning", "success", "failed"] as const)[i % 5],
  ip: `10.${20 + (i % 40)}.${i % 250}.${(i * 7) % 250}`,
}));

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
