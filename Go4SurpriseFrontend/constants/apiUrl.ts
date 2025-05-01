

// Use built-in __DEV__ variable which is true in development and false in production
export const BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://pre-go4-backend-dot-ispp-2425-g10.ew.r.appspot.com'; // Production URL

export const STRIPE_PUBLIC_KEY = 'pk_test_51QPNbqFSJFG8C7sO5n4Ooe1Uc2sA827AuPqhc70kYNxiUhW9KW0uE4ccty8YV8v3WRdHjWfbZi2pFEC1XpZmLgRy00dsXZoUeZ'

export const FRONT_URL = __DEV__ 
  ? 'http://localhost:8001'
  : 'https://pre-go4-frontend-dot-ispp-2425-g10.ew.r.appspot.com';