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
          title: 'chat',
          url: '/dashboard/ai',
          icon: 'chat',
          shortcut: ['l', 'l'],
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
      title: 'Visualizations',
      url: '/dashboard/visualizations',
      icon: 'kanban',
      isActive: false,
      items: [],
    },
  ],
  caregiver: [
    {
      title: 'Patients',
      url: '/dashboard/patients',
      icon: 'users',
      shortcut: ['p', 't'],
      isActive: false,
      items: [],
    },
  ],
  doctor: [
    {
      title: 'Patients',
      url: '/dashboard/patients',
      icon: 'dashboard',
      shortcut: ['d', 'd'],
      isActive: false,
      items: [],
    },
  ],
  admin: [
    {
      title: 'Users',
      url: '/dashboard/users',
      icon: 'dashboard',
      shortcut: ['d', 'd'],
      isActive: false,
      items: [],
    },
  ],
};


