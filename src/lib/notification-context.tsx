import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { supabase } from './supabase';
import { getOrders } from './services';
import type { AppNotification, Order } from '@/types';
import { formatCurrency } from './utils';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  testSound: () => void;
  latestBanner: AppNotification | null;
  dismissBanner: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API Ding-Dong Chime (100% offline, zero network delay, no external file)
export function playOrderChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: B5 (987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.45, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.warn('Audio chime could not be played:', err);
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('dinescan_sound_alerts') !== 'false';
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (!restaurantId) return [];
    try {
      const stored = localStorage.getItem(`dinescan_notifications_${restaurantId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [latestBanner, setLatestBanner] = useState<AppNotification | null>(null);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedOrderIdsRef = useRef<Set<string>>(new Set());

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('dinescan_sound_alerts', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  // Load notifications and initialize known order IDs when restaurant changes
  useEffect(() => {
    if (!restaurantId) {
      setNotifications([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`dinescan_notifications_${restaurantId}`);
      if (stored) {
        const parsed: AppNotification[] = JSON.parse(stored);
        setNotifications(parsed);
        parsed.forEach((n) => {
          if (n.order_id) notifiedOrderIdsRef.current.add(n.order_id);
        });
      }
    } catch {}

    // Seed notified order IDs from initial orders fetch
    void getOrders(restaurantId).then((existingOrders) => {
      existingOrders.forEach((o) => notifiedOrderIdsRef.current.add(o.id));
    });
  }, [restaurantId]);

  // Persist notifications to local storage
  const saveNotifications = useCallback(
    (updater: (prev: AppNotification[]) => AppNotification[]) => {
      setNotifications((prev) => {
        const next = updater(prev);
        if (restaurantId) {
          try {
            localStorage.setItem(`dinescan_notifications_${restaurantId}`, JSON.stringify(next.slice(0, 50)));
          } catch {}
        }
        return next;
      });
    },
    [restaurantId]
  );

  const dismissBanner = useCallback(() => {
    setLatestBanner(null);
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }, []);

  // Main handler when an order arrives from a QR scan or API
  const handleIncomingOrder = useCallback(
    (order: Order) => {
      if (!order || !order.id) return;
      // Ensure the order belongs to this active restaurant (or if not yet matched)
      if (restaurantId && order.restaurant_id && order.restaurant_id !== restaurantId) {
        return;
      }

      // Avoid duplicate alert for the same order
      if (notifiedOrderIdsRef.current.has(order.id)) {
        return;
      }
      notifiedOrderIdsRef.current.add(order.id);

      const tableLabel = order.table_number ? `Table ${order.table_number}` : 'Takeaway';
      const amountStr = order.grand_total ? formatCurrency(order.grand_total) : '';

      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        restaurant_id: order.restaurant_id || restaurantId || '',
        title: `🔔 New Order #${order.order_number || 'New'}!`,
        message: `${tableLabel} placed an order${amountStr ? ` • ${amountStr}` : ''}`,
        type: 'order',
        order_id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        amount: order.grand_total,
        created_at: order.created_at || new Date().toISOString(),
        read: false,
      };

      // Add to list
      saveNotifications((prev) => [newNotif, ...prev]);

      // Play chime sound if enabled
      if (soundEnabled) {
        playOrderChimeSound();
      }

      // Show floating notification banner
      setLatestBanner(newNotif);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setLatestBanner(null);
      }, 7000);

      // Trigger HTML5 desktop notification if supported
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(newNotif.title, {
            body: `${newNotif.message}\nClick to view in admin orders.`,
            icon: '/favicon.png',
          });
        } catch {}
      }
    },
    [restaurantId, soundEnabled, saveNotifications]
  );

  // Ask for browser notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        void Notification.requestPermission();
      } catch {}
    }
  }, []);

  // 1. Listen for local window CustomEvent ('dinescan:new_order')
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      if (customEvent.detail) {
        handleIncomingOrder(customEvent.detail);
      }
    };
    window.addEventListener('dinescan:new_order', handleCustomEvent);
    return () => window.removeEventListener('dinescan:new_order', handleCustomEvent);
  }, [handleIncomingOrder]);

  // 2. Listen across tabs using BroadcastChannel ('dinescan_orders_channel')
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('dinescan_orders_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'NEW_ORDER' && event.data.order) {
        handleIncomingOrder(event.data.order);
      }
    };
    return () => {
      try {
        bc.close();
      } catch {}
    };
  }, [handleIncomingOrder]);

  // 3. Supabase Realtime WebSocket subscription on 'orders' table
  useEffect(() => {
    if (!restaurantId) return;

    const channelName = `orders-realtime-${restaurantId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.new) {
            handleIncomingOrder(payload.new as Order);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurantId, handleIncomingOrder]);

  // 4. Fallback Polling every 5 seconds (ensures orders are NEVER missed)
  useEffect(() => {
    if (!restaurantId) return;

    const interval = setInterval(async () => {
      try {
        const rows = await getOrders(restaurantId);
        if (Array.isArray(rows)) {
          // Check for any order created in the last 2 minutes that hasn't been notified yet
          const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
          rows.forEach((o) => {
            const orderTime = new Date(o.created_at).getTime();
            if (orderTime > twoMinutesAgo && !notifiedOrderIdsRef.current.has(o.id)) {
              handleIncomingOrder(o);
            }
          });
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [restaurantId, handleIncomingOrder]);

  const markAsRead = useCallback(
    (id: string) => {
      saveNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    saveNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [saveNotifications]);

  const clearAll = useCallback(() => {
    saveNotifications(() => []);
  }, [saveNotifications]);

  const testSound = useCallback(() => {
    playOrderChimeSound();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        soundEnabled,
        setSoundEnabled,
        testSound,
        latestBanner,
        dismissBanner,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
