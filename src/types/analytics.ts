export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isp?: string;
}

export interface Session {
  id: string;
  ip_address: string;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  user_agent: string | null;
  app_version: string | null;
  os_platform: string | null;
  started_at: string;
  last_seen_at: string;
  events_count: number;
}

export interface Event {
  id: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  app_version: string | null;
  os_platform: string | null;
  created_at: string;
}

export interface OverviewStats {
  totalEvents: number;
  totalSessions: number;
  uniqueUsers: number;
  uniqueCountries: number;
  todayEvents: number;
  activeSessionsLast24h: number;
  topEventTypes: Array<{ type: string; count: number }>;
  eventsOverTime: Array<{ date: string; count: number }>;
  topCountries: Array<{ country: string; country_code: string; count: number }>;
}

export interface GeoPoint {
  lat: number;
  lon: number;
  country: string;
  city: string;
  count: number;
}

export interface IpUser {
  ip_address: string;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  session_count: number;
  total_events: number;
  first_seen: string;
  last_seen: string;
}

export interface IpUserProfile extends IpUser {
  versions: string[];
  platforms: string[];
}

export interface UserSession {
  id: string;
  app_version: string | null;
  os_platform: string | null;
  started_at: string;
  last_seen_at: string;
  events_count: number;
}
