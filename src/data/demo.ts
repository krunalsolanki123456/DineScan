import type {
  Category, Customer, Feedback, MenuItem, Offer, Order, Restaurant, RestaurantTable,
  SubscriptionPlan, RestaurantSubscription, Payment, AuditLog, RestaurantMember,
} from '@/types';

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const futureDays = (days: number) => new Date(now + days * 86_400_000).toISOString();
const pastDays = (days: number) => new Date(now - days * 86_400_000).toISOString();

// ============ SUBSCRIPTION PLANS ============
export const demoPlans: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    code: 'STARTER',
    monthly_price: 299,
    yearly_price: 2990,
    table_limit: 10,
    staff_limit: 3,
    features: ['Digital QR Menu', 'Table QR Codes', '10 Tables Limit', '3 Staff Accounts', 'Basic Reports'],
    is_active: true,
    created_at: ago(150000),
    updated_at: ago(100),
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    code: 'PRO',
    monthly_price: 599,
    yearly_price: 5990,
    table_limit: 50,
    staff_limit: 10,
    features: ['Unlimited Menu Items', '50 Tables Limit', '10 Staff Accounts', 'Live Kitchen Display (KDS)', 'Advanced Reports & Export', 'Promotional Offers & Coupons', 'Custom Themes & Branding'],
    is_active: true,
    created_at: ago(150000),
    updated_at: ago(100),
  },
  {
    id: 'plan-business',
    name: 'Business',
    code: 'BUSINESS',
    monthly_price: 999,
    yearly_price: 9990,
    table_limit: 200,
    staff_limit: 50,
    features: ['Unlimited Tables', 'Unlimited Staff', 'Multi-Branch Management', 'Advanced Analytics & AI Insights', 'Priority 24/7 Support', 'Dedicated Account Manager'],
    is_active: true,
    created_at: ago(150000),
    updated_at: ago(100),
  },
];

// ============ SAMPLE RESTAURANTS ============
export const demoRestaurants: Restaurant[] = [
  {
    id: 'sk-restaurant',
    owner_id: 'user-owner',
    owner_user_id: 'user-owner',
    name: 'DineScan Restaurant',
    slug: 'sk-restaurant',
    logo_url: '/dinescan-logo-horizontal.png',
    cover_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
    description: 'Premier authentic dining experience. Scan the QR code at your table to order your favorite food.',
    type: 'fine_dining',
    food_preference: 'both',
    phone: '+91 98765 43210',
    email: 'owner@dinescan.com',
    address: 'Near Iscon Cross Roads, SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380054',
    gst_number: '',
    opening_time: '11:00',
    closing_time: '23:30',
    rating: 4.9,
    cuisines: 'North Indian • Chinese • Continental',
    is_open: true,
    status: 'active',
    primary_color: '#F97316',
    secondary_color: '#FFEDD5',
    card_style: 'image_cards',
    corner_radius: 18,
    show_ratings: true,
    show_prep_time: true,
    show_description: true,
    show_discount: true,
    show_restaurant_info: true,
    created_at: pastDays(90),
    updated_at: ago(5),
  },
];

export const demoRestaurant = demoRestaurants[0]; // DineScan Restaurant default

// ============ RESTAURANT SUBSCRIPTIONS ============
export const demoSubscriptions: RestaurantSubscription[] = [
  {
    id: 'sub-sk-1',
    restaurant_id: 'sk-restaurant',
    plan_id: 'plan-pro',
    plan: demoPlans[1],
    status: 'ACTIVE',
    billing_cycle: 'monthly',
    starts_at: pastDays(60),
    expires_at: futureDays(300),
    next_billing_date: futureDays(30),
    amount: 599,
    created_at: pastDays(60),
    updated_at: ago(10),
  },
];

// ============ PAYMENTS ============
export const demoPayments: Payment[] = [];

// ============ RESTAURANT STAFF ============
export const demoStaffMembers: RestaurantMember[] = [
  {
    id: 'member-owner',
    restaurant_id: 'sk-restaurant',
    user_id: 'user-owner',
    role: 'owner',
    status: 'active',
    joined_at: pastDays(90),
    full_name: 'DineScan Owner',
    email: 'owner@dinescan.com',
    phone: '+91 98765 43210',
    last_login: ago(5),
    created_at: pastDays(90),
  },
];

// ============ AUDIT LOGS ============
export const demoAuditLogs: AuditLog[] = [];

// Existing demo Categories & Menu Items (scoped to SK Restaurant & Royal Spice)
export const demoCategories: Category[] = [
  ['recommended', 'Recommended', '⭐'],
  ['starters', 'Starters', '🥗'],
  ['main', 'Main Course', '🍛'],
  ['chinese', 'Chinese', '🥡'],
  ['rice', 'Rice', '🍚'],
  ['bread', 'Breads', '🫓'],
  ['dessert', 'Desserts', '🍮'],
  ['drinks', 'Drinks', '🥤'],
].map(([id, name, icon], i) => ({
  id: `cat-${id}`,
  restaurant_id: 'sk-restaurant',
  name,
  icon,
  display_order: i + 1,
  is_active: true,
  created_at: ago(5000 - i),
  updated_at: ago(100),
}));

const imgs = {
  paneer: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=700&q=80',
  curry: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=80',
  biryani: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=700&q=80',
  noodles: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=80',
  naan: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80',
  roti: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=700&q=80',
  drink: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80',
  dessert: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=700&q=80',
};

const mi = (id: string, cat: string, name: string, price: number, image: string, description: string, opts: Partial<MenuItem> = {}): MenuItem => ({
  id: `item-${id}`,
  restaurant_id: 'sk-restaurant',
  category_id: `cat-${cat}`,
  name,
  description,
  image_url: image,
  price,
  discount_price: null,
  food_type: 'veg',
  spice_level: 'medium',
  prep_time: 18,
  rating: 4.8,
  is_available: true,
  is_featured: false,
  is_recommended: false,
  is_bestseller: false,
  created_at: ago(1000),
  updated_at: ago(30),
  ...opts,
});

export const demoMenuItems: MenuItem[] = [
  mi('paneer-tikka', 'starters', 'Paneer Tikka', 280, imgs.paneer, 'Cottage cheese marinated in aromatic spices and char-grilled.', { is_featured: true, is_recommended: true, is_bestseller: true, rating: 4.9 }),
  mi('veg-manchurian', 'chinese', 'Veg Manchurian', 220, imgs.noodles, 'Crispy vegetable dumplings tossed in a tangy Indo-Chinese sauce.', { is_recommended: true }),
  mi('hakka-noodles', 'chinese', 'Hakka Noodles', 240, imgs.noodles, 'Wok tossed noodles with crunchy vegetables and house sauces.'),
  mi('paneer-butter', 'main', 'Paneer Butter Masala', 320, imgs.curry, 'Creamy tomato gravy finished with butter and soft paneer.', { is_bestseller: true, rating: 4.9 }),
  mi('dal-tadka', 'main', 'Dal Tadka', 240, imgs.curry, 'Yellow lentils tempered with cumin, garlic, chilli and ghee.'),
  mi('veg-biryani', 'rice', 'Veg Biryani', 320, imgs.biryani, 'Fragrant basmati rice layered with vegetables and warm spices.', { is_featured: true, is_recommended: true }),
  mi('jeera-rice', 'rice', 'Jeera Rice', 190, imgs.biryani, 'Steamed basmati rice tempered with cumin and herbs.'),
  mi('tandoori-roti', 'bread', 'Tandoori Roti', 30, imgs.roti, 'Crispy whole wheat flatbread baked in a traditional clay tandoor.', { prep_time: 8, is_bestseller: true }),
  mi('butter-roti', 'bread', 'Butter Roti', 35, imgs.roti, 'Freshly baked whole wheat tandoori roti brushed with golden butter.', { prep_time: 8, is_recommended: true }),
  mi('butter-naan', 'bread', 'Butter Naan', 70, imgs.naan, 'Soft tandoor baked naan brushed with butter.', { prep_time: 10 }),
  mi('garlic-naan', 'bread', 'Cheese Garlic Naan', 130, imgs.naan, 'Garlic naan loaded with cheese and herbs.', { prep_time: 12, is_bestseller: true }),
  mi('gulab-jamun', 'dessert', 'Gulab Jamun', 110, imgs.dessert, 'Warm khoya dumplings soaked in cardamom sugar syrup.', { spice_level: 'mild', prep_time: 8 }),
  mi('cold-coffee', 'drinks', 'Cold Coffee', 180, imgs.drink, 'Chilled coffee blended with ice cream.', { spice_level: 'mild', prep_time: 6, is_recommended: true }),
  mi('lime-soda', 'drinks', 'Fresh Lime Soda', 110, imgs.drink, 'Fresh lime with soda, sweet or salted.', { spice_level: 'mild', prep_time: 5 }),
  mi('chilli-paneer', 'starters', 'Chilli Paneer', 270, imgs.paneer, 'Crispy paneer tossed with peppers, onion and chilli sauce.', { food_type: 'veg', spice_level: 'hot' }),
  mi('chicken-tikka', 'starters', 'Chicken Tikka', 340, imgs.paneer, 'Juicy chicken tikka grilled with smoky Indian spices.', { food_type: 'non-veg', is_bestseller: true }),
  mi('butter-chicken', 'main', 'Butter Chicken', 390, imgs.curry, 'Tandoori chicken in velvety tomato butter gravy.', { food_type: 'non-veg', is_featured: true }),
  mi('chicken-biryani', 'rice', 'Chicken Biryani', 360, imgs.biryani, 'Layered basmati rice and spiced chicken, dum cooked.', { food_type: 'non-veg', rating: 4.8 }),
  mi('spring-roll', 'starters', 'Crispy Spring Roll', 190, imgs.noodles, 'Golden vegetable spring rolls with chilli dip.'),
  mi('fried-rice', 'chinese', 'Schezwan Fried Rice', 250, imgs.biryani, 'Spicy wok-tossed rice with vegetables and Schezwan sauce.', { spice_level: 'hot' }),
  mi('lassi', 'drinks', 'Mango Lassi', 150, imgs.drink, 'Creamy yogurt drink blended with mango.', { spice_level: 'mild' }),
  mi('brownie', 'dessert', 'Sizzling Brownie', 220, imgs.dessert, 'Chocolate brownie with vanilla ice cream and hot sauce.', { spice_level: 'mild', is_featured: true }),
];

export const demoTables: RestaurantTable[] = [];

export const demoOrders: Order[] = [];

export const demoOffers: Offer[] = [];

export const demoCustomers: Customer[] = [];

export const demoFeedback: Feedback[] = [];

