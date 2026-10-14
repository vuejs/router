import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/workspaces/:workspaceId/projects/:recordId/overview',
    name: '/workspaces/[workspaceId]/projects/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/projects/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/projects/:recordId/activity',
    name: '/workspaces/[workspaceId]/projects/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/projects/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/projects/:recordId/settings',
    name: '/workspaces/[workspaceId]/projects/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/projects/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/projects/:recordId/members',
    name: '/workspaces/[workspaceId]/projects/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/projects/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/projects/:recordId/metrics',
    name: '/workspaces/[workspaceId]/projects/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/projects/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/tasks/:recordId/overview',
    name: '/workspaces/[workspaceId]/tasks/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/tasks/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/tasks/:recordId/activity',
    name: '/workspaces/[workspaceId]/tasks/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/tasks/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/tasks/:recordId/settings',
    name: '/workspaces/[workspaceId]/tasks/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/tasks/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/tasks/:recordId/members',
    name: '/workspaces/[workspaceId]/tasks/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/tasks/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/tasks/:recordId/metrics',
    name: '/workspaces/[workspaceId]/tasks/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/tasks/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/releases/:recordId/overview',
    name: '/workspaces/[workspaceId]/releases/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/releases/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/releases/:recordId/activity',
    name: '/workspaces/[workspaceId]/releases/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/releases/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/releases/:recordId/settings',
    name: '/workspaces/[workspaceId]/releases/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/releases/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/releases/:recordId/members',
    name: '/workspaces/[workspaceId]/releases/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/releases/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/releases/:recordId/metrics',
    name: '/workspaces/[workspaceId]/releases/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/releases/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/customers/:recordId/overview',
    name: '/workspaces/[workspaceId]/customers/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/customers/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/customers/:recordId/activity',
    name: '/workspaces/[workspaceId]/customers/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/customers/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/customers/:recordId/settings',
    name: '/workspaces/[workspaceId]/customers/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/customers/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/customers/:recordId/members',
    name: '/workspaces/[workspaceId]/customers/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/customers/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/customers/:recordId/metrics',
    name: '/workspaces/[workspaceId]/customers/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/customers/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/invoices/:recordId/overview',
    name: '/workspaces/[workspaceId]/invoices/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/invoices/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/invoices/:recordId/activity',
    name: '/workspaces/[workspaceId]/invoices/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/invoices/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/invoices/:recordId/settings',
    name: '/workspaces/[workspaceId]/invoices/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/invoices/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/invoices/:recordId/members',
    name: '/workspaces/[workspaceId]/invoices/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/invoices/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/invoices/:recordId/metrics',
    name: '/workspaces/[workspaceId]/invoices/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/invoices/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/campaigns/:recordId/overview',
    name: '/workspaces/[workspaceId]/campaigns/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/campaigns/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/campaigns/:recordId/activity',
    name: '/workspaces/[workspaceId]/campaigns/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/campaigns/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/campaigns/:recordId/settings',
    name: '/workspaces/[workspaceId]/campaigns/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/campaigns/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/campaigns/:recordId/members',
    name: '/workspaces/[workspaceId]/campaigns/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/campaigns/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/campaigns/:recordId/metrics',
    name: '/workspaces/[workspaceId]/campaigns/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/campaigns/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/assets/:recordId/overview',
    name: '/workspaces/[workspaceId]/assets/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/assets/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/assets/:recordId/activity',
    name: '/workspaces/[workspaceId]/assets/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/assets/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/assets/:recordId/settings',
    name: '/workspaces/[workspaceId]/assets/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/assets/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/assets/:recordId/members',
    name: '/workspaces/[workspaceId]/assets/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/assets/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/assets/:recordId/metrics',
    name: '/workspaces/[workspaceId]/assets/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/assets/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/reports/:recordId/overview',
    name: '/workspaces/[workspaceId]/reports/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/reports/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/reports/:recordId/activity',
    name: '/workspaces/[workspaceId]/reports/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/reports/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/reports/:recordId/settings',
    name: '/workspaces/[workspaceId]/reports/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/reports/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/reports/:recordId/members',
    name: '/workspaces/[workspaceId]/reports/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/reports/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/reports/:recordId/metrics',
    name: '/workspaces/[workspaceId]/reports/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/reports/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/teams/:recordId/overview',
    name: '/workspaces/[workspaceId]/teams/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/teams/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/teams/:recordId/activity',
    name: '/workspaces/[workspaceId]/teams/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/teams/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/teams/:recordId/settings',
    name: '/workspaces/[workspaceId]/teams/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/teams/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/teams/:recordId/members',
    name: '/workspaces/[workspaceId]/teams/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/teams/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/teams/:recordId/metrics',
    name: '/workspaces/[workspaceId]/teams/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/teams/[recordId]/metrics.vue'),
  },
  {
    path: '/workspaces/:workspaceId/integrations/:recordId/overview',
    name: '/workspaces/[workspaceId]/integrations/[recordId]/overview',
    component: () =>
      import('./pages/workspaces/[workspaceId]/integrations/[recordId]/overview.vue'),
  },
  {
    path: '/workspaces/:workspaceId/integrations/:recordId/activity',
    name: '/workspaces/[workspaceId]/integrations/[recordId]/activity',
    component: () =>
      import('./pages/workspaces/[workspaceId]/integrations/[recordId]/activity.vue'),
  },
  {
    path: '/workspaces/:workspaceId/integrations/:recordId/settings',
    name: '/workspaces/[workspaceId]/integrations/[recordId]/settings',
    component: () =>
      import('./pages/workspaces/[workspaceId]/integrations/[recordId]/settings.vue'),
  },
  {
    path: '/workspaces/:workspaceId/integrations/:recordId/members',
    name: '/workspaces/[workspaceId]/integrations/[recordId]/members',
    component: () =>
      import('./pages/workspaces/[workspaceId]/integrations/[recordId]/members.vue'),
  },
  {
    path: '/workspaces/:workspaceId/integrations/:recordId/metrics',
    name: '/workspaces/[workspaceId]/integrations/[recordId]/metrics',
    component: () =>
      import('./pages/workspaces/[workspaceId]/integrations/[recordId]/metrics.vue'),
  },
]

export const router = createRouter({ history: createWebHistory(), routes })
