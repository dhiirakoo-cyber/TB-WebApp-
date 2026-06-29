import { supabase } from "./supabase.js";

export const adminService = {
  /**
   * Retrieve list of all student and admin profiles
   */
  async getUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Promote or demote user roles between student and admin
   * @param {string} id
   * @param {'student'|'admin'} role
   */
  async updateUserRole(id, role) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Approve/Reject payment verification & instantly unlock course syllabus access
   * @param {string} paymentId
   * @param {'verified'|'rejected'} status
   */
  async verifyPayment(paymentId, status) {
    const { data, error } = await supabase
      .from("payments")
      .update({ status })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw error;

    if (status === "verified" && data) {
      // Automatically unlock the student's enrollment for the specific course
      const { error: enrollError } = await supabase
        .from("enrollments")
        .update({ status: "active" })
        .match({ user_id: data.user_id, course_id: data.course_id });

      if (enrollError) throw enrollError;
    }

    return data;
  },

  /**
   * Direct manual control over student enrollment statuses
   * @param {string} enrollmentId
   * @param {'pending'|'active'|'completed'} status
   */
  async verifyEnrollment(enrollmentId, status) {
    const { data, error } = await supabase
      .from("enrollments")
      .update({ status })
      .eq("id", enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
