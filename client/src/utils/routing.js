/**
 * Route <-> Tab mapping for ServiceHub client navigation.
 * Keeps browser URL in sync with activeTab and preserves routes across refreshes.
 */

export const TAB_TO_PATH = {
  landing: '/',
  login: '/login',
  register: '/register',
  dashboard: '/overview',
  bookings: '/appointments',
  calendar: '/calendar',
  customers: '/customers',
  services: '/services',
  team: '/team',
  staff: '/team',
  reviews: '/reviews',
  performance: '/performance',
  reports: '/performance',
  opportunities: '/opportunities',
  settings: '/business-settings',
  onboarding: '/onboarding',
  account: '/account',
  'staff-dashboard': '/staff-dashboard',
  'customer-portal': '/discover',
  'customer-discover': '/discover',
  'customer-appointments': '/my-appointments',
  'customer-reviews': '/my-reviews',
};

const PATH_TO_TAB = {
  '/': 'landing',
  '/login': 'login',
  '/register': 'register',
  '/overview': 'dashboard',
  '/dashboard': 'dashboard',
  '/appointments': 'bookings',
  '/bookings': 'bookings',
  '/calendar': 'calendar',
  '/customers': 'customers',
  '/services': 'services',
  '/team': 'team',
  '/staff': 'team',
  '/reviews': 'reviews',
  '/performance': 'performance',
  '/reports': 'performance',
  '/opportunities': 'opportunities',
  '/business-settings': 'settings',
  '/settings': 'settings',
  '/onboarding': 'onboarding',
  '/account': 'account',
  '/staff-dashboard': 'staff-dashboard',
  '/discover': 'customer-portal',
  '/my-appointments': 'customer-appointments',
  '/my-reviews': 'customer-reviews',
};

export const VALID_CUSTOMER_TABS = [
  'customer-portal',
  'customer-discover',
  'customer-appointments',
  'customer-reviews',
  'account',
];

export const VALID_OWNER_TABS = [
  'dashboard',
  'bookings',
  'calendar',
  'customers',
  'services',
  'team',
  'staff',
  'reviews',
  'reports',
  'performance',
  'opportunities',
  'settings',
  'onboarding',
  'account',
];

export const VALID_STAFF_TABS = ['staff-dashboard', 'account'];

export function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return (trimmed || '/').toLowerCase();
}

export function getTabFromPath(pathname) {
  const normalized = normalizePathname(pathname);
  return PATH_TO_TAB[normalized] || null;
}

export function getPathFromTab(tab) {
  return TAB_TO_PATH[tab] || '/';
}

