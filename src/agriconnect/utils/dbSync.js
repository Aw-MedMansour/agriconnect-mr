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

// ── Load all data (mock data is pre-seeded in the database via migration) ────
export async function fetchAllData() {
  const [usersRes, productsRes, servicesRes, postsRes, convsRes] = await Promise.all([
    // Sanitized directory: contact details are never exposed to other members.
    supabase.from('public_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('services').select('*').order('created_at', { ascending: false }),
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('conversations').select('*').order('created_at', { ascending: false }),
  ]);

  const users         = usersRes.data?.map(r => r.data).filter(Boolean)     || [];
  const products      = productsRes.data?.map(r => r.data).filter(Boolean)  || [];
  const services      = servicesRes.data?.map(r => r.data).filter(Boolean)  || [];
  const posts         = postsRes.data?.map(r => r.data).filter(Boolean)     || [];
  // Conversations require an authenticated session — empty for visitors.
  const conversations = convsRes.data?.map(r => r.data).filter(Boolean)     || [];

  return {
    users: users.length ? users : MOCK_ACTORS,
    products: products.length ? products : MOCK_PRODUCTS,
    services: services.length ? services : MOCK_SERVICES,
    posts: posts.length ? posts : MOCK_SOCIAL_POSTS,
    conversations,
  };
}

// ── Conversations only (used for live sync between accounts) ─────────────────
export async function fetchConversations() {
  const { data, error } = await supabase.from('conversations').select('*');
  if (error) { console.error('[DB] conversations:', error.message); return null; }
  return data?.map(r => r.data).filter(Boolean) || [];
}

// ── Members only (so newly registered accounts appear without reloading) ─────
export async function fetchUsers() {
  const { data, error } = await supabase.from('public_profiles').select('*');
  if (error) { console.error('[DB] users:', error.message); return null; }
  return data?.map(r => r.data).filter(Boolean) || [];
}

// ── User profile helpers (passwords are handled by the auth system, never stored here)
export async function saveUser(user) {
  await upsertData('users', user.id, user);
}

// Email lookups are handled by the auth system; profiles never expose emails.
export async function findUserByEmail() {
  return null;
}

export async function findUserById(id) {
  const { data, error } = await supabase.from('users').select('data').eq('id', String(id)).maybeSingle();
  if (error || !data) return null;
  return data.data || null;
}

// ── Media Upload to file storage ─────────────────────────────────────────────
export async function uploadMedia(file, folder = 'media') {
  try {
    const ext = file.name.split('.').pop();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('agroconnect-media')
      .upload(filename, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('[Storage] upload error:', error.message);
      return URL.createObjectURL(file);
    }

    const { data: signed } = await supabase.storage
      .from('agroconnect-media')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);

    return signed?.signedUrl || URL.createObjectURL(file);
  } catch (err) {
    console.error('[Storage] upload exception:', err);
    return URL.createObjectURL(file);
  }
}
