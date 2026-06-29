import { supabase } from "./supabase.js";

export const coursesService = {
  /**
   * Get list of all active professional courses
   */
  async getCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, price, description, instructor, category, duration, image_url");

    if (error) throw error;
    const courses = data || [];
    courses.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return courses;
  },

  /**
   * Add a new professional course (Admin only)
   * @param {object} course
   */
  async addCourse(course) {
    const { data, error } = await supabase
      .from("courses")
      .insert([course])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Edit an existing course (Admin only)
   * @param {string} id
   * @param {object} updates
   */
  async editCourse(id, updates) {
    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete an existing course (Admin only)
   * @param {string} id
   */
  async deleteCourse(id) {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Fetch curriculum PDF/link materials for a specific course
   * @param {string} courseId
   */
  async getCourseMaterials(courseId) {
    const { data, error } = await supabase
      .from("course_materials")
      .select("*")
      .eq("course_id", courseId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Add course syllabus material (Admin only)
   * @param {object} material
   */
  async addCourseMaterial(material) {
    const { data, error } = await supabase
      .from("course_materials")
      .insert([material])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete syllabus material (Admin only)
   * @param {string} id
   */
  async deleteCourseMaterial(id) {
    const { error } = await supabase
      .from("course_materials")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Upload course image to public bucket: course-images
   * @param {File} file
   */
  async uploadCourseImage(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("course-images")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("course-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  /**
   * Upload syllabus material PDF to bucket: course-pdfs
   * @param {File} file
   */
  async uploadCoursePdf(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("course-pdfs")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("course-pdfs")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
};
