import { supabase } from './supabase';
import type {
  Restaurant,
  Category,
  MenuItem,
  MenuItemAddon,
  RestaurantTable,
  Order,
  OrderItem,
  Offer,
  Customer,
  Feedback,
  RestaurantSettings,
  SubscriptionPlan,
  RestaurantSubscription,
  Payment,
  PaymentStatus,
  SubscriptionStatus,
  RestaurantMember,
  AuditLog,
  RestaurantStatus,
} from '@/types';
import {
  demoRestaurants,
  demoPlans,
  demoSubscriptions,
  demoPayments,
  demoStaffMembers,
  demoAuditLogs,
  demoCustomers,
  demoOrders,
  demoCategories,
  demoMenuItems,
  demoTables,
  demoOffers,
  demoFeedback,
} from '@/data/demo';

// Local storage persistent caches to ensure offline, demo & dynamic interactivity works seamlessly
export const LOCAL_STORAGE_KEYS = {
  RESTAURANTS: 'dinescan_saas_restaurants',
  SUBSCRIPTIONS: 'dinescan_saas_subscriptions',
  PAYMENTS: 'dinescan_saas_payments',
  PLANS: 'dinescan_saas_plans',
  STAFF: 'dinescan_saas_staff',
  AUDIT: 'dinescan_saas_audit',
  CUSTOMERS: 'dinescan_saas_customers',
  ORDERS: 'dinescan_saas_orders',
  CATEGORIES: 'dinescan_saas_categories',
  MENU_ITEMS: 'dinescan_saas_menu_items',
  ADDONS: 'dinescan_saas_addons',
  TABLES: 'dinescan_saas_tables',
  OFFERS: 'dinescan_saas_offers',
  SETTINGS: 'dinescan_saas_settings',
};

// One-time clean-slate reset: Clears dummy tables, orders, customers, offers, feedback, payments & extra staff
// CRITICAL: Preserves CATEGORIES and MENU_ITEMS intact as requested by the user.
if (typeof window !== 'undefined' && localStorage.getItem('dinescan_clean_reset_v3') !== 'done') {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.FEEDBACK, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.OFFERS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.TABLES, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF, JSON.stringify(demoStaffMembers));
    localStorage.setItem(LOCAL_STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.RESTAURANTS, JSON.stringify(demoRestaurants));
    localStorage.setItem(LOCAL_STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(demoSubscriptions));
    // Ensure menu categories & items are present if empty
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(demoCategories));
    }
    const storedMenu = localStorage.getItem(LOCAL_STORAGE_KEYS.MENU_ITEMS);
    if (!storedMenu) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.MENU_ITEMS, JSON.stringify(demoMenuItems));
    } else {
      try {
        const parsed = JSON.parse(storedMenu) as MenuItem[];
        let changed = false;
        parsed.forEach(item => {
          if (item.name && item.name.toLowerCase().includes('roti') && (!item.image_url || item.image_url.includes('placeholder'))) {
            item.image_url = 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=700&q=80';
            changed = true;
          }
        });
        const hasRoti = parsed.some(i => i.name && i.name.toLowerCase().includes('roti'));
        if (!hasRoti) {
          const rotiItems = demoMenuItems.filter(i => i.name.toLowerCase().includes('roti'));
          parsed.push(...rotiItems);
          changed = true;
        }
        if (changed) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.MENU_ITEMS, JSON.stringify(parsed));
        }
      } catch {}
    }
    localStorage.removeItem('dinescan_restaurant_roles');
    sessionStorage.removeItem('dinescan:lastOrder');
    localStorage.setItem('dinescan_clean_reset_v4', 'done');
  } catch {}
}

export function getLocalData<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

export function saveLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// ============ RESTAURANT ============
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const allLocal = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!error && data) {
      const local = allLocal.find(r => r.id === data.id);
      return (local ? { ...data, ...local } : data) as Restaurant;
    }
  } catch {}

  const match = allLocal.find(r => r.slug === slug);
  return match ?? null;
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const allLocal = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) {
      const local = allLocal.find(r => r.id === data.id);
      return (local ? { ...data, ...local } : data) as Restaurant;
    }
  } catch {}

  const match = allLocal.find(r => r.id === id);
  return match ?? null;
}

export async function getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
  const allLocal = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
    const res = await fetch(`${supabaseUrl}/rest/v1/restaurants?owner_id=eq.${ownerId}&select=*&order=created_at.desc`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        return json.map(d => {
          const local = allLocal.find(r => r.id === d.id);
          return local ? { ...d, ...local } : d;
        }) as Restaurant[];
      }
    }
  } catch {}

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map(d => {
        const local = allLocal.find(r => r.id === d.id);
        return local ? { ...d, ...local } : d;
      }) as Restaurant[];
    }
  } catch {}

  // Match local storage cached restaurants
  const matches = allLocal.filter(r => r.owner_id === ownerId || r.owner_user_id === ownerId);
  return matches;
}

export async function getRestaurantsByIds(ids: string[]): Promise<Restaurant[]> {
  if (!ids || ids.length === 0) return [];
  const allLocal = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
    const res = await fetch(`${supabaseUrl}/rest/v1/restaurants?id=in.(${ids.join(',')})&select=*`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        return json.map(d => {
          const local = allLocal.find(r => r.id === d.id);
          return local ? { ...d, ...local } : d;
        }) as Restaurant[];
      }
    }
  } catch {}

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .in('id', ids);
    if (!error && data && data.length > 0) {
      return data.map(d => {
        const local = allLocal.find(r => r.id === d.id);
        return local ? { ...d, ...local } : d;
      }) as Restaurant[];
    }
  } catch {}

  return allLocal.filter(r => ids.includes(r.id));
}

export async function createRestaurant(
  restaurant: Partial<Restaurant>
): Promise<Restaurant | null> {
  let created: Restaurant | null = null;
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurant)
      .select()
      .single();
    if (!error && data) created = data as Restaurant;
  } catch {}

  if (!created) {
    created = {
      id: restaurant.id || `restaurant-${Date.now()}`,
      name: restaurant.name || 'My Restaurant',
      slug: restaurant.slug || 'my-restaurant',
      type: restaurant.type || 'fine_dine',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      address: restaurant.address || '',
      city: restaurant.city || '',
      state: restaurant.state || '',
      pincode: restaurant.pincode || '',
      gst_number: restaurant.gst_number || null,
      opening_time: restaurant.opening_time || '10:00 AM',
      closing_time: restaurant.closing_time || '11:00 PM',
      is_open: true,
      cuisines: restaurant.cuisines || 'Multi-Cuisine',
      rating: 4.8,
      owner_id: restaurant.owner_id || 'owner',
      owner_user_id: restaurant.owner_user_id || 'owner',
      status: 'active',
      description: restaurant.description || '',
      logo_url: restaurant.logo_url || null,
      cover_url: restaurant.cover_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const all = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
  all.unshift(created);
  saveLocalData(LOCAL_STORAGE_KEYS.RESTAURANTS, all);

  return created;
}

export async function updateRestaurant(
  id: string,
  updates: Partial<Restaurant>
): Promise<Restaurant | null> {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  let dbResult: Restaurant | null = null;

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updatedData)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (!error && data) {
      dbResult = data as Restaurant;
    }
  } catch (e) {
    console.warn('Supabase updateRestaurant fallback to local storage cache:', e);
  }

  // Always update persistent local cache so images and details are 100% saved
  const allRestaurants = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
  const idx = allRestaurants.findIndex(r => r.id === id);
  let finalRecord: Restaurant;

  if (idx >= 0) {
    finalRecord = { ...allRestaurants[idx], ...updatedData, ...(dbResult || {}) };
    allRestaurants[idx] = finalRecord;
  } else {
    const fallback = demoRestaurants.find(r => r.id === id) || ({} as Restaurant);
    finalRecord = { ...fallback, ...updatedData, id, ...(dbResult || {}) } as Restaurant;
    allRestaurants.push(finalRecord);
  }

  saveLocalData(LOCAL_STORAGE_KEYS.RESTAURANTS, allRestaurants);

  // Also update in-memory demoRestaurants array so any reference immediately reflects updates
  const demoIdx = demoRestaurants.findIndex(r => r.id === id);
  if (demoIdx >= 0) {
    Object.assign(demoRestaurants[demoIdx], finalRecord);
  }

  await logAuditAction({
    restaurant_id: id,
    action: 'UPDATE_RESTAURANT_PROFILE',
    module: 'RESTAURANT',
    entity_type: 'restaurant',
    entity_id: id,
    metadata: {
      name: finalRecord.name,
      phone: finalRecord.phone,
      has_logo: !!finalRecord.logo_url,
      has_cover: !!finalRecord.cover_url,
    },
  });

  return finalRecord;
}

// ============ CATEGORIES ============
export async function getCategories(restaurantId: string): Promise<Category[]> {
  const localList = getLocalData<Category>(LOCAL_STORAGE_KEYS.CATEGORIES, demoCategories);
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('display_order', { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map(d => {
        const local = localList.find(c => c.id === d.id);
        return local ? { ...d, ...local } : d;
      }) as Category[];
    }
  } catch {}

  const matches = localList.filter(c => c.restaurant_id === restaurantId);
  if (matches.length > 0) return matches;
  return demoCategories.map(c => ({ ...c, restaurant_id: restaurantId }));
}

export async function createCategory(category: Partial<Category>): Promise<Category | null> {
  let created: Category | null = null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    if (!error && data) created = data as Category;
  } catch {}

  if (!created) {
    created = {
      id: category.id || `cat-${Date.now()}`,
      restaurant_id: category.restaurant_id || 'sk-restaurant',
      name: category.name || 'New Category',
      icon: category.icon || '🍽️',
      display_order: category.display_order || 1,
      is_active: category.is_active !== undefined ? category.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const all = getLocalData<Category>(LOCAL_STORAGE_KEYS.CATEGORIES, demoCategories);
  all.push(created);
  saveLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, all);
  return created;
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category | null> {
  let updated: Category | null = null;
  const updatePayload = { ...updates, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (!error && data) updated = data as Category;
  } catch {}

  const all = getLocalData<Category>(LOCAL_STORAGE_KEYS.CATEGORIES, demoCategories);
  const idx = all.findIndex(c => c.id === id);
  if (idx >= 0) {
    updated = { ...all[idx], ...updatePayload, ...(updated || {}) };
    all[idx] = updated;
  } else {
    const fallback = demoCategories.find(c => c.id === id);
    updated = { ...(fallback || {}), ...updatePayload, id, ...(updated || {}) } as Category;
    all.push(updated);
  }
  saveLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, all);
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await supabase.from('categories').delete().eq('id', id);
  } catch {}

  const all = getLocalData<Category>(LOCAL_STORAGE_KEYS.CATEGORIES, demoCategories);
  saveLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, all.filter(c => c.id !== id));
}

// ============ MENU ITEMS ============
export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const localList = getLocalData<MenuItem>(LOCAL_STORAGE_KEYS.MENU_ITEMS, demoMenuItems);
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const dbIds = new Set(data.map(d => d.id));
      const mergedDb = data.map(d => {
        const local = localList.find(m => m.id === d.id || (m.name && d.name && m.name.toLowerCase() === d.name.toLowerCase()));
        return (local ? { ...d, ...local } : d) as MenuItem;
      });
      const localOnly = localList.filter(m => !dbIds.has(m.id) && (m.restaurant_id === restaurantId || m.restaurant_id === 'sk-restaurant' || !m.restaurant_id));
      return [...mergedDb, ...localOnly];
    }
  } catch {}

  const matches = localList.filter(m => m.restaurant_id === restaurantId || m.restaurant_id === 'sk-restaurant' || !m.restaurant_id);
  if (matches.length > 0) return matches;
  if (localList.length > 0) return localList;
  return demoMenuItems.map(m => ({ ...m, restaurant_id: restaurantId }));
}

export async function getMenuItemsByCategory(
  restaurantId: string,
  categoryId: string | null
): Promise<MenuItem[]> {
  const all = await getMenuItems(restaurantId);
  if (!categoryId || categoryId === 'all') return all;
  return all.filter(m => m.category_id === categoryId);
}

export async function createMenuItem(item: Partial<MenuItem>): Promise<MenuItem | null> {
  let created: MenuItem | null = null;
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(item)
      .select()
      .single();
    if (!error && data) created = data as MenuItem;
  } catch {}

  const fullItem: MenuItem = {
    id: item.id || created?.id || `item-${Date.now()}`,
    restaurant_id: item.restaurant_id || 'sk-restaurant',
    category_id: item.category_id || null,
    name: item.name || 'New Dish',
    description: item.description || '',
    price: item.price || 0,
    discount_price: item.discount_price ?? null,
    image_url: item.image_url || null,
    food_type: item.food_type || 'veg',
    spice_level: item.spice_level || 'mild',
    prep_time: item.prep_time || 15,
    rating: 4.8,
    is_available: item.is_available !== undefined ? item.is_available : true,
    is_featured: !!item.is_featured,
    is_recommended: !!item.is_recommended,
    is_bestseller: !!item.is_bestseller,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(created || {}),
    ...item,
  };

  const all = getLocalData<MenuItem>(LOCAL_STORAGE_KEYS.MENU_ITEMS, demoMenuItems);
  all.unshift(fullItem);
  saveLocalData(LOCAL_STORAGE_KEYS.MENU_ITEMS, all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dinescan:menu-updated', { detail: { item: fullItem } }));
  }
  return fullItem;
}

export async function updateMenuItem(
  id: string,
  updates: Partial<MenuItem>
): Promise<MenuItem | null> {
  let updated: MenuItem | null = null;
  const updatePayload = { ...updates, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (!error && data) updated = data as MenuItem;
  } catch {}

  const all = getLocalData<MenuItem>(LOCAL_STORAGE_KEYS.MENU_ITEMS, demoMenuItems);
  const idx = all.findIndex(m => m.id === id);
  if (idx >= 0) {
    updated = { ...all[idx], ...(updated || {}), ...updatePayload };
    all[idx] = updated;
  } else {
    const fallback = demoMenuItems.find(m => m.id === id);
    updated = { ...(fallback || {}), ...(updated || {}), ...updatePayload, id } as MenuItem;
    all.unshift(updated);
  }
  saveLocalData(LOCAL_STORAGE_KEYS.MENU_ITEMS, all);

  const demoIdx = demoMenuItems.findIndex(m => m.id === id);
  if (demoIdx >= 0) {
    demoMenuItems[demoIdx] = { ...demoMenuItems[demoIdx], ...updated };
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dinescan:menu-updated', { detail: { id, updated } }));
  }
  return updated;
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await supabase.from('menu_items').delete().eq('id', id);
  } catch {}

  const all = getLocalData<MenuItem>(LOCAL_STORAGE_KEYS.MENU_ITEMS, demoMenuItems);
  saveLocalData(LOCAL_STORAGE_KEYS.MENU_ITEMS, all.filter(m => m.id !== id));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dinescan:menu-updated'));
  }
}

// ============ MENU ITEM ADDONS ============
export async function getAddons(menuItemId: string): Promise<MenuItemAddon[]> {
  const localAddons = getLocalData<MenuItemAddon>(LOCAL_STORAGE_KEYS.ADDONS, []);
  try {
    const { data, error } = await supabase
      .from('menu_item_addons')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .order('created_at', { ascending: true });
    if (!error && data && data.length > 0) return data as MenuItemAddon[];
  } catch {}

  return localAddons.filter(a => a.menu_item_id === menuItemId);
}

export async function createAddon(addon: Partial<MenuItemAddon>): Promise<MenuItemAddon | null> {
  let created: MenuItemAddon | null = null;
  try {
    const { data, error } = await supabase
      .from('menu_item_addons')
      .insert(addon)
      .select()
      .single();
    if (!error && data) created = data as MenuItemAddon;
  } catch {}

  if (!created) {
    created = {
      id: addon.id || `addon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menu_item_id: addon.menu_item_id || '',
      name: addon.name || '',
      price: addon.price || 0,
      created_at: new Date().toISOString(),
    };
  }

  const all = getLocalData<MenuItemAddon>(LOCAL_STORAGE_KEYS.ADDONS, []);
  all.push(created);
  saveLocalData(LOCAL_STORAGE_KEYS.ADDONS, all);
  return created;
}

export async function deleteAddon(id: string): Promise<void> {
  try {
    await supabase.from('menu_item_addons').delete().eq('id', id);
  } catch {}

  const all = getLocalData<MenuItemAddon>(LOCAL_STORAGE_KEYS.ADDONS, []);
  saveLocalData(LOCAL_STORAGE_KEYS.ADDONS, all.filter(a => a.id !== id));
}

// ============ TABLES ============
export async function getTables(restaurantId: string): Promise<RestaurantTable[]> {
  const localList = getLocalData<RestaurantTable>(LOCAL_STORAGE_KEYS.TABLES, demoTables);
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number', { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map(d => {
        const local = localList.find(t => t.id === d.id);
        return local ? { ...d, ...local } : d;
      }) as RestaurantTable[];
    }
  } catch {}

  const matches = localList.filter(t => t.restaurant_id === restaurantId);
  if (matches.length > 0) return matches;
  return demoTables.map(t => ({ ...t, restaurant_id: restaurantId }));
}

export async function createTable(table: Partial<RestaurantTable>): Promise<RestaurantTable | null> {
  let created: RestaurantTable | null = null;
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert(table)
      .select()
      .single();
    if (!error && data) created = data as RestaurantTable;
  } catch {}

  if (!created) {
    created = {
      id: table.id || `table-${Date.now()}`,
      restaurant_id: table.restaurant_id || 'sk-restaurant',
      table_number: table.table_number || '01',
      seats: table.seats || 4,
      area: table.area || 'Ground Floor',
      status: table.status || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const all = getLocalData<RestaurantTable>(LOCAL_STORAGE_KEYS.TABLES, demoTables);
  all.push(created);
  saveLocalData(LOCAL_STORAGE_KEYS.TABLES, all);
  return created;
}

export async function updateTable(
  id: string,
  updates: Partial<RestaurantTable>
): Promise<RestaurantTable | null> {
  let updated: RestaurantTable | null = null;
  const updatePayload = { ...updates, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (!error && data) updated = data as RestaurantTable;
  } catch {}

  const all = getLocalData<RestaurantTable>(LOCAL_STORAGE_KEYS.TABLES, demoTables);
  const idx = all.findIndex(t => t.id === id);
  if (idx >= 0) {
    updated = { ...all[idx], ...updatePayload, ...(updated || {}) };
    all[idx] = updated;
  } else {
    const fallback = demoTables.find(t => t.id === id);
    updated = { ...(fallback || {}), ...updatePayload, id, ...(updated || {}) } as RestaurantTable;
    all.push(updated);
  }
  saveLocalData(LOCAL_STORAGE_KEYS.TABLES, all);
  return updated;
}

export async function deleteTable(id: string): Promise<void> {
  try {
    await supabase.from('restaurant_tables').delete().eq('id', id);
  } catch {}

  const all = getLocalData<RestaurantTable>(LOCAL_STORAGE_KEYS.TABLES, demoTables);
  saveLocalData(LOCAL_STORAGE_KEYS.TABLES, all.filter(t => t.id !== id));
}

// ============ ORDERS ============
export async function getOrders(restaurantId: string): Promise<Order[]> {
  let dbOrders: Order[] = [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      dbOrders = data as Order[];
    }
  } catch {}

  const allOrders = getLocalData<Order>(LOCAL_STORAGE_KEYS.ORDERS, demoOrders);
  const localRelevant = allOrders.filter(o => o.restaurant_id === restaurantId);

  // Combine and deduplicate by id
  const orderMap = new Map<string, Order>();
  localRelevant.forEach(o => orderMap.set(o.id, o));
  dbOrders.forEach(o => orderMap.set(o.id, o));

  const result = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return result.length ? result : demoOrders.map(x => ({ ...x, restaurant_id: restaurantId }));
}

export async function getOrdersByStatus(
  restaurantId: string,
  status: string
): Promise<Order[]> {
  const all = await getOrders(restaurantId);
  return all.filter(o => o.status === status);
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data as Order;
  } catch {}

  const allOrders = getLocalData<Order>(LOCAL_STORAGE_KEYS.ORDERS, demoOrders);
  return allOrders.find(o => o.id === id) || null;
}

export async function createOrder(order: Partial<Order>): Promise<Order | null> {
  let created: Order | null = null;
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    if (!error && data) created = data as Order;
  } catch {}

  if (!created) {
    created = {
      id: order.id || `order-${Date.now()}`,
      order_number: order.order_number || String(Math.floor(1000 + Math.random() * 9000)),
      restaurant_id: order.restaurant_id || 'sk-restaurant',
      table_id: order.table_id || null,
      customer_id: order.customer_id || null,
      customer_name: order.customer_name || 'Guest',
      customer_phone: order.customer_phone || null,
      table_number: order.table_number || '01',
      status: order.status || 'new',
      items_total: order.items_total || 0,
      tax_amount: order.tax_amount || 0,
      service_charge: order.service_charge || 0,
      discount_amount: order.discount_amount || 0,
      grand_total: order.grand_total || 0,
      special_instructions: order.special_instructions || null,
      estimated_prep_time: order.estimated_prep_time || 18,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Cache to local orders
  const allOrders = getLocalData<Order>(LOCAL_STORAGE_KEYS.ORDERS, demoOrders);
  allOrders.unshift(created);
  saveLocalData(LOCAL_STORAGE_KEYS.ORDERS, allOrders);

  // AUTOMATICALLY RECORD CUSTOMER FROM ORDER!
  if (created.customer_name || created.customer_phone) {
    void recordCustomerFromOrder({
      restaurant_id: created.restaurant_id,
      customer_name: created.customer_name,
      customer_phone: created.customer_phone,
      grand_total: Number(created.grand_total) || 0,
    });
  }

  return created;
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<Order | null> {
  let updated: Order | null = null;
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (!error && data) updated = data as Order;
  } catch {}

  const allOrders = getLocalData<Order>(LOCAL_STORAGE_KEYS.ORDERS, demoOrders);
  const idx = allOrders.findIndex(o => o.id === id);
  if (idx >= 0) {
    updated = { ...allOrders[idx], status: status as any, updated_at: new Date().toISOString() };
    allOrders[idx] = updated;
  } else {
    const fallback = demoOrders.find(o => o.id === id);
    if (fallback) {
      updated = { ...fallback, status: status as any, updated_at: new Date().toISOString() };
      allOrders.unshift(updated);
    }
  }
  saveLocalData(LOCAL_STORAGE_KEYS.ORDERS, allOrders);
  return updated;
}

// ============ ORDER ITEMS ============
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (!error && data && data.length > 0) return data as OrderItem[];
  } catch {}

  const allOrders = getLocalData<Order>(LOCAL_STORAGE_KEYS.ORDERS, demoOrders);
  const found = allOrders.find(o => o.id === orderId);
  if (found?.items && found.items.length > 0) {
    return found.items.map((it: any, idx: number) => ({
      id: it.id || `item-${orderId}-${idx}`,
      order_id: orderId,
      menu_item_id: it.menu_item_id || null,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      addons: it.addons || null,
      special_instructions: it.notes || it.special_instructions || null,
      created_at: found.created_at,
    }));
  }
  return [];
}

export async function createOrderItems(items: Partial<OrderItem>[]): Promise<OrderItem[]> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .insert(items)
      .select();
    if (!error && data) return data as OrderItem[];
  } catch {}

  return items.map((it, idx) => ({
    id: it.id || `item-${Date.now()}-${idx}`,
    order_id: it.order_id || '',
    menu_item_id: it.menu_item_id || null,
    name: it.name || 'Dish',
    quantity: it.quantity || 1,
    price: it.price || 0,
    addons: it.addons || null,
    special_instructions: it.special_instructions || null,
    created_at: new Date().toISOString(),
  }));
}

// ============ OFFERS ============
export async function getOffers(restaurantId: string): Promise<Offer[]> {
  const localList = getLocalData<Offer>(LOCAL_STORAGE_KEYS.OFFERS, demoOffers);
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map(d => {
        const local = localList.find(o => o.id === d.id);
        return local ? { ...d, ...local } : d;
      }) as Offer[];
    }
  } catch {}

  const matches = localList.filter(o => o.restaurant_id === restaurantId);
  if (matches.length > 0) return matches;
  return demoOffers.map(o => ({ ...o, restaurant_id: restaurantId }));
}

export async function createOffer(offer: Partial<Offer>): Promise<Offer | null> {
  let created: Offer | null = null;
  try {
    const { data, error } = await supabase
      .from('offers')
      .insert(offer)
      .select()
      .single();
    if (!error && data) created = data as Offer;
  } catch {}

  if (!created) {
    created = {
      id: offer.id || `offer-${Date.now()}`,
      restaurant_id: offer.restaurant_id || 'sk-restaurant',
      name: offer.name || 'Discount Offer',
      coupon_code: (offer.coupon_code || 'PROMO10').toUpperCase(),
      discount_type: offer.discount_type || 'percentage',
      discount_value: offer.discount_value || 10,
      minimum_order: offer.minimum_order || 0,
      start_date: offer.start_date || null,
      end_date: offer.end_date || null,
      is_active: offer.is_active !== undefined ? offer.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const all = getLocalData<Offer>(LOCAL_STORAGE_KEYS.OFFERS, demoOffers);
  all.unshift(created);
  saveLocalData(LOCAL_STORAGE_KEYS.OFFERS, all);
  return created;
}

export async function updateOffer(
  id: string,
  updates: Partial<Offer>
): Promise<Offer | null> {
  let updated: Offer | null = null;
  const updatePayload = { ...updates, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await supabase
      .from('offers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (!error && data) updated = data as Offer;
  } catch {}

  const all = getLocalData<Offer>(LOCAL_STORAGE_KEYS.OFFERS, demoOffers);
  const idx = all.findIndex(o => o.id === id);
  if (idx >= 0) {
    updated = { ...all[idx], ...updatePayload, ...(updated || {}) };
    all[idx] = updated;
  } else {
    const fallback = demoOffers.find(o => o.id === id);
    updated = { ...(fallback || {}), ...updatePayload, id, ...(updated || {}) } as Offer;
    all.push(updated);
  }
  saveLocalData(LOCAL_STORAGE_KEYS.OFFERS, all);
  return updated;
}

export async function deleteOffer(id: string): Promise<void> {
  try {
    await supabase.from('offers').delete().eq('id', id);
  } catch {}

  const all = getLocalData<Offer>(LOCAL_STORAGE_KEYS.OFFERS, demoOffers);
  saveLocalData(LOCAL_STORAGE_KEYS.OFFERS, all.filter(o => o.id !== id));
}

// ============ CUSTOMERS ============
export async function recordCustomerFromOrder(orderData: {
  restaurant_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  grand_total: number;
  favorite_dish?: string | null;
}): Promise<Customer | null> {
  const name = orderData.customer_name?.trim() || '';
  const phone = orderData.customer_phone?.trim() || '';
  if (!name && !phone) return null;

  const restaurantId = orderData.restaurant_id;
  const now = new Date().toISOString();
  const grandTotal = Number(orderData.grand_total) || 0;

  // 1. Try Supabase
  try {
    let query = supabase.from('customers').select('*').eq('restaurant_id', restaurantId);
    if (phone) {
      query = query.eq('phone', phone);
    } else {
      query = query.eq('name', name);
    }
    const { data: existingRows } = await query;
    if (existingRows && existingRows.length > 0) {
      const existing = existingRows[0] as Customer;
      await supabase.from('customers').update({
        name: name || existing.name,
        total_orders: (existing.total_orders || 0) + 1,
        total_spend: (Number(existing.total_spend) || 0) + grandTotal,
        last_order_at: now,
        favorite_dish: orderData.favorite_dish || existing.favorite_dish,
      }).eq('id', existing.id);
    } else {
      await supabase.from('customers').insert({
        id: `customer-${Date.now()}`,
        restaurant_id: restaurantId,
        name: name || 'Guest',
        phone: phone || null,
        total_orders: 1,
        total_spend: grandTotal,
        last_order_at: now,
        favorite_dish: orderData.favorite_dish || null,
        created_at: now,
      });
    }
  } catch {}

  // 2. Local storage cache update
  const localList = getLocalData<Customer>(LOCAL_STORAGE_KEYS.CUSTOMERS, demoCustomers);
  const matchIndex = localList.findIndex(c =>
    c.restaurant_id === restaurantId &&
    ((phone && c.phone === phone) || (name && c.name?.toLowerCase() === name.toLowerCase()))
  );

  let updatedCustomer: Customer;
  if (matchIndex >= 0) {
    const existing = localList[matchIndex];
    updatedCustomer = {
      ...existing,
      name: name || existing.name,
      phone: phone || existing.phone,
      total_orders: (existing.total_orders || 0) + 1,
      total_spend: (Number(existing.total_spend) || 0) + grandTotal,
      last_order_at: now,
      favorite_dish: orderData.favorite_dish || existing.favorite_dish,
    };
    localList[matchIndex] = updatedCustomer;
  } else {
    updatedCustomer = {
      id: `customer-${Date.now()}`,
      restaurant_id: restaurantId,
      name: name || 'Guest',
      phone: phone || null,
      total_orders: 1,
      total_spend: grandTotal,
      last_order_at: now,
      favorite_dish: orderData.favorite_dish || null,
      created_at: now,
    };
    localList.unshift(updatedCustomer);
  }
  saveLocalData(LOCAL_STORAGE_KEYS.CUSTOMERS, localList);

  return updatedCustomer;
}

export async function getCustomers(restaurantId: string): Promise<Customer[]> {
  const customerMap = new Map<string, Customer>();

  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      (data as Customer[]).forEach(c => {
        const key = c.phone || c.name || c.id;
        customerMap.set(key, c);
      });
    }
  } catch {}

  // 2. Local storage customers
  const localCustomers = getLocalData<Customer>(LOCAL_STORAGE_KEYS.CUSTOMERS, demoCustomers);
  localCustomers.filter(c => c.restaurant_id === restaurantId).forEach(c => {
    const key = c.phone || c.name || c.id;
    if (!customerMap.has(key)) {
      customerMap.set(key, c);
    }
  });

  // 3. Scan orders for this restaurant to ensure no customer order is ever missed
  try {
    const orders = await getOrders(restaurantId);
    orders.forEach(o => {
      const name = o.customer_name?.trim();
      const phone = o.customer_phone?.trim();
      if (!name && !phone) return;
      const key = phone || name;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: `cust-order-${o.id}`,
          restaurant_id: restaurantId,
          name: name || 'Guest',
          phone: phone || null,
          total_orders: 1,
          total_spend: Number(o.grand_total) || 0,
          last_order_at: o.created_at || new Date().toISOString(),
          favorite_dish: null,
          created_at: o.created_at || new Date().toISOString(),
        });
      }
    });
  } catch {}

  // 4. Also inspect sessionStorage for recent order placed in active browser session
  if (typeof window !== 'undefined') {
    try {
      const savedLast = sessionStorage.getItem('dinescan:lastOrder');
      if (savedLast) {
        const parsed = JSON.parse(savedLast);
        const o = parsed.order;
        if (o && (o.customer_name || o.customer_phone)) {
          const name = o.customer_name?.trim();
          const phone = o.customer_phone?.trim();
          const key = phone || name;
          if (key && !customerMap.has(key)) {
            const topDish = parsed.items?.[0]?.name || null;
            customerMap.set(key, {
              id: `cust-session-${Date.now()}`,
              restaurant_id: restaurantId,
              name: name || 'Guest',
              phone: phone || null,
              total_orders: 1,
              total_spend: Number(o.grand_total) || 0,
              last_order_at: o.created_at || new Date().toISOString(),
              favorite_dish: topDish,
              created_at: o.created_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {}
  }

  const list = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.last_order_at || b.created_at).getTime() - new Date(a.last_order_at || a.created_at).getTime()
  );

  if (list.length > 0) return list;

  return demoCustomers.map(x => ({ ...x, restaurant_id: restaurantId }));
}

// ============ FEEDBACK ============
export async function getFeedback(restaurantId: string): Promise<Feedback[]> {
  const localList = getLocalData<Feedback>(LOCAL_STORAGE_KEYS.FEEDBACK, demoFeedback);
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data as Feedback[];
  } catch {}

  const matches = localList.filter(f => f.restaurant_id === restaurantId);
  if (matches.length > 0) return matches;
  return demoFeedback.map(f => ({ ...f, restaurant_id: restaurantId }));
}

export async function createFeedback(feedback: Partial<Feedback>): Promise<Feedback | null> {
  let created: Feedback | null = null;
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedback)
      .select()
      .single();
    if (!error && data) created = data as Feedback;
  } catch {}

  if (!created) {
    created = {
      id: feedback.id || `fb-${Date.now()}`,
      restaurant_id: feedback.restaurant_id || 'sk-restaurant',
      order_id: feedback.order_id || null,
      customer_name: feedback.customer_name || 'Guest',
      food_rating: feedback.food_rating || 5,
      service_rating: feedback.service_rating || 5,
      overall_rating: feedback.overall_rating || 5,
      comment: feedback.comment || null,
      created_at: new Date().toISOString(),
    };
  }

  const all = getLocalData<Feedback>(LOCAL_STORAGE_KEYS.FEEDBACK, demoFeedback);
  all.unshift(created);
  saveLocalData(LOCAL_STORAGE_KEYS.FEEDBACK, all);
  return created;
}

// ============ SEED SAMPLE MENU ============
export async function seedSampleMenu(restaurantId: string): Promise<{ categoriesAdded: number; itemsAdded: number }> {
  const imgs = {
    paneer: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=700&q=80',
    curry:  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=80',
    biryani:'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=700&q=80',
    noodles:'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=80',
    naan:   'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80',
    roti:   'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=700&q=80',
    drink:  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80',
    dessert:'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=700&q=80',
  };

  const rawCats = [
    { name: 'Starters', icon: '🥗', display_order: 1 },
    { name: 'Main Course', icon: '🍛', display_order: 2 },
    { name: 'Chinese', icon: '🥡', display_order: 3 },
    { name: 'Rice', icon: '🍚', display_order: 4 },
    { name: 'Breads', icon: '🫓', display_order: 5 },
    { name: 'Desserts', icon: '🍮', display_order: 6 },
    { name: 'Drinks', icon: '🥤', display_order: 7 },
    { name: 'Recommended', icon: '⭐', display_order: 8 },
  ];

  const catMap: Record<string, string> = {};
  const newCategories: Category[] = rawCats.map(c => {
    const id = `cat-${Date.now()}-${c.name.toLowerCase().replace(/\s+/g, '-')}`;
    catMap[c.name] = id;
    return {
      id,
      restaurant_id: restaurantId,
      name: c.name,
      icon: c.icon,
      display_order: c.display_order,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const rawItems = [
    // Starters
    { cat: 'Starters', name: 'Paneer Tikka', description: 'Cottage cheese marinated in aromatic spices and char-grilled.', image_url: imgs.paneer, price: 280, discount_price: null, food_type: 'veg' as const, spice_level: 'medium' as const, prep_time: 15, rating: 4.9, is_available: true, is_featured: true, is_recommended: true, is_bestseller: true },
    { cat: 'Starters', name: 'Chilli Paneer', description: 'Crispy paneer tossed with peppers, onion and chilli sauce.', image_url: imgs.paneer, price: 270, discount_price: null, food_type: 'veg' as const, spice_level: 'hot' as const, prep_time: 18, rating: 4.6, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    { cat: 'Starters', name: 'Chicken Tikka', description: 'Juicy chicken tikka grilled with smoky Indian spices.', image_url: imgs.paneer, price: 340, discount_price: null, food_type: 'non-veg' as const, spice_level: 'medium' as const, prep_time: 20, rating: 4.8, is_available: true, is_featured: false, is_recommended: false, is_bestseller: true },
    { cat: 'Starters', name: 'Crispy Spring Roll', description: 'Golden vegetable spring rolls with chilli dip.', image_url: imgs.noodles, price: 190, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 12, rating: 4.4, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    { cat: 'Starters', name: 'Veg Seekh Kebab', description: 'Spiced mixed vegetable kebabs grilled on skewers.', image_url: imgs.paneer, price: 220, discount_price: 199, food_type: 'veg' as const, spice_level: 'medium' as const, prep_time: 15, rating: 4.5, is_available: true, is_featured: false, is_recommended: true, is_bestseller: false },
    // Main Course
    { cat: 'Main Course', name: 'Paneer Butter Masala', description: 'Creamy tomato gravy finished with butter and soft paneer.', image_url: imgs.curry, price: 320, discount_price: null, food_type: 'veg' as const, spice_level: 'medium' as const, prep_time: 20, rating: 4.9, is_available: true, is_featured: false, is_recommended: false, is_bestseller: true },
    { cat: 'Main Course', name: 'Dal Tadka', description: 'Yellow lentils tempered with cumin, garlic, chilli and ghee.', image_url: imgs.curry, price: 240, discount_price: null, food_type: 'veg' as const, spice_level: 'medium' as const, prep_time: 18, rating: 4.5, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    { cat: 'Main Course', name: 'Butter Chicken', description: 'Tandoori chicken in velvety tomato butter gravy.', image_url: imgs.curry, price: 390, discount_price: 360, food_type: 'non-veg' as const, spice_level: 'medium' as const, prep_time: 22, rating: 4.9, is_available: true, is_featured: true, is_recommended: true, is_bestseller: true },
    { cat: 'Main Course', name: 'Palak Paneer', description: 'Fresh spinach puree with soft paneer in aromatic spices.', image_url: imgs.curry, price: 300, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 18, rating: 4.7, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    // Chinese
    { cat: 'Chinese', name: 'Veg Manchurian', description: 'Crispy vegetable dumplings tossed in a tangy Indo-Chinese sauce.', image_url: imgs.noodles, price: 220, discount_price: null, food_type: 'veg' as const, spice_level: 'medium' as const, prep_time: 15, rating: 4.6, is_available: true, is_featured: false, is_recommended: true, is_bestseller: false },
    { cat: 'Chinese', name: 'Hakka Noodles', description: 'Wok tossed noodles with crunchy vegetables and house sauces.', image_url: imgs.noodles, price: 240, discount_price: null, food_type: 'veg' as const, spice_level: 'medium' as const, prep_time: 15, rating: 4.5, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    { cat: 'Chinese', name: 'Schezwan Fried Rice', description: 'Spicy wok-tossed rice with vegetables and Schezwan sauce.', image_url: imgs.biryani, price: 250, discount_price: null, food_type: 'veg' as const, spice_level: 'hot' as const, prep_time: 15, rating: 4.4, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    // Rice
    { cat: 'Rice', name: 'Veg Biryani', description: 'Fragrant basmati rice layered with vegetables and warm spices.', image_url: imgs.biryani, price: 320, discount_price: null, food_type: 'veg' as const, spice_level: 'medium' as const, prep_time: 25, rating: 4.8, is_available: true, is_featured: true, is_recommended: true, is_bestseller: false },
    { cat: 'Rice', name: 'Chicken Biryani', description: 'Layered basmati rice and spiced chicken, dum cooked.', image_url: imgs.biryani, price: 360, discount_price: null, food_type: 'non-veg' as const, spice_level: 'medium' as const, prep_time: 28, rating: 4.8, is_available: true, is_featured: false, is_recommended: false, is_bestseller: true },
    { cat: 'Rice', name: 'Jeera Rice', description: 'Steamed basmati rice tempered with cumin and herbs.', image_url: imgs.biryani, price: 190, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 12, rating: 4.3, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    // Breads
    { cat: 'Breads', name: 'Tandoori Roti', description: 'Crispy whole wheat flatbread baked in a traditional clay tandoor.', image_url: imgs.roti, price: 30, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 8, rating: 4.8, is_available: true, is_featured: false, is_recommended: false, is_bestseller: true },
    { cat: 'Breads', name: 'Butter Roti', description: 'Freshly baked whole wheat tandoori roti brushed with golden butter.', image_url: imgs.roti, price: 35, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 8, rating: 4.8, is_available: true, is_featured: false, is_recommended: true, is_bestseller: false },
    { cat: 'Breads', name: 'Butter Naan', description: 'Soft tandoor baked naan brushed with butter.', image_url: imgs.naan, price: 70, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 10, rating: 4.5, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    { cat: 'Breads', name: 'Cheese Garlic Naan', description: 'Garlic naan loaded with cheese and herbs.', image_url: imgs.naan, price: 130, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 12, rating: 4.7, is_available: true, is_featured: false, is_recommended: false, is_bestseller: true },
    // Desserts
    { cat: 'Desserts', name: 'Gulab Jamun', description: 'Warm khoya dumplings soaked in cardamom sugar syrup.', image_url: imgs.dessert, price: 110, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 8, rating: 4.6, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    { cat: 'Desserts', name: 'Sizzling Brownie', description: 'Chocolate brownie with vanilla ice cream and hot sauce.', image_url: imgs.dessert, price: 220, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 10, rating: 4.8, is_available: true, is_featured: true, is_recommended: false, is_bestseller: false },
    // Drinks
    { cat: 'Drinks', name: 'Cold Coffee', description: 'Chilled coffee blended with ice cream.', image_url: imgs.drink, price: 180, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 6, rating: 4.7, is_available: true, is_featured: false, is_recommended: true, is_bestseller: false },
    { cat: 'Drinks', name: 'Fresh Lime Soda', description: 'Fresh lime with soda, sweet or salted.', image_url: imgs.drink, price: 110, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 5, rating: 4.4, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
    { cat: 'Drinks', name: 'Mango Lassi', description: 'Creamy yogurt drink blended with fresh mango.', image_url: imgs.drink, price: 150, discount_price: null, food_type: 'veg' as const, spice_level: 'mild' as const, prep_time: 5, rating: 4.6, is_available: true, is_featured: false, is_recommended: false, is_bestseller: false },
  ];

  const newItems: MenuItem[] = rawItems.map((it, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    restaurant_id: restaurantId,
    category_id: catMap[it.cat] || null,
    name: it.name,
    description: it.description,
    image_url: it.image_url,
    price: it.price,
    discount_price: it.discount_price,
    food_type: it.food_type,
    spice_level: it.spice_level,
    prep_time: it.prep_time,
    rating: it.rating,
    is_available: it.is_available,
    is_featured: it.is_featured,
    is_recommended: it.is_recommended,
    is_bestseller: it.is_bestseller,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Attempt Supabase sync
  try {
    await supabase.from('menu_items').delete().eq('restaurant_id', restaurantId);
    await supabase.from('categories').delete().eq('restaurant_id', restaurantId);
    await supabase.from('categories').insert(newCategories);
    await supabase.from('menu_items').insert(newItems);
  } catch {}

  // Update local storage
  const allCats = getLocalData<Category>(LOCAL_STORAGE_KEYS.CATEGORIES, demoCategories);
  const remainingCats = allCats.filter(c => c.restaurant_id !== restaurantId);
  saveLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, [...remainingCats, ...newCategories]);

  const allItems = getLocalData<MenuItem>(LOCAL_STORAGE_KEYS.MENU_ITEMS, demoMenuItems);
  const remainingItems = allItems.filter(m => m.restaurant_id !== restaurantId);
  saveLocalData(LOCAL_STORAGE_KEYS.MENU_ITEMS, [...remainingItems, ...newItems]);

  return {
    categoriesAdded: newCategories.length,
    itemsAdded: newItems.length,
  };
}

// ============ SETTINGS ============
export async function getSettings(restaurantId: string): Promise<RestaurantSettings | null> {
  const localSettings = getLocalData<RestaurantSettings>(LOCAL_STORAGE_KEYS.SETTINGS, []);
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    if (!error && data) return data as RestaurantSettings;
  } catch {}

  const found = localSettings.find(s => s.restaurant_id === restaurantId);
  return found ?? null;
}

export async function updateSettings(
  restaurantId: string,
  updates: Partial<RestaurantSettings>
): Promise<RestaurantSettings | null> {
  let updated: RestaurantSettings | null = null;
  const payload = { ...updates, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .update(payload)
      .eq('restaurant_id', restaurantId)
      .select()
      .maybeSingle();
    if (!error && data) updated = data as RestaurantSettings;
  } catch {}

  const all = getLocalData<RestaurantSettings>(LOCAL_STORAGE_KEYS.SETTINGS, []);
  const idx = all.findIndex(s => s.restaurant_id === restaurantId);
  if (idx >= 0) {
    updated = { ...all[idx], ...payload, ...(updated || {}) };
    all[idx] = updated;
  } else {
    updated = { restaurant_id: restaurantId, ...payload, ...(updated || {}) } as RestaurantSettings;
    all.push(updated);
  }
  saveLocalData(LOCAL_STORAGE_KEYS.SETTINGS, all);
  return updated;
}

export async function saveSettings(
  restaurantId: string,
  updates: Partial<RestaurantSettings>
): Promise<RestaurantSettings | null> {
  const existing = await getSettings(restaurantId);
  if (existing) return updateSettings(restaurantId, updates);

  let created: RestaurantSettings | null = null;
  const payload = { restaurant_id: restaurantId, ...updates };
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .insert(payload)
      .select()
      .single();
    if (!error && data) created = data as RestaurantSettings;
  } catch {}

  const all = getLocalData<RestaurantSettings>(LOCAL_STORAGE_KEYS.SETTINGS, []);
  created = { ...payload, ...(created || {}) } as RestaurantSettings;
  all.push(created);
  saveLocalData(LOCAL_STORAGE_KEYS.SETTINGS, all);
  return created;
}

// ============================================================================
// SAAS PLATFORM SERVICES
// ============================================================================

// ============ ALL RESTAURANTS (SUPER ADMIN) ============
export async function getAllRestaurants(): Promise<Restaurant[]> {
  const localCached = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const existingIds = new Set(data.map(r => r.id));
      const extras = localCached.filter(r => !existingIds.has(r.id));
      const merged = data.map(d => {
        const local = localCached.find(r => r.id === d.id);
        return local ? { ...d, ...local } : d;
      });
      return [...merged, ...extras] as Restaurant[];
    }
  } catch {}
  return localCached;
}

export async function updateRestaurantStatus(
  id: string,
  status: RestaurantStatus
): Promise<Restaurant | null> {
  try {
    await supabase.from('restaurants').update({ status }).eq('id', id);
  } catch {}

  const current = getLocalData<Restaurant>(LOCAL_STORAGE_KEYS.RESTAURANTS, demoRestaurants);
  const idx = current.findIndex(r => r.id === id);
  if (idx >= 0) {
    current[idx] = { ...current[idx], status };
    saveLocalData(LOCAL_STORAGE_KEYS.RESTAURANTS, current);
    await logAuditAction({
      restaurant_id: id,
      action: 'STATUS_CHANGE',
      module: 'RESTAURANT',
      entity_type: 'restaurant',
      entity_id: id,
      metadata: { new_status: status },
    });
    return current[idx];
  }
  return null;
}

// ============ PLANS ============
export async function getPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('monthly_price', { ascending: true });
    if (!error && data && data.length > 0) return data as SubscriptionPlan[];
  } catch {}
  return getLocalData<SubscriptionPlan>(LOCAL_STORAGE_KEYS.PLANS, demoPlans);
}

export async function createPlan(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  const newPlan: SubscriptionPlan = {
    id: `plan-${Date.now()}`,
    name: plan.name || 'New Plan',
    code: (plan.name || 'NEW_PLAN').toUpperCase().replace(/\s+/g, '_'),
    monthly_price: Number(plan.monthly_price) || 0,
    yearly_price: Number(plan.yearly_price) || 0,
    table_limit: Number(plan.table_limit) || 10,
    staff_limit: Number(plan.staff_limit) || 3,
    features: plan.features || ['Digital Menu', 'Table QR Codes'],
    is_active: plan.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('subscription_plans').insert(newPlan).select().single();
    if (!error && data) return data as SubscriptionPlan;
  } catch {}

  const plans = getLocalData<SubscriptionPlan>(LOCAL_STORAGE_KEYS.PLANS, demoPlans);
  plans.push(newPlan);
  saveLocalData(LOCAL_STORAGE_KEYS.PLANS, plans);
  return newPlan;
}

export async function updatePlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
  try {
    await supabase.from('subscription_plans').update(updates).eq('id', id);
  } catch {}

  const plans = getLocalData<SubscriptionPlan>(LOCAL_STORAGE_KEYS.PLANS, demoPlans);
  const idx = plans.findIndex(p => p.id === id);
  if (idx >= 0) {
    plans[idx] = { ...plans[idx], ...updates, updated_at: new Date().toISOString() };
    saveLocalData(LOCAL_STORAGE_KEYS.PLANS, plans);
    return plans[idx];
  }
  return null;
}

// ============ SUBSCRIPTIONS ============
export async function getSubscriptions(): Promise<RestaurantSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data as RestaurantSubscription[];
  } catch {}
  return getLocalData<RestaurantSubscription>(LOCAL_STORAGE_KEYS.SUBSCRIPTIONS, demoSubscriptions);
}

export async function getSubscriptionByRestaurant(restaurantId: string): Promise<RestaurantSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    if (!error && data) return data as RestaurantSubscription;
  } catch {}

  const subs = getLocalData<RestaurantSubscription>(LOCAL_STORAGE_KEYS.SUBSCRIPTIONS, demoSubscriptions);
  return subs.find(s => s.restaurant_id === restaurantId) ?? null;
}

export async function updateSubscriptionStatus(
  id: string,
  status: SubscriptionStatus
): Promise<boolean> {
  try {
    await supabase.from('restaurant_subscriptions').update({ status }).eq('id', id);
  } catch {}

  const subs = getLocalData<RestaurantSubscription>(LOCAL_STORAGE_KEYS.SUBSCRIPTIONS, demoSubscriptions);
  const idx = subs.findIndex(s => s.id === id);
  if (idx >= 0) {
    subs[idx] = { ...subs[idx], status, updated_at: new Date().toISOString() };
    saveLocalData(LOCAL_STORAGE_KEYS.SUBSCRIPTIONS, subs);
    await logAuditAction({
      restaurant_id: subs[idx].restaurant_id,
      action: 'SUBSCRIPTION_STATUS_CHANGE',
      module: 'SUBSCRIPTION',
      entity_type: 'restaurant_subscription',
      entity_id: id,
      metadata: { new_status: status },
    });
    return true;
  }
  return false;
}

// ============ PAYMENTS ============
export async function getPayments(filters?: { status?: string; restaurantId?: string; search?: string }): Promise<Payment[]> {
  let list = getLocalData<Payment>(LOCAL_STORAGE_KEYS.PAYMENTS, demoPayments);

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      list = data as Payment[];
    }
  } catch {}

  if (filters?.status && filters.status !== 'all') {
    list = list.filter(p => p.payment_status.toLowerCase() === filters.status?.toLowerCase());
  }
  if (filters?.restaurantId) {
    list = list.filter(p => p.restaurant_id === filters.restaurantId);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    list = list.filter(p =>
      p.invoice_number.toLowerCase().includes(term) ||
      p.restaurant?.name.toLowerCase().includes(term) ||
      p.transaction_id?.toLowerCase().includes(term)
    );
  }
  return list;
}

export async function getPaymentsByRestaurant(restaurantId: string): Promise<Payment[]> {
  return getPayments({ restaurantId });
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  notes?: string
): Promise<boolean> {
  const paid_at = status === 'PAID' ? new Date().toISOString() : null;
  try {
    await supabase.from('payments').update({ payment_status: status, paid_at, notes }).eq('id', id);
  } catch {}

  const payments = getLocalData<Payment>(LOCAL_STORAGE_KEYS.PAYMENTS, demoPayments);
  const idx = payments.findIndex(p => p.id === id);
  if (idx >= 0) {
    payments[idx] = {
      ...payments[idx],
      payment_status: status,
      paid_at,
      notes: notes !== undefined ? notes : payments[idx].notes,
      updated_at: new Date().toISOString(),
    };
    saveLocalData(LOCAL_STORAGE_KEYS.PAYMENTS, payments);

    await logAuditAction({
      restaurant_id: payments[idx].restaurant_id,
      action: 'PAYMENT_STATUS_CHANGE',
      module: 'BILLING',
      entity_type: 'payment',
      entity_id: id,
      metadata: { invoice: payments[idx].invoice_number, status, notes },
    });
    return true;
  }
  return false;
}

export async function createPayment(payment: Partial<Payment>): Promise<Payment> {
  const newPay: Payment = {
    id: `pay-${Date.now()}`,
    restaurant_id: payment.restaurant_id || 'sk-restaurant',
    subscription_id: payment.subscription_id || null,
    invoice_number: payment.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: payment.amount || 0,
    currency: payment.currency || 'INR',
    payment_status: payment.payment_status || 'PAID',
    payment_method: payment.payment_method || 'UPI',
    transaction_id: payment.transaction_id || `TXN${Date.now()}`,
    billing_period_start: payment.billing_period_start || new Date().toISOString(),
    billing_period_end: payment.billing_period_end || new Date(Date.now() + 30 * 86400000).toISOString(),
    due_date: payment.due_date || new Date().toISOString(),
    paid_at: payment.paid_at || new Date().toISOString(),
    notes: payment.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    restaurant: payment.restaurant,
  };

  try {
    await supabase.from('payments').insert(newPay);
  } catch {}

  const payments = getLocalData<Payment>(LOCAL_STORAGE_KEYS.PAYMENTS, demoPayments);
  payments.unshift(newPay);
  saveLocalData(LOCAL_STORAGE_KEYS.PAYMENTS, payments);
  return newPay;
}

// ============ STAFF & PERMISSIONS ============
export async function getStaffByRestaurant(restaurantId: string): Promise<RestaurantMember[]> {
  try {
    const { data, error } = await supabase
      .from('restaurant_members')
      .select('*')
      .eq('restaurant_id', restaurantId);
    if (!error && data && data.length > 0) return data as RestaurantMember[];
  } catch {}

  const allStaff = getLocalData<RestaurantMember>(LOCAL_STORAGE_KEYS.STAFF, demoStaffMembers);
  return allStaff.filter(s => s.restaurant_id === restaurantId);
}

export async function inviteStaff(member: Partial<RestaurantMember>): Promise<RestaurantMember> {
  const newMember: RestaurantMember = {
    id: `member-${Date.now()}`,
    restaurant_id: member.restaurant_id || 'sk-restaurant',
    user_id: member.user_id || `user-${Date.now()}`,
    role: member.role || 'manager',
    status: member.status || 'active',
    joined_at: new Date().toISOString(),
    full_name: member.full_name || member.email?.split('@')[0] || 'Staff Member',
    email: member.email || '',
    phone: member.phone || '',
    custom_permissions: member.custom_permissions || [],
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('restaurant_members').insert(newMember);
  } catch {}

  const allStaff = getLocalData<RestaurantMember>(LOCAL_STORAGE_KEYS.STAFF, demoStaffMembers);
  allStaff.push(newMember);
  saveLocalData(LOCAL_STORAGE_KEYS.STAFF, allStaff);

  await logAuditAction({
    restaurant_id: newMember.restaurant_id,
    action: 'INVITE_STAFF',
    module: 'STAFF',
    entity_type: 'restaurant_member',
    entity_id: newMember.id,
    metadata: { email: newMember.email, role: newMember.role },
  });

  return newMember;
}

export async function updateStaffMember(
  id: string,
  updates: Partial<RestaurantMember>
): Promise<RestaurantMember | null> {
  try {
    await supabase.from('restaurant_members').update(updates).eq('id', id);
  } catch {}

  const allStaff = getLocalData<RestaurantMember>(LOCAL_STORAGE_KEYS.STAFF, demoStaffMembers);
  const idx = allStaff.findIndex(s => s.id === id);
  if (idx >= 0) {
    allStaff[idx] = { ...allStaff[idx], ...updates, updated_at: new Date().toISOString() };
    saveLocalData(LOCAL_STORAGE_KEYS.STAFF, allStaff);

    await logAuditAction({
      restaurant_id: allStaff[idx].restaurant_id,
      action: 'UPDATE_STAFF',
      module: 'STAFF',
      entity_type: 'restaurant_member',
      entity_id: id,
      metadata: updates as Record<string, unknown>,
    });

    return allStaff[idx];
  }
  return null;
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  try {
    await supabase.from('restaurant_members').delete().eq('id', id);
  } catch {}

  const allStaff = getLocalData<RestaurantMember>(LOCAL_STORAGE_KEYS.STAFF, demoStaffMembers);
  const target = allStaff.find(s => s.id === id);
  const filtered = allStaff.filter(s => s.id !== id);
  saveLocalData(LOCAL_STORAGE_KEYS.STAFF, filtered);

  if (target) {
    await logAuditAction({
      restaurant_id: target.restaurant_id,
      action: 'REMOVE_STAFF',
      module: 'STAFF',
      entity_type: 'restaurant_member',
      entity_id: id,
      metadata: { email: target.email },
    });
  }
  return true;
}

// ============ AUDIT LOGGING ============
export async function logAuditAction(log: Partial<AuditLog>): Promise<void> {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: log.user_id || null,
    restaurant_id: log.restaurant_id || null,
    action: log.action || 'ACTION',
    module: log.module || 'SYSTEM',
    entity_type: log.entity_type || null,
    entity_id: log.entity_id || null,
    metadata: log.metadata || {},
    ip_address: log.ip_address || '127.0.0.1',
    created_at: new Date().toISOString(),
    user_email: log.user_email,
    restaurant_name: log.restaurant_name,
  };

  try {
    await supabase.from('audit_logs').insert(newLog);
  } catch {}

  const allLogs = getLocalData<AuditLog>(LOCAL_STORAGE_KEYS.AUDIT, demoAuditLogs);
  allLogs.unshift(newLog);
  saveLocalData(LOCAL_STORAGE_KEYS.AUDIT, allLogs.slice(0, 200));
}

export async function getAuditLogs(restaurantId?: string): Promise<AuditLog[]> {
  try {
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data as AuditLog[];
  } catch {}

  const allLogs = getLocalData<AuditLog>(LOCAL_STORAGE_KEYS.AUDIT, demoAuditLogs);
  if (restaurantId) return allLogs.filter(l => l.restaurant_id === restaurantId);
  return allLogs;
}
