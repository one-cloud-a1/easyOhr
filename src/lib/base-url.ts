const raw = import.meta.env.BASE_URL || '/'
export const BASE = raw.endsWith('/') ? raw : raw + '/'
