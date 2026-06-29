import { createClient } from "@supabase/supabase-js";
import { Profile, Course, Enrollment, Payment, CourseMaterial } from "./types";

// Raw SQL Schema for the user to copy/paste into Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `
-- ====================================================
-- TB ACADEMY (TB-WEBAPP) COMPLETE DATABASE SCHEMA
-- ====================================================

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('student', 'admin')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. AUTOMATIC PROFILE TRIGGER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    new.email,
    case 
      when new.email = 'dhiirakoo@gmail.com' or new.email = 'amanuel@tb.com' then 'admin' 
      else 'student' 
    end
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. COURSES TABLE
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  instructor text default 'Amanuel' not null,
  price numeric not null,
  image_url text,
  category text default 'General' not null,
  duration text default '4 Weeks' not null
);

-- Enable RLS
alter table public.courses enable row level security;

-- Courses Policies
create policy "Allow public read to courses" on public.courses
  for select using (true);

create policy "Allow admins to manage courses" on public.courses
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. ENROLLMENTS TABLE
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  status text not null check (status in ('pending', 'active', 'completed')) default 'pending',
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, course_id)
);

-- Enable RLS
alter table public.enrollments enable row level security;

-- Enrollments Policies
create policy "Users can view their own enrollments" on public.enrollments
  for select using (
    auth.uid() = user_id or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can enroll themselves" on public.enrollments
  for insert with check (auth.uid() = user_id);

create policy "Admins can update enrollments" on public.enrollments
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. PAYMENTS TABLE
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  amount numeric not null,
  payment_method text not null check (payment_method in ('Telebirr', 'CBE')),
  screenshot_url text not null,
  status text not null check (status in ('pending', 'verified', 'rejected')) default 'pending',
  transaction_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payments enable row level security;

-- Payments Policies
create policy "Users can view their own payments" on public.payments
  for select using (
    auth.uid() = user_id or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can submit payments" on public.payments
  for insert with check (auth.uid() = user_id);

create policy "Admins can update payments" on public.payments
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 6. COURSE MATERIALS TABLE
create table public.course_materials (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'link', 'video')) default 'pdf',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.course_materials enable row level security;

-- Course Materials Policies
create policy "Users with active enrollments can view materials" on public.course_materials
  for select using (
    exists (
      select 1 from public.enrollments
      where course_id = public.course_materials.course_id 
        and user_id = auth.uid() 
        and status = 'active'
    ) or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage course materials" on public.course_materials
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 7. STORAGE BUCKETS SETUP
-- Run these via the Supabase Dashboard SQL Editor to establish storage policies:
--
-- insert into storage.buckets (id, name, public) values ('course-images', 'course-images', true);
-- insert into storage.buckets (id, name, public) values ('course-pdfs', 'course-pdfs', true);
-- insert into storage.buckets (id, name, public) values ('payment-screenshots', 'payment-screenshots', true);
--
-- create policy "Public Access to course-images" on storage.objects for select using (bucket_id = 'course-images');
-- create policy "Admin write to course-images" on storage.objects for all using (bucket_id = 'course-images' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
--
-- create policy "Access to course-pdfs for active students" on storage.objects for select using (bucket_id = 'course-pdfs');
-- create policy "Admin write to course-pdfs" on storage.objects for all using (bucket_id = 'course-pdfs' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
--
-- create policy "Access to payment screenshots for owner and admin" on storage.objects for select using (bucket_id = 'payment-screenshots' and (owner = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));
-- create policy "Anyone can upload payment screenshots" on storage.objects for insert with check (bucket_id = 'payment-screenshots');
`;

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "https://dpofcychcwnodlwcblyn.supabase.co";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_Z-8LuYQrGv1BmC7c3oNyCg_zojgZvdS";

export let isMockMode = false;

// Actual Supabase Client (if keys exist, otherwise mock client)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ----------------------------------------------------
// LOCAL STORAGE MOCK ENGINE FOR INTERACTIVE PREVIEWS
// ----------------------------------------------------

const getLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(`tb_academy_${key}`);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalData = (key: string, data: any) => {
  localStorage.setItem(`tb_academy_${key}`, JSON.stringify(data));
};

// Seed initial mock data if not set
const seedMockData = () => {
  if (!localStorage.getItem("tb_academy_courses")) {
    const mockCourses: Course[] = [
      {
        id: "c1",
        title: "Professional Photo Editing with Photoshop",
        description: "Master digital retouching, color grading, mask selections, compositing, and advanced professional workflows using Adobe Photoshop.",
        instructor: "Amanuel",
        price: 1500,
        image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60",
        category: "Graphic Design",
        duration: "4 Weeks"
      },
      {
        id: "c2",
        title: "Vector Logo Design & Branding Masterclass",
        description: "Learn visual identity principles, typography pairing, grid layout theory, and professional asset handoff using Adobe Illustrator.",
        instructor: "Amanuel",
        price: 1200,
        image_url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&auto=format&fit=crop&q=60",
        category: "Graphic Design",
        duration: "4 Weeks"
      },
      {
        id: "c3",
        title: "Contact Center Operations & Client Support",
        description: "Build robust skills in telephony soft skills, escalation resolution templates, CRM ticket workflows, and professional client support.",
        instructor: "Amanuel",
        price: 1800,
        image_url: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=500&auto=format&fit=crop&q=60",
        category: "Business Operations",
        duration: "3 Weeks"
      },
      {
        id: "c4",
        title: "Social Media Management & Campaign Strategy",
        description: "Develop high-ROI social media strategies, schedule calendars, utilize analytics dashboards, and configure conversion campaigns.",
        instructor: "Amanuel",
        price: 2000,
        image_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60",
        category: "Digital Marketing",
        duration: "5 Weeks"
      }
    ];
    setLocalData("courses", mockCourses);
  }

  if (!localStorage.getItem("tb_academy_course_materials")) {
    const mockMaterials: CourseMaterial[] = [
      {
        id: "m1",
        course_id: "c1",
        title: "Photoshop Basics & Color Grading Guide",
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_type: "pdf",
        created_at: new Date().toISOString()
      },
      {
        id: "m2",
        course_id: "c2",
        title: "Vector Logo Grid Systems & Typography Guidelines",
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_type: "pdf",
        created_at: new Date().toISOString()
      },
      {
        id: "m3",
        course_id: "c3",
        title: "Call Center Escalation Templates & CRM Playbook",
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_type: "pdf",
        created_at: new Date().toISOString()
      },
      {
        id: "m4",
        course_id: "c4",
        title: "Social Media Scheduling Planner & Engagement Tracker",
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_type: "pdf",
        created_at: new Date().toISOString()
      }
    ];
    setLocalData("course_materials", mockMaterials);
  }

  if (!localStorage.getItem("tb_academy_profiles")) {
    // Admin profile default
    const mockProfiles: Profile[] = [
      {
        id: "admin-id-amanuel",
        full_name: "Amanuel",
        email: "amanuel@tb.com",
        role: "admin",
        created_at: new Date().toISOString()
      }
    ];
    setLocalData("profiles", mockProfiles);
  }

  if (!localStorage.getItem("tb_academy_enrollments")) {
    setLocalData("enrollments", []);
  }

  if (!localStorage.getItem("tb_academy_payments")) {
    setLocalData("payments", []);
  }
};

seedMockData();

// ----------------------------------------------------
// 1. AUTHENTICATION SERVICE FUNCTIONS
// ----------------------------------------------------

export const authService = {
  async register(email: string, password_unused: string, fullName: string): Promise<{ user: any; profile: Profile | null; error: any }> {
    if (isMockMode) {
      const profiles = getLocalData<Profile[]>("profiles", []);
      
      if (profiles.some(p => p.email === email)) {
        return { user: null, profile: null, error: { message: "User with this email already exists." } };
      }

      // Default Admin condition or standard user
      const isAmanuelAdmin = email === "amanuel@tb.com" || email === "dhiirakoo@gmail.com";
      const newUserId = "user-mock-" + Math.random().toString(36).substring(2, 9);
      
      const newProfile: Profile = {
        id: newUserId,
        full_name: fullName,
        email,
        role: isAmanuelAdmin ? "admin" : "student",
        created_at: new Date().toISOString()
      };

      profiles.push(newProfile);
      setLocalData("profiles", profiles);
      setLocalData("current_user", newProfile);

      return { user: { id: newUserId, email }, profile: newProfile, error: null };
    } else {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: password_unused,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) return { user: null, profile: null, error };

        // Query Profile (wait slightly for trigger to insert)
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user?.id)
          .single();

        return { user: data.user, profile, error: null };
      } catch (err) {
        console.warn("Register failed on Supabase, falling back to Mock Mode.", err);
        isMockMode = true;
        const profiles = getLocalData<Profile[]>("profiles", []);
        if (profiles.some(p => p.email === email)) {
          return { user: null, profile: null, error: { message: "User with this email already exists." } };
        }
        const isAmanuelAdmin = email === "amanuel@tb.com" || email === "dhiirakoo@gmail.com";
        const newUserId = "user-mock-" + Math.random().toString(36).substring(2, 9);
        const newProfile: Profile = {
          id: newUserId,
          full_name: fullName,
          email,
          role: isAmanuelAdmin ? "admin" : "student",
          created_at: new Date().toISOString()
        };
        profiles.push(newProfile);
        setLocalData("profiles", profiles);
        setLocalData("current_user", newProfile);
        return { user: { id: newUserId, email }, profile: newProfile, error: null };
      }
    }
  },

  async login(email: string, password_unused: string): Promise<{ user: any; profile: Profile | null; error: any }> {
    if (isMockMode) {
      const profiles = getLocalData<Profile[]>("profiles", []);
      const profile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

      if (!profile) {
        return { user: null, profile: null, error: { message: "Invalid email or password." } };
      }

      setLocalData("current_user", profile);
      return { user: { id: profile.id, email: profile.email }, profile, error: null };
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password_unused
        });

        if (error) return { user: null, profile: null, error };

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user?.id)
          .single();

        return { user: data.user, profile, error: null };
      } catch (err) {
        console.warn("Login failed on Supabase, falling back to Mock Mode.", err);
        isMockMode = true;
        const profiles = getLocalData<Profile[]>("profiles", []);
        const profile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

        if (!profile) {
          return { user: null, profile: null, error: { message: "Invalid email or password." } };
        }

        setLocalData("current_user", profile);
        return { user: { id: profile.id, email: profile.email }, profile, error: null };
      }
    }
  },

  async logout(): Promise<{ error: any }> {
    if (isMockMode) {
      localStorage.removeItem("tb_academy_current_user");
      return { error: null };
    } else {
      const { error } = await supabase.auth.signOut();
      return { error };
    }
  },

  async getSessionUser(): Promise<Profile | null> {
    if (isMockMode) {
      return getLocalData<Profile | null>("current_user", null);
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        return profile;
      } catch (err) {
        console.warn("Error getting session user from Supabase, falling back to Mock Mode.", err);
        isMockMode = true;
        return getLocalData<Profile | null>("current_user", null);
      }
    }
  },

  async resetPassword(email: string): Promise<{ error: any; message: string }> {
    if (isMockMode) {
      return { error: null, message: `Password reset email simulated to: ${email}` };
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      return { error, message: error ? "" : "Password reset email sent." };
    }
  }
};

// ----------------------------------------------------
// 2. DATABASE SERVICE FUNCTIONS (Courses, Materials, Enrollments, Payments)
// ----------------------------------------------------

export const dbService = {
  // COURSES CRUD
  async getCourses(): Promise<Course[]> {
    if (isMockMode) {
      const courses = getLocalData<Course[]>("courses", []);
      courses.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      return courses;
    }
    console.log("Supabase direct query: Fetching all records from public.courses...");
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized. Please verify your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env variables.");
      }
      const { data, error } = await supabase
        .from("courses")
        .select("*");
      
      if (error) {
        console.error("Supabase Error fetching courses directly:", error);
        throw error;
      }
      
      console.log("Supabase successfully fetched courses data:", data);
      
      if (!data || data.length === 0) {
        console.warn("Supabase returned zero courses from public.courses table.");
      }
      
      const courses = (data || []) as Course[];
      // Sort alphabetically by title
      courses.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      return courses;
    } catch (err: any) {
      console.warn("Error in getCourses dbService call. Falling back to Mock Mode.", err);
      isMockMode = true;
      const courses = getLocalData<Course[]>("courses", []);
      courses.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      return courses;
    }
  },

  async addCourse(course: Omit<Course, "id">): Promise<Course> {
    if (isMockMode) {
      const courses = getLocalData<Course[]>("courses", []);
      const newCourse: Course = {
        ...course,
        id: "course-" + Math.random().toString(36).substring(2, 9)
      };
      courses.push(newCourse);
      setLocalData("courses", courses);
      return newCourse;
    } else {
      const { data, error } = await supabase
        .from("courses")
        .insert([course])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async editCourse(id: string, updates: Partial<Course>): Promise<Course> {
    if (isMockMode) {
      const courses = getLocalData<Course[]>("courses", []);
      const index = courses.findIndex(c => c.id === id);
      if (index === -1) throw new Error("Course not found");
      courses[index] = { ...courses[index], ...updates };
      setLocalData("courses", courses);
      return courses[index];
    } else {
      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteCourse(id: string): Promise<void> {
    if (isMockMode) {
      const courses = getLocalData<Course[]>("courses", []);
      const filtered = courses.filter(c => c.id !== id);
      setLocalData("courses", filtered);
    } else {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }
  },

  // COURSE MATERIALS CRUD
  async getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
    if (isMockMode) {
      const all = getLocalData<CourseMaterial[]>("course_materials", []);
      return all.filter(m => m.course_id === courseId);
    } else {
      try {
        const { data, error } = await supabase
          .from("course_materials")
          .select("*")
          .eq("course_id", courseId);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("Error fetching course materials from Supabase, falling back to Mock Mode.", err);
        isMockMode = true;
        const all = getLocalData<CourseMaterial[]>("course_materials", []);
        return all.filter(m => m.course_id === courseId);
      }
    }
  },

  async addCourseMaterial(material: Omit<CourseMaterial, "id" | "created_at">): Promise<CourseMaterial> {
    if (isMockMode) {
      const materials = getLocalData<CourseMaterial[]>("course_materials", []);
      const newMaterial: CourseMaterial = {
        ...material,
        id: "material-" + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      };
      materials.push(newMaterial);
      setLocalData("course_materials", materials);
      return newMaterial;
    } else {
      const { data, error } = await supabase
        .from("course_materials")
        .insert([material])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteCourseMaterial(id: string): Promise<void> {
    if (isMockMode) {
      const materials = getLocalData<CourseMaterial[]>("course_materials", []);
      const filtered = materials.filter(m => m.id !== id);
      setLocalData("course_materials", filtered);
    } else {
      const { error } = await supabase
        .from("course_materials")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }
  },

  // ENROLLMENTS CRUD & ACCESSIBILITY
  async getEnrollments(userId?: string): Promise<(Enrollment & { course?: Course; profile?: Profile })[]> {
    if (isMockMode) {
      const enrollments = getLocalData<Enrollment[]>("enrollments", []);
      const courses = getLocalData<Course[]>("courses", []);
      const profiles = getLocalData<Profile[]>("profiles", []);

      const filtered = userId 
        ? enrollments.filter(e => e.user_id === userId)
        : enrollments;

      return filtered.map(e => ({
        ...e,
        course: courses.find(c => c.id === e.course_id),
        profile: profiles.find(p => p.id === e.user_id)
      }));
    } else {
      try {
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
        return data as any || [];
      } catch (err) {
        console.warn("Error fetching enrollments from Supabase, falling back to Mock Mode.", err);
        isMockMode = true;
        const enrollments = getLocalData<Enrollment[]>("enrollments", []);
        const courses = getLocalData<Course[]>("courses", []);
        const profiles = getLocalData<Profile[]>("profiles", []);

        const filtered = userId 
          ? enrollments.filter(e => e.user_id === userId)
          : enrollments;

        return filtered.map(e => ({
          ...e,
          course: courses.find(c => c.id === e.course_id),
          profile: profiles.find(p => p.id === e.user_id)
        }));
      }
    }
  },

  async enrollUser(userId: string, courseId: string): Promise<Enrollment> {
    if (isMockMode) {
      const enrollments = getLocalData<Enrollment[]>("enrollments", []);
      const existing = enrollments.find(e => e.user_id === userId && e.course_id === courseId);
      if (existing) return existing;

      const newEnrollment: Enrollment = {
        id: "enroll-" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        course_id: courseId,
        status: "pending", // Payment needs to be uploaded & verified
        enrolled_at: new Date().toISOString()
      };
      enrollments.push(newEnrollment);
      setLocalData("enrollments", enrollments);
      return newEnrollment;
    } else {
      const { data, error } = await supabase
        .from("enrollments")
        .insert([{ user_id: userId, course_id: courseId, status: "pending" }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async verifyEnrollment(id: string, status: 'active' | 'pending' | 'completed'): Promise<Enrollment> {
    if (isMockMode) {
      const enrollments = getLocalData<Enrollment[]>("enrollments", []);
      const index = enrollments.findIndex(e => e.id === id);
      if (index === -1) throw new Error("Enrollment not found");
      enrollments[index].status = status;
      setLocalData("enrollments", enrollments);
      return enrollments[index];
    } else {
      const { data, error } = await supabase
        .from("enrollments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // PAYMENTS CRUD
  async getPayments(userId?: string): Promise<(Payment & { course?: Course; profile?: Profile })[]> {
    if (isMockMode) {
      const payments = getLocalData<Payment[]>("payments", []);
      const courses = getLocalData<Course[]>("courses", []);
      const profiles = getLocalData<Profile[]>("profiles", []);

      const filtered = userId 
        ? payments.filter(p => p.user_id === userId)
        : payments;

      return filtered.map(p => ({
        ...p,
        course: courses.find(c => c.id === p.course_id),
        profile: profiles.find(pr => pr.id === p.user_id)
      }));
    } else {
      try {
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
        return data as any || [];
      } catch (err) {
        console.warn("Error fetching payments from Supabase, falling back to Mock Mode.", err);
        isMockMode = true;
        const payments = getLocalData<Payment[]>("payments", []);
        const courses = getLocalData<Course[]>("courses", []);
        const profiles = getLocalData<Profile[]>("profiles", []);

        const filtered = userId 
          ? payments.filter(p => p.user_id === userId)
          : payments;

        return filtered.map(p => ({
          ...p,
          course: courses.find(c => c.id === p.course_id),
          profile: profiles.find(pr => pr.id === p.user_id)
        }));
      }
    }
  },

  async submitPayment(payment: Omit<Payment, "id" | "status" | "created_at">): Promise<Payment> {
    if (isMockMode) {
      const payments = getLocalData<Payment[]>("payments", []);
      const newPayment: Payment = {
        ...payment,
        id: "pay-" + Math.random().toString(36).substring(2, 9),
        status: "pending",
        created_at: new Date().toISOString()
      };
      payments.push(newPayment);
      setLocalData("payments", payments);
      return newPayment;
    } else {
      const { data, error } = await supabase
        .from("payments")
        .insert([payment])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async updatePaymentStatus(id: string, status: 'verified' | 'rejected'): Promise<Payment> {
    if (isMockMode) {
      const payments = getLocalData<Payment[]>("payments", []);
      const index = payments.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Payment record not found");
      payments[index].status = status;
      setLocalData("payments", payments);

      // If verified, auto update enrollment to active
      if (status === "verified") {
        const enrollments = getLocalData<Enrollment[]>("enrollments", []);
        const enrollmentIndex = enrollments.findIndex(e => e.user_id === payments[index].user_id && e.course_id === payments[index].course_id);
        if (enrollmentIndex !== -1) {
          enrollments[enrollmentIndex].status = "active";
          setLocalData("enrollments", enrollments);
        }
      }

      return payments[index];
    } else {
      // Begin update transaction
      const { data, error } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (status === "verified" && data) {
        // Find corresponding enrollment and set status to active
        await supabase
          .from("enrollments")
          .update({ status: "active" })
          .match({ user_id: data.user_id, course_id: data.course_id });
      }

      return data;
    }
  },

  // USERS MANAGEMENT FOR ADMINS
  async getUsers(): Promise<Profile[]> {
    if (isMockMode) {
      return getLocalData<Profile[]>("profiles", []);
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");
      if (error) throw error;
      const profiles = data || [];
      profiles.sort((a: any, b: any) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return (a.full_name || "").localeCompare(b.full_name || "");
      });
      return profiles;
    }
  },

  async updateUserRole(id: string, role: 'student' | 'admin'): Promise<Profile> {
    if (isMockMode) {
      const profiles = getLocalData<Profile[]>("profiles", []);
      const index = profiles.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Profile not found");
      profiles[index].role = role;
      setLocalData("profiles", profiles);
      return profiles[index];
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
};

// ----------------------------------------------------
// 3. STORAGE BUCKETS SERVICE FUNCTIONS
// ----------------------------------------------------

export const storageService = {
  async uploadFile(bucket: 'course-images' | 'course-pdfs' | 'payment-screenshots', file: File): Promise<string> {
    if (isMockMode) {
      // Convert file to mock object/Base64 URL or random image
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Store in a local Storage virtual bucket cache to simulate persistence
          const virtualStorage = getLocalData<Record<string, string>>(`virtual_bucket_${bucket}`, {});
          const fileName = `${Date.now()}-${file.name}`;
          const base64Str = reader.result as string;
          
          virtualStorage[fileName] = base64Str;
          setLocalData(`virtual_bucket_${bucket}`, virtualStorage);

          // For images, we can resolve directly, otherwise provide simulated absolute-looking path
          resolve(base64Str);
        };
        reader.onerror = () => reject(new Error("File conversion failed"));
        reader.readAsDataURL(file);
      });
    } else {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Retrieve public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    }
  }
};
