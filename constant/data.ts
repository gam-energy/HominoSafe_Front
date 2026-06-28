import { NavItem } from '@/types';
export type Role = 'patient' | 'caregiver' | 'admin' | "doctor";



export const roleNavItems: Record<Role, NavItem[]> = {
  patient: [
    {
      title: 'Dashboard',
      url: '/dashboard/overview',
      icon: 'dashboard',
      shortcut: ['d', 'd'],
      isActive: false,
      items: [],
    },
    {
      title: 'AI',
      url: '#',
      icon: 'brain',
      isActive: true,
      items: [
        {
          title: 'Predictive AI',
          url: '/',
          icon: 'brain',
          shortcut: ['m', 'm'],
        },
        {
          title: 'AI Chat',
          url: '/dashboard/ai',
          icon: 'chat',
          shortcut: ['l', 'l'],
        },
        {
          title: 'Realtime Chat',
          url: '/dashboard/chat',
          icon: 'chat',
          shortcut: ['c', 'c'],
        },
      ],
    },
    {
      title: 'Alerts',
      url: '/dashboard/alert',
      icon: 'alertTriangle',
      shortcut: ['a', 'l'],
      isActive: false,
      items: [],
    },
    {
      title: 'medicine',
      url: '/dashboard/medicine',
      icon: 'pill',
      shortcut: ['m', 'e'],
      isActive: false,
      items: [],
    },
    {
      title: 'Medical Profile',
      url: '/dashboard/medical-profile',
      icon: 'billing',
      isActive: true,
      items: [],
    },
    {
      title: 'Health KPIs',
      url: '/dashboard/health-kpis',
      icon: 'healthKpi',
      isActive: false,
      items: [],
    },
  ],
  caregiver: [
    {
      title: 'Dashboard',
      url: '/dashboard/caregiver-overview',
      icon: 'dashboard',
      shortcut: ['d', 'd'],
      isActive: false,
      items: [],
    },
    {
      title: 'Patients',
      url: '/dashboard/my-patients',
      icon: 'user',
      shortcut: ['p', 't'],
      isActive: false,
      items: [],
    },
    {
      title: 'AI Chat',
      url: '/dashboard/ai',
      icon: 'brain',
      shortcut: ['a', 'i'],
      isActive: false,
      items: [],
    },
    {
      title: 'Chat',
      url: '/dashboard/chat',
      icon: 'chat',
      shortcut: ['c', 'c'],
      isActive: false,
      items: [],
    },
  ],
  doctor: [
    {
      title: 'Dashboard',
      url: '/dashboard/doctor-overview',
      icon: 'dashboard',
      shortcut: ['d', 'd'],
      isActive: false,
      items: [],
    },
    {
      title: 'Patients',
      url: '/dashboard/patients',
      icon: 'user',
      shortcut: ['p', 't'],
      isActive: false,
      items: [],
    },
    {
      title: 'Patient Alerts',
      url: '/dashboard/patient-alert',
      icon: 'alertTriangle',
      shortcut: ['a', 'l'],
      isActive: false,
      items: [],
    },
    {
      title: 'AI Chat',
      url: '/dashboard/ai',
      icon: 'brain',
      shortcut: ['a', 'i'],
      isActive: false,
      items: [],
    },
    {
      title: 'Chat',
      url: '/dashboard/chat',
      icon: 'chat',
      shortcut: ['c', 'c'],
      isActive: false,
      items: [],
    },
  ],
  admin: [
    {
      title: 'Dashboard',
      url: '/dashboard/overview',
      icon: 'dashboard',
      isActive: false,
      items: [],
    },
    {
      title: 'Users',
      url: '/dashboard/users',
      icon: 'dashboard',
      shortcut: ['d', 'd'],
      isActive: false,
      items: [],
    },
    {
      title: 'Chat',
      url: '/dashboard/chat',
      icon: 'chat',
      shortcut: ['c', 'c'],
      isActive: false,
      items: [],
    },
  ],
};


