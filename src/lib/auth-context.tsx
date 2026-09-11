import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type {
  Permission,
  Restaurant,
  UserRole,
  PlatformRole,
  RestaurantSubscription,
} from '@/types';
import {
  getRestaurantsByOwner,
  getRestaurantsByIds,
  getSubscriptionByRestaurant,
  logAuditAction,
  getAllRestaurants,
  getLocalData,
  LOCAL_STORAGE_KEYS,
  createRestaurant,
  createTable,
} from './services';
import { slugify } from '@/lib/utils';
import {
  can as canCheck,
  hasPermission as hasPermCheck,
  getUserRoleForRestaurant,
  getUserCustomPermissions,
  getRestaurantIdsForUser,
  setUserRoleForRestaurant,
} from './roles';
import { demoRestaurants } from '@/data/demo';

const ACTIVE_RESTAURANT_KEY = 'dinescan_active_restaurant_id';
const INSPECTED_RESTAURANT_KEY = 'dinescan_inspected_restaurant_id';
const PLATFORM_ROLE_KEY = 'dinescan_platform_role';

interface AuthContextType {
  user: User | null;
  session: Session | null;

  // Platform Level
  platformRole: PlatformRole;
  isPlatformOwner: boolean;
  inspectedRestaurant: Restaurant | null;
  inspectRestaurant: (restaurant: Restaurant | null) => Promise<void>;

  // Multi-restaurant & Tenant Context
  restaurant: Restaurant | null;          // active restaurant context (or inspected)
  realRestaurant: Restaurant | null;      // user's actual restaurant
  restaurants: Restaurant[];              // all authorized restaurants of user
  switchRestaurant: (id: string) => void; // switch active restaurant
  refreshRestaurant: () => Promise<void>;
  getActiveRestaurant: () => Restaurant | null;
  getCurrentMembership: () => { role: UserRole; status: string; permissions: Permission[] };

  // Subscription state of active restaurant
  subscription: RestaurantSubscription | null;

  // Roles & Permissions
  userRole: UserRole;
  customPermissions: Permission[];
  can: (permission: Permission) => boolean;
  hasPermission: (permission: Permission) => boolean;
  requirePermission: (permission: Permission) => boolean;

  // Auth Actions
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: string | null;
    restaurantsCount?: number;
    role?: UserRole;
    isPlatformOwner?: boolean;
  }>;
  signUp: (
    email: string,
    password: string,
    extra?: { restaurantName?: string; ownerName?: string; phone?: string }
  ) => Promise<{ error: string | null; data: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [platformRole, setPlatformRole] = useState<PlatformRole>(() => {
    return (localStorage.getItem(PLATFORM_ROLE_KEY) as PlatformRole) || 'USER';
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [inspectedRestaurant, setInspectedRestaurant] = useState<Restaurant | null>(null);
  const [subscription, setSubscription] = useState<RestaurantSubscription | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Load subscription for active restaurant
  const loadSubscriptionFor = useCallback(async (restId: string) => {
    try {
      const sub = await getSubscriptionByRestaurant(restId);
      setSubscription(sub);
    } catch {
      setSubscription(null);
    }
  }, []);

  // Resolve active restaurant from list
  const resolveActive = useCallback(async (
    list: Restaurant[],
    currentUser: User | null,
    dbMembers?: { restaurant_id: string; role: string }[] | null
  ) => {
    if (!list.length || !currentUser) {
      setRestaurant(null);
      setUserRole('owner');
      setSubscription(null);
      return;
    }

    const savedId = localStorage.getItem(ACTIVE_RESTAURANT_KEY);
    const active = list.find(r => r.id === savedId) ?? list[0];
    setRestaurant(prev => {
      if (prev?.id === active?.id && prev?.updated_at === active?.updated_at) return prev;
      void loadSubscriptionFor(active.id);
      return active;
    });

    if (active.owner_id === currentUser.id || active.owner_user_id === currentUser.id) {
      setUserRole('owner');
      setCustomPermissions([]);
      return;
    }

    const dbMatch = dbMembers?.find(m => m.restaurant_id === active.id);
    if (dbMatch?.role) {
      setUserRole(dbMatch.role as UserRole);
      return;
    }

    const role = getUserRoleForRestaurant(currentUser.id, active.id, currentUser.email);
    const perms = getUserCustomPermissions(currentUser.id, active.id, currentUser.email);
    setUserRole(role);
    setCustomPermissions(perms);
  }, [loadSubscriptionFor]);

  const fetchMemberRows = useCallback(async (userId: string, accessToken?: string | null) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

    if (accessToken) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/restaurant_members?select=restaurant_id,role&user_id=eq.${userId}`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            return json as { restaurant_id: string; role: string }[];
          }
        }
      } catch {}
    }

    try {
      const { data } = await supabase
        .from('restaurant_members')
        .select('restaurant_id, role')
        .eq('user_id', userId);
      return (data || []) as { restaurant_id: string; role: string }[];
    } catch {
      return [];
    }
  }, []);

  const loadRestaurants = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setRestaurants([]);
      setRestaurant(null);
      setUserRole('owner');
      return;
    }

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const owned = await getRestaurantsByOwner(currentUser.id);
      const localStaffIds = getRestaurantIdsForUser(currentUser.id, currentUser.email);

      const memberRows = await fetchMemberRows(currentUser.id, s?.access_token);
      const dbStaffIds = (memberRows || []).map(m => m.restaurant_id);
      const allStaffIds = Array.from(new Set([...localStaffIds, ...dbStaffIds]));

      if (memberRows?.length) {
        memberRows.forEach(m => {
          setUserRoleForRestaurant(currentUser.id, m.restaurant_id, currentUser.email || '', '', m.role as UserRole);
        });
      }

      const unownedStaffIds = allStaffIds.filter(id => !owned.some(o => o.id === id));
      let staffRestaurants: Restaurant[] = [];
      if (unownedStaffIds.length > 0) {
        staffRestaurants = await getRestaurantsByIds(unownedStaffIds);
      }
      let combined = [...owned, ...staffRestaurants];

      // If still empty, link to DineScan Restaurant
      if (combined.length === 0) {
        const allLocal = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
        const fallbackRest = allLocal[0] || demoRestaurants[0];
        if (fallbackRest) combined = [fallbackRest];
      }

      setRestaurants(combined);
      await resolveActive(combined, currentUser, memberRows);
    } catch {
      setRestaurants([]);
      setRestaurant(null);
    }
  }, [resolveActive, fetchMemberRows]);

  // Handle Super Admin inspection persistence
  useEffect(() => {
    const savedInspectedId = localStorage.getItem(INSPECTED_RESTAURANT_KEY);
    if (savedInspectedId) {
      void getAllRestaurants().then(all => {
        const found = all.find(r => r.id === savedInspectedId);
        if (found) setInspectedRestaurant(found);
      });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await loadRestaurants(s.user);
      }
      if (alive) setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      // 1. Silent background token refresh or tab focus should NEVER unmount the app or show full-screen loader
      if (event === 'TOKEN_REFRESHED') {
        setSession(s);
        return;
      }

      setSession(s);
      const nextUser = s?.user ?? null;

      // 2. If user signed out
      if (!nextUser) {
        setUser(null);
        setRestaurants([]);
        setRestaurant(null);
        setLoading(false);
        return;
      }

      // 3. If user is already set and ID is the same, update session silently without full-screen loading flash
      setUser(prev => {
        if (prev?.id === nextUser.id) {
          void loadRestaurants(nextUser);
          return prev;
        }
        setLoading(true);
        void loadRestaurants(nextUser).finally(() => setLoading(false));
        return nextUser;
      });
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [loadRestaurants]);

  const switchRestaurant = useCallback((id: string) => {
    const found = restaurants.find(r => r.id === id);
    if (!found || !user) return;
    localStorage.setItem(ACTIVE_RESTAURANT_KEY, id);
    setRestaurant(found);
    void loadSubscriptionFor(id);
    const role = getUserRoleForRestaurant(user.id, id, user.email);
    const perms = getUserCustomPermissions(user.id, id, user.email);
    setUserRole(role);
    setCustomPermissions(perms);
  }, [restaurants, user, loadSubscriptionFor]);

  const inspectRestaurant = useCallback(async (target: Restaurant | null) => {
    if (target) {
      localStorage.setItem(INSPECTED_RESTAURANT_KEY, target.id);
      setInspectedRestaurant(target);
      void loadSubscriptionFor(target.id);
      await logAuditAction({
        user_id: user?.id || 'super-admin',
        user_email: user?.email || 'admin@dinescan.com',
        restaurant_id: target.id,
        restaurant_name: target.name,
        action: 'SUPER_ADMIN_INSPECT_RESTAURANT',
        module: 'SUPER_ADMIN',
        entity_type: 'restaurant',
        entity_id: target.id,
        metadata: { restaurant_name: target.name },
      });
    } else {
      localStorage.removeItem(INSPECTED_RESTAURANT_KEY);
      setInspectedRestaurant(null);
    }
  }, [user, loadSubscriptionFor]);

  const refreshRestaurant = useCallback(() => loadRestaurants(user), [loadRestaurants, user]);

  const canDo = useCallback((permission: Permission) => {
    if (platformRole === 'PLATFORM_OWNER' || userRole === 'super_admin' || userRole === 'owner') return true;
    return canCheck(userRole, permission, customPermissions);
  }, [platformRole, userRole, customPermissions]);

  const hasPermission = canDo;
  const requirePermission = canDo;

  const isPlatformOwner = platformRole === 'PLATFORM_OWNER' || userRole === 'super_admin';

  // Active context resolves inspected restaurant if in inspection mode
  const effectiveRestaurant = inspectedRestaurant ?? restaurant;

  const getActiveRestaurant = useCallback(() => {
    return effectiveRestaurant;
  }, [effectiveRestaurant]);

  const getCurrentMembership = useCallback(() => {
    return {
      role: userRole,
      status: 'active',
      permissions: customPermissions,
    };
  }, [userRole, customPermissions]);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check for Platform Owner / Super Admin
    if (cleanEmail === 'admin@dinescan.com' || cleanEmail === 'superadmin@dinescan.com') {
      const mockSuperAdminUser: User = {
        id: 'user-superadmin',
        app_metadata: {},
        user_metadata: { name: 'Platform Owner' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
      };
      setUser(mockSuperAdminUser);
      setPlatformRole('PLATFORM_OWNER');
      setUserRole('super_admin');
      localStorage.setItem(PLATFORM_ROLE_KEY, 'PLATFORM_OWNER');

      await logAuditAction({
        user_id: 'user-superadmin',
        user_email: cleanEmail,
        action: 'LOGIN',
        module: 'AUTH',
        metadata: { role: 'PLATFORM_OWNER' },
      });

      return {
        error: null,
        role: 'super_admin',
        isPlatformOwner: true,
        restaurantsCount: 1,
      };
    }

    // Attempt Supabase sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    // Demo personas handling (if Supabase user doesn't exist yet or offline)
    let currentUser: User | null = data.user;
    let resolvedRole: UserRole = 'owner';
    let targetRestaurant: Restaurant | null = null;

    if (error || !data.user) {
      if (
        cleanEmail === 'owner@dinescan.com' ||
        cleanEmail === 'krunal@skrestaurant.com' ||
        cleanEmail.includes('owner')
      ) {
        currentUser = {
          id: 'user-owner',
          app_metadata: {},
          user_metadata: { name: 'DineScan Owner' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: cleanEmail,
        };
        resolvedRole = 'owner';
        const allLocal = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
        targetRestaurant = allLocal[0] || demoRestaurants[0];
      } else {
        return { error: error?.message || 'Invalid login credentials', restaurantsCount: 0 };
      }
    }

    if (currentUser) {
      setUser(currentUser);
      setPlatformRole('USER');
      localStorage.setItem(PLATFORM_ROLE_KEY, 'USER');

      if (targetRestaurant) {
        setRestaurants([targetRestaurant]);
        setRestaurant(targetRestaurant);
        setUserRole(resolvedRole);
        localStorage.setItem(ACTIVE_RESTAURANT_KEY, targetRestaurant.id);
        void loadSubscriptionFor(targetRestaurant.id);

        await logAuditAction({
          user_id: currentUser.id,
          user_email: cleanEmail,
          restaurant_id: targetRestaurant.id,
          restaurant_name: targetRestaurant.name,
          action: 'LOGIN',
          module: 'AUTH',
          metadata: { role: resolvedRole, restaurant_id: targetRestaurant.id },
        });

        return { error: null, restaurantsCount: 1, role: resolvedRole, isPlatformOwner: false };
      }

      // Supabase user restaurant resolution
      const owned = await getRestaurantsByOwner(currentUser.id);
      const memberRows = await fetchMemberRows(currentUser.id, data?.session?.access_token);
      const dbStaffIds = (memberRows || []).map(m => m.restaurant_id);
      const localStaffIds = getRestaurantIdsForUser(currentUser.id, cleanEmail);
      const allStaffIds = Array.from(new Set([...localStaffIds, ...dbStaffIds]));
      const unownedStaffIds = allStaffIds.filter(id => !owned.some(o => o.id === id));

      let staffRestaurants: Restaurant[] = [];
      if (unownedStaffIds.length > 0) {
        staffRestaurants = await getRestaurantsByIds(unownedStaffIds);
      }
      const combined = [...owned, ...staffRestaurants];
      setRestaurants(combined);

      if (combined.length > 0) {
        const savedId = localStorage.getItem(ACTIVE_RESTAURANT_KEY);
        const active = combined.find(r => r.id === savedId) ?? combined[0];
        setRestaurant(active);
        void loadSubscriptionFor(active.id);

        if (active.owner_id === currentUser.id || active.owner_user_id === currentUser.id) {
          resolvedRole = 'owner';
        } else {
          const dbMatch = memberRows?.find(m => m.restaurant_id === active.id);
          if (dbMatch?.role) {
            resolvedRole = dbMatch.role as UserRole;
          } else {
            resolvedRole = getUserRoleForRestaurant(currentUser.id, active.id, cleanEmail);
          }
        }
        setUserRole(resolvedRole);

        await logAuditAction({
          user_id: currentUser.id,
          user_email: cleanEmail,
          restaurant_id: active.id,
          restaurant_name: active.name,
          action: 'LOGIN',
          module: 'AUTH',
          metadata: { role: resolvedRole },
        });
      }

      return { error: null, restaurantsCount: combined.length, role: resolvedRole, isPlatformOwner: false };
    }

    return { error: null, restaurantsCount: 0 };
  };

  const signUp = async (
    email: string,
    password: string,
    extra?: { restaurantName?: string; ownerName?: string; phone?: string }
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanRestaurantName = extra?.restaurantName?.trim() || 'My Restaurant';
    const cleanOwnerName = extra?.ownerName?.trim() || cleanEmail.split('@')[0];
    const cleanPhone = extra?.phone?.trim() || '';

    let currentUserId: string = '';
    let currentUserObj: User | null = null;
    let signUpData: unknown = null;

    // 1. Sign up with Supabase Auth
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanOwnerName,
            phone: cleanPhone,
            restaurant_name: cleanRestaurantName,
          },
        },
      });

      if (error) {
        return { error: error.message, data: null };
      }

      signUpData = data;
      if (data?.user) {
        currentUserId = data.user.id;
        currentUserObj = data.user;
        setSession(data.session ?? null);
      }
    } catch (err: unknown) {
      console.warn('Supabase auth sign up warning:', err);
    }

    // Fallback user object if Supabase user object is offline or generated mock
    if (!currentUserId) {
      currentUserId = `user-${Date.now()}`;
      currentUserObj = {
        id: currentUserId,
        app_metadata: {},
        user_metadata: { name: cleanOwnerName, phone: cleanPhone },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
      };
    }

    // Update authenticated user state immediately
    setUser(currentUserObj);
    setUserRole('owner');

    // 2. Automatically create the restaurant using the provided Restaurant Name
    try {
      const newRestaurant = await createRestaurant({
        name: cleanRestaurantName,
        slug: slugify(cleanRestaurantName) || `restaurant-${Date.now()}`,
        owner_id: currentUserId,
        owner_user_id: currentUserId,
        phone: cleanPhone,
        email: cleanEmail,
        type: 'restaurant',
        is_open: true,
        status: 'active',
        cuisines: 'Multi-Cuisine',
      });

      if (newRestaurant) {
        // Create initial default tables so QR codes are ready right away
        try {
          await Promise.all([
            createTable({ restaurant_id: newRestaurant.id, table_number: '01', seats: 2, status: 'available', area: 'Ground Floor' }),
            createTable({ restaurant_id: newRestaurant.id, table_number: '02', seats: 4, status: 'available', area: 'Ground Floor' }),
            createTable({ restaurant_id: newRestaurant.id, table_number: '03', seats: 4, status: 'available', area: 'Ground Floor' }),
            createTable({ restaurant_id: newRestaurant.id, table_number: '04', seats: 6, status: 'available', area: 'First Floor' }),
          ]);
        } catch {}

        localStorage.setItem(ACTIVE_RESTAURANT_KEY, newRestaurant.id);
        setRestaurant(newRestaurant);
        setRestaurants(prev => {
          const filtered = prev.filter(r => r.id !== newRestaurant.id);
          return [newRestaurant, ...filtered];
        });

        void logAuditAction({
          user_id: currentUserId,
          user_email: cleanEmail,
          restaurant_id: newRestaurant.id,
          restaurant_name: newRestaurant.name,
          action: 'REGISTER',
          module: 'AUTH',
          metadata: { role: 'owner' },
        });
      }
    } catch (createErr) {
      console.error('Error auto-creating restaurant:', createErr);
    }

    return { error: null, data: signUpData };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRestaurants([]);
    setRestaurant(null);
    setInspectedRestaurant(null);
    setSubscription(null);
    setPlatformRole('USER');
    localStorage.removeItem(ACTIVE_RESTAURANT_KEY);
    localStorage.removeItem(INSPECTED_RESTAURANT_KEY);
    localStorage.removeItem(PLATFORM_ROLE_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      platformRole,
      isPlatformOwner,
      inspectedRestaurant,
      inspectRestaurant,
      restaurant: effectiveRestaurant,
      realRestaurant: restaurant,
      restaurants,
      switchRestaurant,
      refreshRestaurant,
      getActiveRestaurant,
      getCurrentMembership,
      subscription,
      userRole,
      customPermissions,
      can: canDo,
      hasPermission,
      requirePermission,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
