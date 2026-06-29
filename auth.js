import { supabase } from "./supabase.js";

export const authService = {
  /**
   * Register a new student/admin user
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   */
  async register(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // Immediately fetch the profile built by the database trigger
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user?.id)
      .single();

    if (profileError) {
      console.warn("Profile trigger is still processing: ", profileError);
    }

    return { user: data.user, profile };
  },

  /**
   * Sign in user with credentials
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user?.id)
      .single();

    if (profileError) throw profileError;

    return { user: data.user, profile };
  },

  /**
   * Log out active session
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  /**
   * Retrieve active session profile
   */
  async getSessionUser() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) return null;
    return profile;
  },

  /**
   * Request password reset link
   * @param {string} email
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
    return { success: true, message: "Password reset email sent." };
  }
};
