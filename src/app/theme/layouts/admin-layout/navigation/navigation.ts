export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
  roles?: string[]; // Allowed roles: 'ADMIN', 'COURT_MANAGER'
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Tổng quan',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Bảng điều khiển',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/dashboard',
        icon: 'dashboard',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'court-management',
    title: 'Quản lý sân bãi',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'clusters',
        title: 'Cụm sân',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/court-management/clusters',
        icon: 'deployment-unit'
      },
      {
        id: 'courts',
        title: 'Danh sách sân',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/court-management/courts',
        icon: 'thunderbolt'
      },
      {
        id: 'time-slots',
        title: 'Khung giờ',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/court-management/time-slots',
        icon: 'clock-circle'
      },
      {
        id: 'dynamic-pricing',
        title: 'Giá theo khung giờ',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/court-management/pricing/dynamic',
        icon: 'money-collect'
      }
    ]
  },
  {
    id: 'booking-management',
    title: 'Quản lý đặt sân',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'booking-list',
        title: 'Danh sách đặt sân',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/booking-management/list',
        icon: 'calendar'
      },
      {
        id: 'booking-calendar',
        title: 'Lịch đặt sân',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/booking-management/calendar',
        icon: 'schedule'
      }
    ]
  },
  {
    id: 'service-management',
    title: 'Quản lý dịch vụ',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'services',
        title: 'Dịch vụ đi kèm',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/service-management/list',
        icon: 'shopping-cart'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Báo cáo',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'revenue',
        title: 'Báo cáo Doanh thu',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/reports/revenue',
        icon: 'line-chart'
      }
    ]
  },
  {
    id: 'user-management',
    title: 'Quản lý người dùng',
    type: 'group',
    icon: 'icon-navigation',
    roles: ['ADMIN'], // Only ADMIN can see this
    children: [
      {
        id: 'customers',
        title: 'Khách hàng',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/user-management/customers',
        icon: 'customer-service'
      },
      {
        id: 'managers',
        title: 'Quản lý sân',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/user-management/managers',
        icon: 'team'
      },
      {
        id: 'admins',
        title: 'Quản trị viên',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/user-management/admins',
        icon: 'safety-certificate'
      }
    ]
  },
  {
    id: 'system',
    title: 'Hệ thống',
    type: 'group',
    icon: 'icon-navigation',
    roles: ['ADMIN'], // Only ADMIN can see this
    children: [
      {
        id: 'settings',
        title: 'Cài đặt',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/system/settings',
        icon: 'setting'
      }
    ]
  }
];
