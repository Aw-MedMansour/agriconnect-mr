import { supabase } from './supabaseClient';
import { MOCK_ACTORS, MOCK_PRODUCTS, MOCK_SERVICES, MOCK_SOCIAL_POSTS } from '../data/mockData';

// ── Generic helpers ───────────────────────────────────────────────────────────
export async function upsertData(table, id, data) {
  const { error } = await supabase.from(table).upsert({ id: String(id), data });
  if (error) console.error(`[DB] upsert ${table}:`, error.message);
}

export async function deleteData(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', String(id));
  if (error) console.error(`[DB] delete ${table}:`, error.message);
}

// ── Seed a table with mock data if it is empty ───────────────────────────────
async function seedIfEmpty(table, mockItems) {
  const { data } = await supabase.from(table).select('id').limit(1);
  if (data && data.length === 0) {
    await Promise.all(
      mockItems.map(item =>
        supabase.from(table).upsert({ id: String(item.id), data: item })
      )
    );
    return mockItems;
  }
  return null; // already seeded
}

// ── Load all data from Supabase ───────────────────────────────────────────────
export async function fetchAllData() {
  // 1. Seed mock data on first run (awaited so data is ready)
  const [seededUsers, seededProducts, seededServices, seededPosts] = await Promise.all([
    seedIfEmpty('users', MOCK_ACTORS),
    seedIfEmpty('products', MOCK_PRODUCTS),
    seedIfEmpty('services', MOCK_SERVICES),
    seedIfEmpty('posts', MOCK_SOCIAL_POSTS),
  ]);

  // 2. Fetch everything
  const [usersRes, productsRes, servicesRes, postsRes, convsRes] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('services').select('*').order('created_at', { ascending: false }),
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('conversations').select('*').order('created_at', { ascending: false }),
  ]);

  const users        = usersRes.data?.map(r => r.data).filter(Boolean)        || seededUsers        || MOCK_ACTORS;
  const products     = productsRes.data?.map(r => r.data).filter(Boolean)     || seededProducts     || MOCK_PRODUCTS;
  const services     = servicesRes.data?.map(r => r.data).filter(Boolean)     || seededServices     || MOCK_SERVICES;
  const posts        = postsRes.data?.map(r => r.data).filter(Boolean)        || seededPosts        || MOCK_SOCIAL_POSTS;
  const conversations= convsRes.data?.map(r => r.data).filter(Boolean)        || [];

  return { users, products, services, posts, conversations };
}

// ── User auth helpers ─────────────────────────────────────────────────────────
// Store user WITH password in Supabase (password is needed for login lookup)
export async function saveUser(userWithPassword) {
  await upsertData('users', userWithPassword.id, userWithPassword);
}

export async function findUserByEmail(email) {
  // Fetch all and filter in JS — most reliable with jsonb column
  const { data, error } = await supabase.from('users').select('data');
  if (error || !data) return null;
  return data.map(r => r.data).find(u => u && u.email === email) || null;
}

// ── Media Upload to Supabase Storage ─────────────────────────────────────────
export async function uploadMedia(file, folder = 'media') {
  const ext = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('agroconnect-media')
    .upload(filename, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('[Storage] upload error:', error.message);
    // Fallback to blob URL if storage not configured yet
    return URL.createObjectURL(file);
  }

  const { data: urlData } = supabase.storage
    .from('agroconnect-media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
