import { supabase } from "./supabase.js";

export const paymentsService = {
  /**
   * Fetch payments (optionally filtered by student user ID)
   * @param {string|null} userId
   */
  async getPayments(userId = null) {
    let query = supabase.from("payments").select(`
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
   * Register a new bank/Telebirr tuition transfer receipt
   * @param {object} payment
   */
  async submitPayment(payment) {
    const { data, error } = await supabase
      .from("payments")
      .insert([payment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Upload screenshot receipt file to storage bucket: payment-screenshots
   * @param {File} file
   */
  async uploadPaymentScreenshot(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("payment-screenshots")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("payment-screenshots")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
};
