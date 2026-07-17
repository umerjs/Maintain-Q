import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Urgency = "Low" | "Medium" | "High" | "Critical";
export type RequestStatus = "Open" | "In Progress" | "Solved";
export type UserRole = "Student" | "Technician" | "Admin";

export const ADMIN_EMAIL = "hammad@code.dev";
export const ADMIN_PASSWORD = "Admin_09123";

export const HELP_CATEGORIES = [
  "Coding",
  "Math",
  "Design",
  "Writing",
  "Career",
  "Other",
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export interface ActivityEntry {
  id: string;
  at: string;
  who: string;
  action: string;
}

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  urgency: Urgency;
  status: RequestStatus;
  helperIds: string[];
  location: string;
  skillsNeeded: string[];
  reporterId?: string;
  reporterName?: string;
  reporterContact?: string;
  photoUrl?: string;
  reportedAt: string;
  solvedAt?: string;
  resolutionNotes?: string;
  activity: ActivityEntry[];
}

export interface Helper {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  location: string;
  trustScore: number;
  badges: string[];
  contributionsCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  skills: string[];
  interests: string[];
  location: string;
  trustScore: number;
  badges: string[];
  contributionsCount: number;
}

export interface Message {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  sentAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "new_match" | "status_change" | "new_message" | "badge_earned";
  text: string;
  read: boolean;
  createdAt: string;
  requestId?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  orgName: string;
  role: UserRole;
}

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

const seedHelpers: Helper[] = [
  {
    id: "HELP-001",
    name: "Aisha Rahman",
    email: "aisha@helplytics.ai",
    phone: "+1 555 0101",
    skills: ["Coding", "React", "TypeScript"],
    location: "Campus Library",
    trustScore: 75,
    badges: ["First Helper", "5 Solved"],
    contributionsCount: 8,
  },
  {
    id: "HELP-002",
    name: "Marcus Chen",
    email: "marcus@helplytics.ai",
    phone: "+1 555 0102",
    skills: ["Math", "Calculus", "Statistics"],
    location: "Science Building",
    trustScore: 70,
    badges: ["First Helper"],
    contributionsCount: 5,
  },
  {
    id: "HELP-003",
    name: "Priya Patel",
    email: "priya@helplytics.ai",
    skills: ["Design", "Figma", "UI/UX"],
    location: "Art Studio",
    trustScore: 80,
    badges: ["First Helper", "5 Solved", "Community Star"],
    contributionsCount: 12,
  },
  {
    id: "HELP-004",
    name: "Jordan Lee",
    email: "jordan@helplytics.ai",
    skills: ["Career", "Resume", "Interview Prep"],
    location: "Career Center",
    trustScore: 65,
    badges: ["First Helper"],
    contributionsCount: 3,
  },
];

const seedRequests: HelpRequest[] = [
  {
    id: "HR-001",
    title: "Need help debugging React useEffect loop",
    description: "My component re-renders infinitely when I fetch data. Urgent — assignment due tomorrow.",
    category: "Coding",
    tags: ["react", "hooks", "debugging"],
    urgency: "High",
    status: "In Progress",
    helperIds: ["HELP-001"],
    location: "Engineering Hall",
    skillsNeeded: ["React", "JavaScript"],
    reporterName: "Sam Torres",
    reporterId: "user-sam",
    reportedAt: daysAgo(2),
    activity: [
      { id: "a1", at: daysAgo(2), who: "Sam Torres", action: "Posted help request" },
      { id: "a2", at: daysAgo(2), who: "Aisha Rahman", action: "Offered to help" },
      { id: "a3", at: daysAgo(1), who: "Aisha Rahman", action: "Started helping — reviewing effect deps" },
    ],
  },
  {
    id: "HR-002",
    title: "Stuck on multivariable calculus homework",
    description: "Need someone to walk through partial derivatives and the chain rule. No rush — whenever works.",
    category: "Math",
    tags: ["calculus", "derivatives", "homework"],
    urgency: "Low",
    status: "Open",
    helperIds: [],
    location: "Math Lounge",
    skillsNeeded: ["Calculus", "Math"],
    reporterName: "Alex Kim",
    reporterId: "user-alex",
    reportedAt: daysAgo(1),
    activity: [{ id: "a1", at: daysAgo(1), who: "Alex Kim", action: "Posted help request" }],
  },
  {
    id: "HR-003",
    title: "Portfolio critique — Figma redesign",
    description: "Looking for feedback on spacing, hierarchy, and color for my UX portfolio case study.",
    category: "Design",
    tags: ["figma", "portfolio", "critique"],
    urgency: "Medium",
    status: "Solved",
    helperIds: ["HELP-003"],
    location: "Design Lab",
    skillsNeeded: ["Figma", "UI/UX"],
    reporterName: "Nina Brooks",
    reporterId: "user-nina",
    reportedAt: daysAgo(6),
    solvedAt: daysAgo(5),
    resolutionNotes: "Went through layout and contrast; shipped a cleaner type scale.",
    activity: [
      { id: "a1", at: daysAgo(6), who: "Nina Brooks", action: "Posted help request" },
      { id: "a2", at: daysAgo(6), who: "Priya Patel", action: "Offered to help" },
      { id: "a3", at: daysAgo(5), who: "Priya Patel", action: "Marked as solved" },
    ],
  },
  {
    id: "HR-004",
    title: "Resume review before career fair",
    description: "ASAP — career fair is Friday. Need help tightening bullets and quantifying impact.",
    category: "Career",
    tags: ["resume", "career", "interview"],
    urgency: "Critical",
    status: "Open",
    helperIds: ["HELP-004"],
    location: "Career Center",
    skillsNeeded: ["Resume", "Career"],
    reporterName: "Dev Patel",
    reporterId: "user-dev",
    reportedAt: daysAgo(0),
    activity: [
      { id: "a1", at: daysAgo(0), who: "Dev Patel", action: "Posted help request" },
      { id: "a2", at: daysAgo(0), who: "Jordan Lee", action: "Offered to help" },
    ],
  },
  {
    id: "HR-005",
    title: "Essay outline for literature seminar",
    description: "Need help structuring a compare/contrast essay on two novels. Deadline next week.",
    category: "Writing",
    tags: ["essay", "outline", "literature"],
    urgency: "Medium",
    status: "Open",
    helperIds: [],
    location: "Humanities Building",
    skillsNeeded: ["Writing", "Essay"],
    reporterName: "Casey Morgan",
    reporterId: "user-casey",
    reportedAt: daysAgo(3),
    activity: [{ id: "a1", at: daysAgo(3), who: "Casey Morgan", action: "Posted help request" }],
  },
  {
    id: "HR-006",
    title: "Python data analysis project",
    description: "Struggling with pandas groupby and matplotlib charts for my stats project.",
    category: "Coding",
    tags: ["python", "pandas", "data"],
    urgency: "High",
    status: "Open",
    helperIds: [],
    location: "Computer Lab",
    skillsNeeded: ["Python", "Coding"],
    reporterName: "Riley Quinn",
    reporterId: "user-riley",
    reportedAt: daysAgo(0),
    activity: [{ id: "a1", at: daysAgo(0), who: "Riley Quinn", action: "Posted help request" }],
  },
  {
    id: "HR-007",
    title: "Linear algebra study buddy",
    description: "Looking for someone to review eigenvalues and matrix diagonalization before the midterm.",
    category: "Math",
    tags: ["linear-algebra", "matrices", "study"],
    urgency: "Medium",
    status: "In Progress",
    helperIds: ["HELP-002"],
    location: "Science Building",
    skillsNeeded: ["Math", "Linear Algebra"],
    reporterName: "Jamie Ortiz",
    reporterId: "user-jamie",
    reportedAt: daysAgo(4),
    activity: [
      { id: "a1", at: daysAgo(4), who: "Jamie Ortiz", action: "Posted help request" },
      { id: "a2", at: daysAgo(3), who: "Marcus Chen", action: "Offered to help" },
    ],
  },
];

const seedMessages: Message[] = [
  {
    id: "MSG-001",
    requestId: "HR-001",
    fromUserId: "HELP-001",
    toUserId: "user-sam",
    body: "Happy to help! Can you share the useEffect code snippet?",
    sentAt: daysAgo(1),
  },
  {
    id: "MSG-002",
    requestId: "HR-001",
    fromUserId: "user-sam",
    toUserId: "HELP-001",
    body: "Sure — I'll paste it in a sec. Thanks!",
    sentAt: daysAgo(1),
  },
  {
    id: "MSG-003",
    requestId: "HR-004",
    fromUserId: "HELP-004",
    toUserId: "user-dev",
    body: "Send over your resume PDF and I'll annotate it before Friday.",
    sentAt: daysAgo(0),
  },
];

const seedNotifications: Notification[] = [
  {
    id: "N-001",
    userId: "HELP-001",
    type: "new_match",
    text: "New Coding request matches your skills: Python data analysis project",
    read: false,
    createdAt: daysAgo(0),
    requestId: "HR-006",
  },
  {
    id: "N-002",
    userId: "user-sam",
    type: "status_change",
    text: "Your request ‘Need help debugging React useEffect loop’ is now In Progress",
    read: false,
    createdAt: daysAgo(1),
    requestId: "HR-001",
  },
  {
    id: "N-003",
    userId: "user-sam",
    type: "new_message",
    text: "Aisha Rahman sent you a message about HR-001",
    read: true,
    createdAt: daysAgo(1),
    requestId: "HR-001",
  },
  {
    id: "N-004",
    userId: "HELP-003",
    type: "badge_earned",
    text: "You earned the Community Star badge!",
    read: false,
    createdAt: daysAgo(5),
  },
];

const defaultProfile: UserProfile = {
  id: "local-user",
  name: "",
  email: "",
  role: "Student",
  skills: [],
  interests: [],
  location: "",
  trustScore: 50,
  badges: [],
  contributionsCount: 0,
};

interface Store {
  auth: AuthUser | null;
  profile: UserProfile;
  requests: HelpRequest[];
  helpers: Helper[];
  messages: Message[];
  notifications: Notification[];
  categories: string[];
  orgName: string;
  login: (u: AuthUser) => void;
  logout: () => void;
  setRole: (r: UserRole) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  addRequest: (
    r: Omit<HelpRequest, "id" | "reportedAt" | "activity" | "status" | "helperIds"> & {
      status?: RequestStatus;
      helperIds?: string[];
    },
  ) => HelpRequest;
  updateRequest: (id: string, patch: Partial<HelpRequest>, actor?: string, actionLabel?: string) => void;
  offerHelp: (requestId: string, helperId: string, helperName: string) => void;
  markSolved: (requestId: string, actor: string, notes?: string) => void;
  addHelper: (t: Omit<Helper, "id" | "trustScore" | "badges" | "contributionsCount">) => Helper;
  addMessage: (m: Omit<Message, "id" | "sentAt">) => Message;
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read"> & { read?: boolean }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addCategory: (c: string) => void;
  removeCategory: (c: string) => void;
  setOrgName: (n: string) => void;
}

let requestCounter = seedRequests.length;
let helperCounter = seedHelpers.length;
let messageCounter = seedMessages.length;
let notificationCounter = seedNotifications.length;

function computeBadges(contributions: number, existing: string[]): string[] {
  const badges = new Set(existing);
  if (contributions >= 1) badges.add("First Helper");
  if (contributions >= 5) badges.add("5 Solved");
  if (contributions >= 10) badges.add("Community Star");
  return Array.from(badges);
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      auth: null,
      profile: defaultProfile,
      requests: seedRequests,
      helpers: seedHelpers,
      messages: seedMessages,
      notifications: seedNotifications,
      categories: [...HELP_CATEGORIES],
      orgName: "Helplytics AI Community",
      login: (u) => {
        const profile = get().profile;
        set({
          auth: u,
          profile: {
            ...profile,
            id: u.id,
            name: u.name || profile.name,
            email: u.email,
            role: u.role,
          },
        });
      },
      logout: () => set({ auth: null }),
      setRole: (r) => {
        const a = get().auth;
        if (a) set({ auth: { ...a, role: r }, profile: { ...get().profile, role: r } });
      },
      updateProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      addRequest: (r) => {
        requestCounter += 1;
        const id = `HR-${String(requestCounter).padStart(3, "0")}`;
        const reportedAt = new Date().toISOString();
        const request: HelpRequest = {
          ...r,
          id,
          reportedAt,
          status: r.status ?? "Open",
          helperIds: r.helperIds ?? [],
          tags: r.tags ?? [],
          skillsNeeded: r.skillsNeeded ?? [],
          activity: [
            {
              id: "a1",
              at: reportedAt,
              who: r.reporterName || "Anonymous",
              action: "Posted help request",
            },
          ],
        };
        set({ requests: [request, ...get().requests] });

        // Notify helpers whose skills overlap
        get().helpers.forEach((h) => {
          const overlap = h.skills.some(
            (s) =>
              request.category.toLowerCase().includes(s.toLowerCase()) ||
              request.skillsNeeded.some((n) => n.toLowerCase() === s.toLowerCase()) ||
              request.tags.some((t) => t.toLowerCase() === s.toLowerCase()),
          );
          if (overlap) {
            get().addNotification({
              userId: h.id,
              type: "new_match",
              text: `New ${request.category} request matches your skills: ${request.title}`,
              requestId: id,
            });
          }
        });

        return request;
      },
      updateRequest: (id, patch, actor = "Admin", actionLabel) => {
        set({
          requests: get().requests.map((req) => {
            if (req.id !== id) return req;
            const activity = actionLabel
              ? [
                  ...req.activity,
                  {
                    id: `a${req.activity.length + 1}`,
                    at: new Date().toISOString(),
                    who: actor,
                    action: actionLabel,
                  },
                ]
              : req.activity;
            return { ...req, ...patch, activity };
          }),
        });
      },
      offerHelp: (requestId, helperId, helperName) => {
        const req = get().requests.find((r) => r.id === requestId);
        if (!req || req.helperIds.includes(helperId)) return;
        get().updateRequest(
          requestId,
          {
            helperIds: [...req.helperIds, helperId],
            status: req.status === "Open" ? "In Progress" : req.status,
          },
          helperName,
          "Offered to help",
        );
        if (req.reporterId) {
          get().addNotification({
            userId: req.reporterId,
            type: "status_change",
            text: `${helperName} offered to help with “${req.title}”`,
            requestId,
          });
        }
      },
      markSolved: (requestId, actor, notes) => {
        const req = get().requests.find((r) => r.id === requestId);
        if (!req) return;
        get().updateRequest(
          requestId,
          {
            status: "Solved",
            solvedAt: new Date().toISOString(),
            resolutionNotes: notes,
          },
          actor,
          `Marked as solved${notes ? `: ${notes}` : ""}`,
        );

        // Bump trust score for helpers on this request
        const helpers = get().helpers.map((h) => {
          if (!req.helperIds.includes(h.id)) return h;
          const contributionsCount = h.contributionsCount + 1;
          const trustScore = h.trustScore + 5;
          const badges = computeBadges(contributionsCount, h.badges);
          const newBadges = badges.filter((b) => !h.badges.includes(b));
          newBadges.forEach((b) =>
            get().addNotification({
              userId: h.id,
              type: "badge_earned",
              text: `You earned the ${b} badge!`,
              requestId,
            }),
          );
          return { ...h, contributionsCount, trustScore, badges };
        });
        set({ helpers });

        const profile = get().profile;
        if (req.helperIds.includes(profile.id) || profile.role === "Technician") {
          const contributionsCount = profile.contributionsCount + 1;
          const trustScore = profile.trustScore + 5;
          const badges = computeBadges(contributionsCount, profile.badges);
          set({ profile: { ...profile, contributionsCount, trustScore, badges } });
        }

        if (req.reporterId) {
          get().addNotification({
            userId: req.reporterId,
            type: "status_change",
            text: `Your request “${req.title}” was marked as solved`,
            requestId,
          });
        }
      },
      addHelper: (t) => {
        helperCounter += 1;
        const id = `HELP-${String(helperCounter).padStart(3, "0")}`;
        const helper: Helper = {
          ...t,
          id,
          trustScore: 50,
          badges: [],
          contributionsCount: 0,
        };
        set({ helpers: [helper, ...get().helpers] });
        return helper;
      },
      addMessage: (m) => {
        messageCounter += 1;
        const id = `MSG-${String(messageCounter).padStart(3, "0")}`;
        const msg: Message = { ...m, id, sentAt: new Date().toISOString() };
        set({ messages: [...get().messages, msg] });
        get().addNotification({
          userId: m.toUserId,
          type: "new_message",
          text: `New message on request ${m.requestId}`,
          requestId: m.requestId,
        });
        return msg;
      },
      addNotification: (n) => {
        notificationCounter += 1;
        const id = `N-${String(notificationCounter).padStart(3, "0")}`;
        const note: Notification = {
          ...n,
          id,
          read: n.read ?? false,
          createdAt: new Date().toISOString(),
        };
        set({ notifications: [note, ...get().notifications] });
      },
      markNotificationRead: (id) =>
        set({
          notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }),
      markAllNotificationsRead: (userId) =>
        set({
          notifications: get().notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        }),
      addCategory: (c) => {
        if (!get().categories.includes(c)) set({ categories: [...get().categories, c] });
      },
      removeCategory: (c) => set({ categories: get().categories.filter((x) => x !== c) }),
      setOrgName: (n) => set({ orgName: n }),
    }),
    { name: "helplytics-store" },
  ),
);

export const urgencyColor = (p: Urgency) => {
  switch (p) {
    case "Low":
      return "bg-muted text-muted-foreground border-border";
    case "Medium":
      return "bg-info/10 text-info border-info/30";
    case "High":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "Critical":
      return "bg-destructive/10 text-destructive border-destructive/40";
  }
};

export const statusColor = (s: RequestStatus) => {
  switch (s) {
    case "Open":
      return "border border-destructive text-destructive bg-transparent";
    case "In Progress":
      return "bg-warning text-warning-foreground";
    case "Solved":
      return "bg-success text-success-foreground";
  }
};

export function helperName(helpers: Helper[], id?: string) {
  if (!id) return "Unassigned";
  return helpers.find((h) => h.id === id)?.name ?? "Unassigned";
}

export function helpersForRequest(helpers: Helper[], ids: string[]) {
  return helpers.filter((h) => ids.includes(h.id));
}

/** @deprecated Use urgencyColor */
export const priorityColor = urgencyColor;
