import type { Role } from "./roles";

export interface DirectoryUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  netflixId: string;
  specialty: string;
  createdDate: string;
  lastLogin: string;
  isActive: boolean;
  avatar: string;
}

const specialties = [
  "Prestige drama", "Global thrillers", "Animation", "Unscripted", "Korean originals",
  "Budget governance", "VFX supervision", "Docu-series", "Comedy specials", "YA fantasy",
];

const names = [
  ["ren.ito", "Ren Ito", "ADMIN"], ["ava.chen", "Ava Chen", "CONTENT_MANAGER"],
  ["priya.shah", "Priya Shah", "CONTENT_MANAGER"], ["marco.herrera", "Marco Herrera", "PRODUCER"],
  ["nina.osei", "Nina Osei", "PRODUCER"], ["elias.ward", "Elias Ward", "DIRECTOR"],
  ["kenji.mori", "Kenji Mori", "DIRECTOR"], ["sana.kapoor", "Sana Kapoor", "CREATOR"],
  ["luca.rossi", "Luca Rossi", "CREATOR"], ["ada.nakamura", "Ada Nakamura", "CREATOR"],
  ["mia.torres", "Mia Torres", "VIEWER"], ["omar.haddad", "Omar Haddad", "VIEWER"],
] as const;

export const directory: DirectoryUser[] = names.map(([username, display, role], i) => ({
  id: 1001 + i,
  username: display,
  email: `${username}@netflix-studio.com`,
  role: role as Role,
  netflixId: `NFX-${48210 + i * 37}`,
  specialty: specialties[i % specialties.length],
  createdDate: new Date(Date.now() - (400 - i * 21) * 86_400_000).toISOString(),
  lastLogin: new Date(Date.now() - i * 5_400_000).toISOString(),
  isActive: i !== 9 && i !== 11,
  avatar: `https://i.pravatar.cc/80?img=${(i * 7) % 70}`,
}));

export const roleCounts = directory.reduce<Record<string, number>>((acc, u) => {
  acc[u.role] = (acc[u.role] ?? 0) + 1;
  return acc;
}, {});
