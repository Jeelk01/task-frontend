import { gql } from "@apollo/client";

// ─── Users ────────────────────────────────────────────────────
// Backend: findUserWithPagination (NOT findUsersWithPagination)
export const GET_USERS = gql`
  query FindUserWithPagination($input: FindUsersWithPaginationInput!) {
    findUserWithPagination(input: $input) {
      code
      success
      message
      items {
        _id
        name
        email
        role
        isActive
        isVerified
        verifiedAt
        createdAt
        updatedAt
        createdBy
        creator {
          _id
          name
        }
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
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
        createdBy
        creator {
          _id
          name
        }
      }
    }
  }
`;

// ─── Devices ──────────────────────────────────────────────────
// Backend: findMyDevices (returns MultiDevicesResponse with .devices array, NOT array directly)
export const GET_MY_DEVICES = gql`
  query FindMyDevices {
    findMyDevices {
      code
      success
      message
      devices {
        _id
        userId
        deviceId
        deviceName
        userAgent
        lastLoginAt
        createdAt
      }
    }
  }
`;

// ─── Workspaces ───────────────────────────────────────────────
// Backend: findWorkspaceWithPagination ✅ matches
export const GET_WORKSPACES = gql`
  query FindWorkspaceWithPagination($input: FindWorkspaceWithPagination!) {
    findWorkspaceWithPagination(input: $input) {
      code
      success
      message
      items {
        _id
        name
        description
        tags
        isActive
        meta
        members
        ownerId
        owner {
          _id
          name
          email
        }
        memberUsers {
          _id
          name
          email
        }
        createdAt
        updatedAt
        myRole
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_WORKSPACE_MEMBERS = gql`
  query FindWorkspaceMemberWithPagination($input: FindWorkspaceMemberWithPagination!) {
    findWorkspaceMemberWithPagination(input: $input) {
      code
      success
      message
      items {
        _id
        userId
        email
        role
        status
        workspaceId
        user {
          _id
          name
          email
        }
        invitedById
        invitedBy {
          _id
          name
          email
        }
        removedByUser {
          _id
          name
          email
        }
        acceptedAt
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;


// ─── Memberships ──────────────────────────────────────────────
// Backend: findMemberships (NOT findMembershipWithPagination)
export const GET_MEMBERSHIPS = gql`
  query FindMemberships($input: FindMembership!) {
    findMemberships(input: $input) {
      code
      success
      message
      items {
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
        createdBy
        creator {
          _id
          name
          email
        }
        createdAt
        updatedAt
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

// ─── Subscriptions ────────────────────────────────────────────
// Backend: findMySubscriptions (takes string input) — no mySubscription query exists
export const GET_MY_SUBSCRIPTIONS = gql`
  query FindMySubscriptions {
    findMySubscriptions {
      code
      success
      message
      subscriptions {
        _id
        userId
        planId
        status
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
          currency
        }
        createdAt
      }
    }
  }
`;

// ─── Notification Preferences ─────────────────────────────────
// Backend: findNotificationPreference (takes FindNotificationPreferenceInput, returns pagination)
export const GET_NOTIFICATION_PREFS = gql`
  query FindNotificationPreference($input: FindNotificationPreferenceInput!) {
    findNotificationPreference(input: $input) {
      code
      success
      message
      items {
        _id
        userId
        workspaceInvites
        projectInvites
        securityAlerts
        taskAssign
        meetingInvites
        announcement
        promotional
        createdAt
        updatedAt
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_MY_NOTIFICATION_PREFS = gql`query MyNotificationPreference {
    myNotificationPreference {
        code
        message
        success
        notificationPreference {
            _id
            updatedAt
            workspaceInvites
            projectInvites
            securityAlerts
            taskAssign
            meetingInvites
            announcement
            promotional
        }
    }
}
`

// ─── Workspaces (Continued) ───────────────────────────────────
export const GET_MY_WORKSPACES = gql`
  query FindMyWorkspaces($args: FindWorkspacesArgs!) {
    findMyWorkspaces(args: $args) {
      code
      success
      message
      items {
        _id
        name
        description
        tags
        isActive
        meta
        members
        memberUsers {
          _id
          name
          email
        }
        ownerId
        owner {
          _id
          name
          email
        }
        createdAt
        updatedAt
        myRole
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_FIND_WORKSPACES = gql`
  query FindWorkspaces($args: FindWorkspacesArgs!) {
    findWorkspaces(args: $args) {
      code
      success
      message
      items {
        _id
        name
        description
        tags
        isActive
        meta
        members
        memberUsers {
          _id
          name
          email
        }
        ownerId
        owner {
          _id
          name
          email
        }
        createdAt
        updatedAt
        myRole
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

// ─── Projects ──────────────────────────────────────────────────
export const GET_PROJECTS = gql`
  query FindProjects($args: FindProjectsArgs!) {
    findProjects(args: $args) {
      code
      success
      message
      items {
        _id
        name
        description
        tags
        workspaceId
        creatorId
        members
        meta
        memberUsers {
          _id
          name
          email
        }
        createdAt
        updatedAt
        workspace {
          _id
          name
          myRole
        }
        creator {
          _id
          name
          email
        }
        myRole
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_MY_PROJECTS = gql`
  query FindMyProjects($args: FindProjectsArgs!) {
    findMyProjects(args: $args) {
      code
      success
      message
      items {
        _id
        name
        description
        tags
        workspaceId
        creatorId
        members
        meta
        memberUsers {
          _id
          name
          email
        }
        workspace {
          _id
          name
          myRole
        }
        creator {
          _id
          name
          email
        }
        createdAt
        updatedAt
        myRole
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_PROJECT_MEMBERS = gql`
  query FindProjectMemberWithPagination($input: FindProjectMemberWithPagination!) {
    findProjectMemberWithPagination(input: $input) {
      code
      success
      message
      items {
        _id
        userId
        email
        role
        status
        projectId
        user {
          _id
          name
          email
        }
        invitedById
        invitedBy {
          _id
          name
          email
        }
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

// ─── Tasks ────────────────────────────────────────────────────
export const GET_TASKS = gql`
  query FindTasks($args: FindTasksArgs!) {
    findTasks(args: $args) {
      code
      success
      message
      items {
        _id
        workspaceId
        projectId
        assignedTo
        attachments
        status
        priority
        note
        assignedBy
        createdAt
        updatedAt
        workspace {
          _id
          name
          myRole
        }
        project {
          _id
          name
          myRole
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
        dueDate
        completedAt
        blockerId
        blockerTask {
          _id
          note
          status
        }
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_MY_TASKS = gql`
  query FindMyTasks($args: FindTasksArgs!) {
    findMyTasks(args: $args) {
      code
      success
      message
      items {
        _id
        workspaceId
        projectId
        assignedTo
        attachments
        status
        priority
        note
        assignedBy
        createdAt
        updatedAt
        workspace {
          _id
          name
          myRole
        }
        project {
          _id
          name
          myRole
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
        dueDate
        completedAt
        blockerId
        blockerTask {
          _id
          note
          status
        }
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

// ─── Chat ────────────────────────────────────────────────────
export const GET_CHAT_HISTORY = gql`
  query GetChatHistory($workspaceId: ID!, $page: Int, $limit: Int) {
    getChatHistory(workspaceId: $workspaceId, page: $page, limit: $limit) {
      messages {
        _id
        workspaceId
        content
        isSystemMessage
        createdAt
        senderId {
          _id
          name
          email
        }
      }
      totalItems
      totalPages
      page
      limit
    }
  }
`;

export const GET_WORKSPACE_FOR_CHAT = gql`
  query FindWorkspaceById($id: ID!) {
    findWorkspaceById(id: $id) {
      _id
      name
      description
      memberUsers {
        _id
        name
        avatar
      }
      myRole
    }
  }
`;

export const GET_MY_INVITATIONS = gql`
  query FindMyInvitations {
    findMyInvitations {
      _id
      email
      status
      role
      workspaceId
      workspace {
        _id
        name
        description
      }
      invitedById
      invitedBy {
        _id
        name
        email
      }
      createdAt
    }
  }
`;

export const GET_WORKSPACE_MEETINGS = gql`
  query GetWorkspaceMeetings($workspaceId: ID!) {
    getWorkspaceMeetings(workspaceId: $workspaceId) {
      _id
      title
      description
      startTime
      endTime
      status
      hostId
      host {
        _id
        name
        email
      }
    }
  }
`;
export const GET_WORKSPACE_DETAILS = gql`
  query GetWorkspaceDetails($id: ID!) {
    findWorkspaceById(id: $id) {
      _id
      name
      description
      tags
      isActive
      ownerId
      owner {
        _id
        name
        email
        avatar
      }
      memberUsers {
        _id
        name
        email
        avatar
      }
      createdAt
      updatedAt
      myRole
    }
    findProjects(args: { workspaceId: $id }) {
      items {
        _id
        name
        description
        tags
        members
        createdAt
        memberUsers {
          _id
          name
          avatar
        }
        myRole
      }
    }
  }
`;

export const GET_PROJECT_DETAILS = gql`
  query GetProjectDetails($id: ID!) {
    findProjectById(id: $id) {
      _id
      name
      description
      tags
      workspaceId
      workspace {
        _id
        name
        myRole
      }
      members
      memberUsers {
        _id
        name
        email
        avatar
      }
      createdAt
      updatedAt
      myRole
    }
    findTasks(args: { projectId: $id }) {
      items {
        _id
        status
        priority
        note
        assignedTo
        assignees {
          _id
          name
          avatar
        }
        workspace {
          _id
          name
          description
          tags
        }
        dueDate
        completedAt
        blockerId
        blockerTask {
          _id
          note
          status
        }
        createdAt
      }
    }
  }
`;

export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications {
    myNotifications {
      _id
      type
      data
      isRead
      createdAt
    }
  }
`;
