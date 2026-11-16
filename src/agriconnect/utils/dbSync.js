// Data access for the React app. Every call goes through server functions that
// authenticate the session and enforce ownership; the browser never talks to the database.
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_SOCIAL_POSTS } from '../data/mockData';
import {
  fetchAllFn, fetchConversationsFn, fetchUsersFn, fetchNotificationsFn, getOwnProfileFn,
  upsertFn, insertFn, deleteFn, registerViewFn,
} from '@/lib/data.functions';

const log = (op, table, e) => console.error(`[DB] ${op} ${table}:`, e?.message || e);

export async function upsertData(table, id, data) {
  try { await upsertFn({ data: { table, id: String(id), data } }); } catch (e) { log('upsert', table, e); }
}

// Plain insert: notifications are created by the actor but only updated by the recipient.
export async function insertData(table, id, data) {
  try { await insertFn({ data: { table, id: String(id), data } }); } catch (e) { log('insert', table, e); }
}

export async function deleteData(table, id) {
  try { await deleteFn({ data: { table, id: String(id) } }); } catch (e) { log('delete', table, e); }
}

export async function fetchAllData() {
  let res = {};
  try { res = await fetchAllFn(); } catch (e) { log('fetch', 'all', e); }
  const products = res.products || [];
  const services = res.services || [];
  const posts = res.posts || [];
  return {
    users: res.users || [],
    products: products.length ? products : MOCK_PRODUCTS,
    services: services.length ? services : MOCK_SERVICES,
    posts: posts.length ? posts : MOCK_SOCIAL_POSTS,
    conversations: res.conversations || [],
  };
}

export async function fetchConversations() {
  try { return await fetchConversationsFn(); } catch (e) { log('fetch', 'conversations', e); return null; }
}

export async function fetchUsers() {
  try { return await fetchUsersFn(); } catch (e) { log('fetch', 'users', e); return null; }
}

// The server scopes notifications to the signed-in recipient; the argument is kept for compatibility.
export async function fetchNotifications(userId) {
  if (!userId) return [];
  try { return await fetchNotificationsFn(); } catch (e) { log('fetch', 'notifications', e); return null; }
}

export async function updateNotification(id, data) {
  try { await upsertFn({ data: { table: 'notifications', id: String(id), data } }); return true; }
  catch (e) { log('update', 'notification', e); return false; }
}

export async function saveUser(user) {
  await upsertData('users', user.id, user);
}

export async function findUserByEmail() {
  return null;
}

// Only the signed-in member's own profile can be read in full.
export async function findUserById() {
  try { return await getOwnProfileFn(); } catch { return null; }
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
export async function uploadMedia(file) {
  if (!file || !ALLOWED.includes(file.type)) throw new Error('Type de fichier non autorisé.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Fichier trop volumineux (25 Mo maximum).');
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/media/upload', { method: 'POST', body, credentials: 'same-origin' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) throw new Error(json.error || 'Envoi du fichier impossible.');
  return json.url;
}

export async function registerView(table, id) {
  try { await registerViewFn({ data: { table, id: String(id) } }); } catch (e) { log('view', table, e); }
}
