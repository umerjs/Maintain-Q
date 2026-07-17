import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type IssueStatus = "Open" | "In Progress" | "Resolved" | "Overdue";
export type AssetStatus = "Active" | "Under Maintenance" | "Retired";
export type UserRole = "Admin" | "Technician" | "Reporter";

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  description?: string;
  installationDate?: string;
  manufacturer?: string;
  modelNumber?: string;
  status: AssetStatus;
  imageUrl?: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  who: string;
  action: string;
}

export interface Issue {
  id: string;
  assetId: string;
  title: string;
  description: string;
  priority: Priority;
  status: IssueStatus;
  assignedTo?: string; // technician id
  reporterName?: string;
  reporterContact?: string;
  photoUrl?: string;
  reportedAt: string;
  dueDate?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  internalNotes?: string;
  activity: ActivityEntry[];
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
}

export interface AuthUser {
  name: string;
  email: string;
  orgName: string;
  role: UserRole;
}

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

const seedAssets: Asset[] = [
  { id: "ASSET-001", name: "Main Elevator", category: "Elevator", location: "Building A, Lobby", status: "Active", manufacturer: "Otis", modelNumber: "GEN2-01", installationDate: "2019-03-15", description: "Primary passenger elevator serving floors 1-12." },
  { id: "ASSET-002", name: "HVAC Unit 3", category: "HVAC", location: "Roof, Block B", status: "Under Maintenance", manufacturer: "Carrier", modelNumber: "50TC-04", installationDate: "2020-06-10", description: "Rooftop chiller for Block B floors 3-5." },
  { id: "ASSET-003", name: "Lab Freezer #2", category: "Laboratory", location: "Lab 204", status: "Active", manufacturer: "Thermo Fisher", modelNumber: "TSX-400", installationDate: "2021-01-20", description: "-80°C ultra-low temperature freezer." },
  { id: "ASSET-004", name: "Fire Panel A", category: "Fire Safety", location: "Ground Floor", status: "Active", manufacturer: "Honeywell", modelNumber: "NFS2-3030", installationDate: "2018-11-05", description: "Main fire alarm control panel." },
  { id: "ASSET-005", name: "Generator 1", category: "Power", location: "Basement", status: "Active", manufacturer: "Cummins", modelNumber: "C150D6", installationDate: "2017-09-01", description: "150kW backup diesel generator." },
];

const seedTechnicians: Technician[] = [
  { id: "TECH-001", name: "Ravi Mehta", email: "ravi@maintainiq.com", phone: "+91 98200 11111", specialization: "Mechanical + HVAC" },
  { id: "TECH-002", name: "Sana Khan", email: "sana@maintainiq.com", phone: "+91 98200 22222", specialization: "Electrical + Fire Safety" },
];

const seedIssues: Issue[] = [
  {
    id: "IQ-001", assetId: "ASSET-002", title: "Cooling not working, temp rising",
    description: "Server room temperature rose above 28°C. Airflow present but no cooling.",
    priority: "Critical", status: "In Progress", assignedTo: "TECH-001",
    reporterName: "Priya S.", reportedAt: daysAgo(2), dueDate: daysAgo(-1),
    activity: [
      { id: "a1", at: daysAgo(2), who: "Priya S.", action: "Reported issue" },
      { id: "a2", at: daysAgo(2), who: "Admin", action: "Assigned to Ravi Mehta" },
      { id: "a3", at: daysAgo(1), who: "Ravi Mehta", action: "Started work — inspecting refrigerant lines" },
    ],
  },
  {
    id: "IQ-002", assetId: "ASSET-001", title: "Door closing too slowly",
    description: "Elevator door takes ~8 seconds to close on the ground floor.",
    priority: "Medium", status: "Open", reporterName: "Anonymous",
    reportedAt: daysAgo(1),
    activity: [{ id: "a1", at: daysAgo(1), who: "Anonymous", action: "Reported issue" }],
  },
  {
    id: "IQ-003", assetId: "ASSET-003", title: "Temperature alarm triggered",
    description: "Freezer beeped at 3AM. Currently at -76°C, slowly recovering.",
    priority: "High", status: "Resolved", assignedTo: "TECH-002",
    reporterName: "Dr. Iyer", reportedAt: daysAgo(6), resolvedAt: daysAgo(5),
    resolutionNotes: "Replaced door gasket, verified seal, ran 6-hour temp log.",
    activity: [
      { id: "a1", at: daysAgo(6), who: "Dr. Iyer", action: "Reported issue" },
      { id: "a2", at: daysAgo(6), who: "Admin", action: "Assigned to Sana Khan" },
      { id: "a3", at: daysAgo(5), who: "Sana Khan", action: "Marked Resolved" },
    ],
  },
  {
    id: "IQ-004", assetId: "ASSET-005", title: "Oil leak noticed near base",
    description: "Small oil pool (~15cm) under generator housing. Odor present.",
    priority: "High", status: "Open", assignedTo: "TECH-001",
    reporterName: "Security", reportedAt: daysAgo(0),
    activity: [
      { id: "a1", at: daysAgo(0), who: "Security", action: "Reported issue" },
      { id: "a2", at: daysAgo(0), who: "Admin", action: "Assigned to Ravi Mehta" },
    ],
  },
];

interface Store {
  auth: AuthUser | null;
  assets: Asset[];
  issues: Issue[];
  technicians: Technician[];
  categories: string[];
  orgName: string;
  login: (u: AuthUser) => void;
  logout: () => void;
  setRole: (r: UserRole) => void;
  addAsset: (a: Omit<Asset, "id" | "status"> & { status?: AssetStatus }) => Asset;
  addIssue: (i: Omit<Issue, "id" | "reportedAt" | "activity" | "status"> & { status?: IssueStatus }) => Issue;
  updateIssue: (id: string, patch: Partial<Issue>, actor?: string, actionLabel?: string) => void;
  addTechnician: (t: Omit<Technician, "id">) => Technician;
  addCategory: (c: string) => void;
  removeCategory: (c: string) => void;
  setOrgName: (n: string) => void;
}

let issueCounter = seedIssues.length;
let assetCounter = seedAssets.length;
let techCounter = seedTechnicians.length;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      auth: null,
      assets: seedAssets,
      issues: seedIssues,
      technicians: seedTechnicians,
      categories: ["HVAC", "Electrical", "Plumbing", "Elevator", "Fire Safety", "Laboratory", "Power", "IT", "Furniture", "Vehicle"],
      orgName: "MaintainIQ Demo Org",
      login: (u) => set({ auth: u }),
      logout: () => set({ auth: null }),
      setRole: (r) => {
        const a = get().auth;
        if (a) set({ auth: { ...a, role: r } });
      },
      addAsset: (a) => {
        assetCounter += 1;
        const id = `ASSET-${String(assetCounter).padStart(3, "0")}`;
        const asset: Asset = { ...a, id, status: a.status ?? "Active" };
        set({ assets: [asset, ...get().assets] });
        return asset;
      },
      addIssue: (i) => {
        issueCounter += 1;
        const id = `IQ-${String(issueCounter).padStart(3, "0")}`;
        const reportedAt = new Date().toISOString();
        const issue: Issue = {
          ...i, id, reportedAt, status: i.status ?? "Open",
          activity: [{ id: "a1", at: reportedAt, who: i.reporterName || "Anonymous", action: "Reported issue" }],
        };
        set({ issues: [issue, ...get().issues] });
        return issue;
      },
      updateIssue: (id, patch, actor = "Admin", actionLabel) => {
        set({
          issues: get().issues.map((iss) => {
            if (iss.id !== id) return iss;
            const activity = actionLabel
              ? [...iss.activity, { id: `a${iss.activity.length + 1}`, at: new Date().toISOString(), who: actor, action: actionLabel }]
              : iss.activity;
            return { ...iss, ...patch, activity };
          }),
        });
      },
      addTechnician: (t) => {
        techCounter += 1;
        const id = `TECH-${String(techCounter).padStart(3, "0")}`;
        const tech: Technician = { ...t, id };
        set({ technicians: [tech, ...get().technicians] });
        return tech;
      },
      addCategory: (c) => {
        if (!get().categories.includes(c)) set({ categories: [...get().categories, c] });
      },
      removeCategory: (c) => set({ categories: get().categories.filter((x) => x !== c) }),
      setOrgName: (n) => set({ orgName: n }),
    }),
    { name: "maintainiq-store" }
  )
);

export const priorityColor = (p: Priority) => {
  switch (p) {
    case "Low": return "bg-muted text-muted-foreground border-border";
    case "Medium": return "bg-info/10 text-info border-info/30";
    case "High": return "bg-warning/15 text-warning-foreground border-warning/40";
    case "Critical": return "bg-destructive/10 text-destructive border-destructive/40";
  }
};

export const statusColor = (s: IssueStatus) => {
  switch (s) {
    case "Open": return "border border-destructive text-destructive bg-transparent";
    case "In Progress": return "bg-warning text-warning-foreground";
    case "Resolved": return "bg-success text-success-foreground";
    case "Overdue": return "bg-destructive text-destructive-foreground";
  }
};

export const assetStatusColor = (s: AssetStatus) => {
  switch (s) {
    case "Active": return "bg-success/15 text-success border-success/30";
    case "Under Maintenance": return "bg-warning/15 text-warning-foreground border-warning/40";
    case "Retired": return "bg-muted text-muted-foreground border-border";
  }
};

export function issuesForAsset(issues: Issue[], assetId: string) {
  return issues.filter((i) => i.assetId === assetId);
}

export function techName(techs: Technician[], id?: string) {
  if (!id) return "Unassigned";
  return techs.find((t) => t.id === id)?.name ?? "Unassigned";
}
