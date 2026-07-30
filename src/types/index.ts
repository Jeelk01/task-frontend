// ─── Enums ────────────────────────────────────────────────────
export type UserRole = 'USER' | 'ADMIN';
export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'expired';
export type Currency = 'INR' | 'USD' | 'EUR';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
export type WorkspaceMemberStatus = 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
export type ProjectMemberStatus = 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// ─── Base ─────────────────────────────────────────────────────
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User ─────────────────────────────────────────────────────
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdBy?: string | null;
  // local helper — not from backend
  avatar?: string;
}

// ─── Device ───────────────────────────────────────────────────
export interface Device extends BaseEntity {
  userId: string;
  deviceId: string;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  lastLoginAt: string;
  isRevoked: boolean;
  isBlocked: boolean;
  user?: User;
}

// ─── Workspace ────────────────────────────────────────────────
export interface Workspace extends BaseEntity {
  ownerId: string;
  owner?: User;
  name: string;
  tags: string[];
  description?: string;
  isActive: boolean;
  meta?: Record<string, unknown>;
  members: string[];
  memberUsers?: User[];
  myRole?: WorkspaceRole;
}

export interface WorkspaceMember extends BaseEntity {
  userId?: string | null;
  user?: User | null;
  email: string;
  invitedById: string;
  invitedBy?: User | null;
  status: WorkspaceMemberStatus;
  role: WorkspaceRole;
  workspaceId: string;
  workspace?: Workspace | null;
  acceptedAt?: string | null;
}

// ─── Membership / Plan ────────────────────────────────────────
export interface Membership extends BaseEntity {
  type: string;
  price: number;
  currency: Currency;
  description?: string;
  tags?: string[];
  isTrialAvailable: boolean;
  trialDurationDays?: number;
  trialPrice?: number;
  maxWorkspaces: number;
  maxDevices: number;
  maxProjectsPerWorkspace: number;
  maxUsersPerProject: number;
  isCancellable: boolean;
  durationDays: number;
  isActive: boolean;
  createdBy: string;
  creator?: User;
}

// ─── Subscription ─────────────────────────────────────────────
export interface AccountSubscription extends BaseEntity {
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate?: string | null;
  endDate?: string | null;
  priceAtPurchase: number;
  currency: Currency;
  maxWorkspaces: number;
  maxDevices: number;
  maxProjectsPerWorkspace: number;
  maxUsersPerProject: number;
  plan?: Membership;
}

// ─── Notification Preference ──────────────────────────────────
export interface NotificationPreference extends BaseEntity {
  userId: string;
  workspaceInvites: boolean;
  projectInvites: boolean;
  securityAlerts: boolean;
  taskAssign: boolean;
  meetingInvites: boolean;
  announcement: boolean;
  promotional: boolean;
}

// ─── Paginated Response ───────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
  code: number;
  message: string;
  success: boolean;
}

// ─── Base GQL Response ────────────────────────────────────────
export interface BaseResponse {
  code: number;
  message: string;
  success: boolean;
}

export interface AuthResponse extends BaseResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

export interface UserResponse extends BaseResponse {
  user?: User;
}

// ─── Auth State ───────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

// ─── Project ──────────────────────────────────────────────────
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  tags: string[];
  workspaceId: string;
  creatorId: string;
  members: string[];
  memberUsers?: User[];
  workspace?: Workspace;
  creator?: User;
  meta?: Record<string, any>;
  myRole?: ProjectRole;
}

export interface ProjectMember extends BaseEntity {
  userId?: string | null;
  user?: User | null;
  email: string;
  invitedById: string;
  invitedBy?: User | null;
  status: ProjectMemberStatus;
  role: ProjectRole;
  projectId: string;
  project?: Project | null;
}

// ─── Task ─────────────────────────────────────────────────────
export interface Task extends BaseEntity {
  workspaceId: string;
  projectId: string;
  assignedTo: string[];
  tags: string[];
  attachments: string[];
  status: TaskStatus;
  priority: TaskPriority;
  note?: string;
  assignedBy: string;
  workspace?: Workspace;
  project?: Project;
  assignees?: User[];
  assigner?: User;
  dueDate?: string;
  completedAt?: string;
  blockerId?: string;
  blockerTask?: Task;
}

// ─── Attachment ───────────────────────────────────────────────
export interface Attachment extends BaseEntity {
  workspaceId: string;
  projectId?: string | null;
  taskId?: string | null;
  filepath: string;
  fileName: string;
  type: string;
  size?: number;
  comment?: string;
  uploadedBy: string;
  workspace?: Workspace;
  project?: Project;
  task?: Task;
  uploader?: User;
}

// ─── Device limit exceeded error payload ─────────────────────
export interface DeviceLimitError {
  isDeviceLimitReached: boolean;
  activeDevices: Device[];
}

// ─── Response Wrappers ─────────────────────────────────────────
export interface MultiSubscriptionResponse extends BaseResponse {
  subscriptions: AccountSubscription[];
}

export interface MultiDevicesResponse extends BaseResponse {
  devices: Device[];
}

export interface NotificationPreferenceResponse extends BaseResponse {
  items: NotificationPreference[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

// ─── Chat ─────────────────────────────────────────────────────
export interface ChatMessage extends BaseEntity {
  workspaceId: string;
  senderId: User;
  content: string;
  isSystemMessage: boolean;
}

export interface PaginatedChatMessages {
  messages: ChatMessage[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

// ─── Meetings ────────────────────────────────────────────────
export type MeetingStatus = 'SCHEDULED' | 'ONGOING' | 'ENDED' | 'CANCELLED';

export interface Meeting extends BaseEntity {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  status: MeetingStatus;
  workspaceId: string;
  hostId: string;
}
