// Browser auth client backed by the app's own server sessions (HttpOnly cookie).
// Keeps the call shapes the components already used: signUp / signInWithPassword / signOut / getUser / onAuthStateChange.
import { signUpFn, signInFn, signOutFn, getSessionFn } from '@/lib/auth.functions';

const listeners = new Set();
const emit = (event, user) => listeners.forEach((cb) => { try { cb(event, user ? { user } : null); } catch (e) { console.error(e); } });
const errorOf = (e) => ({ message: e?.message || 'Erreur' });

export const auth = {
  async signUp({ email, password }) {
    try {
      // No SIGNED_IN event here: the sign-up form saves the new profile first, then reports success itself.
      const { user } = await signUpFn({ data: { email, password } });
      return { data: { user, session: { user } }, error: null };
    } catch (e) { return { data: { user: null, session: null }, error: errorOf(e) }; }
  },
  async signInWithPassword({ email, password }) {
    try {
      const { user } = await signInFn({ data: { email, password } });
      emit('SIGNED_IN', user);
      return { data: { user, session: { user } }, error: null };
    } catch (e) { return { data: { user: null, session: null }, error: errorOf(e) }; }
  },
  async signOut() {
    try { await signOutFn(); } catch (e) { console.error('[auth] signOut', e); }
    emit('SIGNED_OUT', null);
    return { error: null };
  },
  async getUser() {
    try { const { user } = await getSessionFn(); return { data: { user }, error: null }; }
    catch (e) { return { data: { user: null }, error: errorOf(e) }; }
  },
  onAuthStateChange(cb) {
    listeners.add(cb);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
};
