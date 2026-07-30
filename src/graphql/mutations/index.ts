import { gql } from "@apollo/client";

// ─── Auth ─────────────────────────────────────────────────────
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      code
      success
      message
      accessToken
      refreshToken
      user {
        _id
        name
        email
        role
        isActive
        isVerified
        verifiedAt
        createdAt
        updatedAt
      }
      deviceLimitReached
      activeDevices {
        _id
        deviceId
        deviceName
        userAgent
        lastLoginAt
      }
    }
  }
`;

export const SIGNUP = gql`
  mutation Signup($input: CreateUserInput!) {
    signup(input: $input) {
      code
      success
      message
      user {
        _id
        name
        email
        role
        isActive
        isVerified
        createdAt
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      code
      success
      message
      accessToken
      refreshToken
      user {
        _id
        name
        email
        role
        isActive
        isVerified
      }
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      code
      success
      message
    }
  }
`;

// Requires AuthGuard
export const SEND_VERIFICATION_MAIL = gql`
  mutation SendVerificationMail {
    sendVerificationMail {
      code
      success
      message
    }
  }
`;

// ─── Devices ──────────────────────────────────────────────────
// Backend: logoutDevice(input: LogoutDeviceInput!) — takes { deviceId }
export const LOGOUT_DEVICE = gql`
  mutation LogoutDevice($input: LogoutDeviceInput!) {
    logoutDevice(input: $input) {
      code
      success
      message
      device {
        _id
        deviceId
        isRevoked
      }
    }
  }
`;

// Backend: logoutAllDevices — no args, no AuthGuard (uses CurrentUser)
export const LOGOUT_ALL_DEVICES = gql`
  mutation LogoutAllDevices {
    logoutAllDevices {
      code
      success
      message
    }
  }
`;

// Backend: logoutAllDevicesExceptCurrent — no args, uses CurrentUser + CurrentDevice
export const LOGOUT_ALL_DEVICES_EXCEPT_CURRENT = gql`
  mutation LogoutAllDevicesExceptCurrent {
    logoutAllDevicesExceptCurrent {
      code
      success
      message
    }
  }
`;

// Backend: blockMyDevice(input: BlockDeviceInput!) — takes { deviceId }
export const BLOCK_MY_DEVICE = gql`
  mutation BlockMyDevice($input: BlockDeviceInput!) {
    blockMyDevice(input: $input) {
      code
      success
      message
      device {
        _id
        deviceId
        isBlocked
      }
    }
  }
`;

// ─── Workspace ────────────────────────────────────────────────
export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
        _id
        createdAt
        updatedAt
        ownerId
        name
        tags
        description
        isActive
        meta
        members
        owner {
            _id
            createdAt
            updatedAt
            name
            email
            isVerified
            verifiedAt
            role
            isActive
            createdBy
        }
    }
  }
`;

export const UPDATE_WORKSPACE = gql`
  mutation UpdateWorkspace($id: ID!, $input: CreateWorkspaceInput!) {
    updateWorkspace(id: $id, input: $input) {
      _id
      createdAt
      updatedAt
      ownerId
      name
      tags
      description
      isActive
      meta
      members
      owner {
        _id
        createdAt
        updatedAt
        name
        email
        isVerified
        verifiedAt
        role
        isActive
        createdBy
      }
    }
  }
`;

export const DELETE_WORKSPACE = gql`
  mutation DeleteWorkspace($id: ID!) {
    deleteWorkspace(id: $id) {
        createdAt
        updatedAt
        ownerId
        name
        tags
        description
        isActive    
        meta
        members
        owner {
            _id
            createdAt
            updatedAt
            name
            email
            isVerified
            verifiedAt
            role
            isActive
            createdBy
        }
        _id
    }
}

`

export const ADD_WORKSPACE_MEMBER = gql`
  mutation AddWorkspaceMember($workspaceId: ID!, $email: String!, $role: WorkspaceRole!) {
    addWorkspaceMember(workspaceId: $workspaceId, email: $email, role: $role) {
      _id
      userId
      email
      role
      status
      workspaceId
    }
  }
`;

export const REMOVE_WORKSPACE_MEMBER = gql`
  mutation RemoveWorkspaceMember($workspaceId: ID!, $memberId: ID!) {
    removeWorkspaceMember(workspaceId: $workspaceId, memberId: $memberId)
  }
`;

export const UPDATE_WORKSPACE_MEMBER_ROLE = gql`
  mutation UpdateWorkspaceMemberRole($workspaceId: ID!, $memberId: ID!, $role: WorkspaceRole!) {
    updateWorkspaceMemberRole(workspaceId: $workspaceId, memberId: $memberId, role: $role) {
      _id
      userId
      role
      status
    }
  }
`;

// ─── Project ────────────────────────────────────────────────
export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      _id
      name
      description
      workspaceId
      creatorId
      tags
      meta
      members
      workspace {
        _id
        name
      }
      creator {
        _id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      _id
      name
      description
      tags
      workspaceId
      creatorId
      tags
      meta
      members
      workspace {
        _id
        name
      }
      creator {
        _id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id) {
      _id
      name
      workspaceId
    }
  }
`;

export const ADD_PROJECT_MEMBER = gql`
  mutation AddProjectMember($projectId: ID!, $email: String!, $role: ProjectRole!) {
    addProjectMember(projectId: $projectId, email: $email, role: $role) {
      _id
      userId
      email
      role
      status
      projectId
    }
  }
`;

export const REMOVE_PROJECT_MEMBER = gql`
  mutation RemoveProjectMember($projectId: ID!, $memberId: ID!) {
    removeProjectMember(projectId: $projectId, memberId: $memberId)
  }
`;

export const UPDATE_PROJECT_MEMBER_ROLE = gql`
  mutation UpdateProjectMemberRole($projectId: ID!, $memberId: ID!, $role: ProjectRole!) {
    updateProjectMemberRole(projectId: $projectId, memberId: $memberId, role: $role) {
      _id
      userId
      role
      status
    }
  }
`;

// ─── Task ───────────────────────────────────────────────────
export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      _id
      workspaceId
      projectId
      assignedTo
      note
      status
      priority
      attachments
      assignedBy
      workspace {
        _id
        name
      }
      project {
        _id
        name
      }
      assignees {
        _id
        name
        email
      }
      assigner {
        _id
        name
        email
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      _id
      workspaceId
      projectId
      assignedTo
      note
      status
      priority
      attachments
      assignedBy
      workspace {
        _id
        name
      }
      project {
        _id
        name
      }
      assignees {
        _id
        name
        email
      }
      assigner {
        _id
        name
        email
      }
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      _id
      workspaceId
      projectId
      note
      status
    }
  }
`;

// ─── Attachment ─────────────────────────────────────────────
export const UPLOAD_ATTACHMENT = gql`
  mutation UploadAttachment($input: CreateAttachmentInput!) {
    uploadAttachment(input: $input) {
      _id
      fileName
      type
      size
      filepath
      uploadedBy
      workspaceId
      projectId
      taskId
      workspace {
        _id
        name
      }
      project {
        _id
        name
      }
      uploader {
        _id
        name
      }
    }
  }
`;

export const DELETE_ATTACHMENT = gql`
  mutation DeleteAttachment($id: ID!) {
    deleteAttachment(id: $id) {
      _id
    }
  }
`;

// ─── Membership ───────────────────────────────────────────────
export const CREATE_MEMBERSHIP = gql`
  mutation CreateMembership($input: CreateMembershipInput!) {
    createMembership(input: $input) {
      code
      success
      message
      membership {
        _id
        type
        price
        currency
        description
        tags
        isTrialAvailable
        trialDurationDays
        trialPrice
        maxWorkspaces
        maxDevices
        maxProjectsPerWorkspace
        maxUsersPerProject
        isCancellable
        durationDays
        isActive
      }
    }
  }
`;

// Backend: updateMembership(input: UpdateMembershipInput!)
export const UPDATE_MEMBERSHIP = gql`
  mutation UpdateMembership($input: UpdateMembershipInput!) {
    updateMembership(input: $input) {
      code
      success
      message
      membership {
        _id
        type
        price
        currency
        description
        tags
        isTrialAvailable
        trialDurationDays
        trialPrice
        maxWorkspaces
        maxDevices
        maxProjectsPerWorkspace
        maxUsersPerProject
        isCancellable
        durationDays
        isActive
      }
    }
  }
`;

export const DELETE_MEMBERSHIP = gql`
  mutation DeleteMembership($id: ID!) {
    deleteMembership(id: $id) {
      code
      success
      message
    }
  }
`;

// ─── Subscription ─────────────────────────────────────────────
// Backend: createSubscription(input: CreateSubscriptionInput!)
export const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      code
      success
      message
      subscription {
        _id
        userId
        planId
        status
        startDate
        endDate
      }
    }
  }
`;

// Backend: cancelSubscription(id: ID!)
export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($id: ID!) {
    cancelSubscription(id: $id) {
      code
      success
      message
    }
  }
`;

// ─── User ─────────────────────────────────────────────────────
// Backend: updateUser(input: UpdateUserInput!)
export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      code
      success
      message
      user {
        _id
        name
        email
        role
        isActive
        isVerified
        verifiedAt
        createdAt
        updatedAt
      }
    }
  }
`;

// ─── Notification Preferences ─────────────────────────────────
export const UPDATE_NOTIFICATION_PREFS = gql`
  mutation UpdateNotificationPreference($input: UpdateNotificationPreferenceInput!) {
    updateNotificationPreference(input: $input) {
      code
      success
      message
      notificationPreference {
        _id
        workspaceInvites
        projectInvites
        securityAlerts
        taskAssign
        meetingInvites
        announcement
        promotional
        updatedAt
      }
    }
  }
`;

export const CHANGE_SUBSCRIPTION_PLAN = gql`
  mutation ChangeSubscriptionPlan($planId: ID!) {
    changeSubscriptionPlan(planId: $planId) {
      code
      success
      message
      subscription {
        _id
        status
        planId
        startDate
        endDate
        priceAtPurchase
        currency
        maxWorkspaces
        maxDevices
        maxProjectsPerWorkspace
        maxUsersPerProject
        plan {
          _id
          type
          description
          price
        }
      }
    }
  }
`;

export const CREATE_MEETING = gql`
  mutation CreateMeeting($title: String!, $workspaceId: ID!, $startTime: DateTime!, $description: String) {
    createMeeting(title: $title, workspaceId: $workspaceId, startTime: $startTime, description: $description) {
      _id
      title
      startTime
      status
    }
  }
`;

export const UPDATE_MEETING_STATUS = gql`
  mutation UpdateMeetingStatus($id: ID!, $status: MeetingStatus!) {
    updateMeetingStatus(id: $id, status: $status) {
      _id
      status
    }
  }
`;

export const ACCEPT_WORKSPACE_INVITATION = gql`
  mutation AcceptWorkspaceInvitation($invitationId: ID!) {
    acceptWorkspaceInvitation(invitationId: $invitationId) {
      _id
      status
    }
  }
`;

export const REJECT_WORKSPACE_INVITATION = gql`
  mutation RejectWorkspaceInvitation($invitationId: ID!) {
    rejectWorkspaceInvitation(invitationId: $invitationId)
  }
`;

export const VERIFY_EMAIL_MANUAL = gql`
  mutation VerifyEmailManual {
    verifyEmailManual {
      code
      success
      message
      user {
        _id
        name
        email
        isVerified
        verifiedAt
      }
    }
  }
`;

export const ACCEPT_PROJECT_INVITATION = gql`
  mutation AcceptProjectInvitation($projectId: ID!) {
    acceptProjectInvitation(projectId: $projectId) {
      _id
      status
    }
  }
`;

export const REJECT_PROJECT_INVITATION = gql`
  mutation RejectProjectInvitation($projectId: ID!) {
    rejectProjectInvitation(projectId: $projectId)
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      _id
      isRead
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
`;
