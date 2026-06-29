import { supabase } from "./supabase.js";

export const enrollmentsService = {
  /**
   * Fetch course enrollments (optionally filtered by student user ID)
   * @param {string|null} userId
   */
  async getEnrollments(userId = null) {
    let query = supabase.from("enrollments").select(`
      *,
      course:course_id(*),
      profile:user_id(*)
    `);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Register a new pending enrollment for a course
   * @param {string} userId
   * @param {string} courseId
   */
  async enrollUser(userId, courseId) {
    const { data, error } = await supabase
      .from("enrollments")
      .insert([{ user_id: userId, course_id: courseId, status: "pending" }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
