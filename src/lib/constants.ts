// UDS BusConnect Constants

export const CAMPUSES = {
  NYANKPALA: 'nyankpala',
  TAMALE: 'tamale',
} as const;

export type CampusType = typeof CAMPUSES[keyof typeof CAMPUSES];

export const CAMPUS_INFO = {
  [CAMPUSES.NYANKPALA]: {
    name: 'Nyankpala Campus',
    shortName: 'Nyankpala',
    description: 'Faculty of Agriculture, Faculty of Natural Resources',
    location: 'Nyankpala, Northern Region',
    icon: 'NY',
  },
  [CAMPUSES.TAMALE]: {
    name: 'Tamale Campus',
    shortName: 'Tamale',
    description: 'Faculty of Education, Business School',
    location: 'Tamale, Northern Region',
    icon: 'TM',
  },
} as const;

export const TRAVEL_SAFE_FEE = 30.00; // Ghana Cedis
export const LUGGAGE_TAGGING_FEE = 5.00; // Ghana Cedis for >3 bags
export const MAX_FREE_BAGS = 3;

export const BOOKING_STATUS = {
  PROVISIONAL: 'provisional',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export const TRIP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const;

// App info
export const APP_NAME = 'UDS BusConnect';
export const APP_TAGLINE = 'Your Safe Journey Starts Here';
export const COMPANY_NAME = 'AnyCo Technologies';

// Currency
export const CURRENCY = {
  code: 'GHS',
  symbol: 'GHS ',
  name: 'Ghana Cedis',
} as const;

export const formatCurrency = (amount: number): string => {
  return `${CURRENCY.symbol}${amount.toFixed(2)}`;
};



