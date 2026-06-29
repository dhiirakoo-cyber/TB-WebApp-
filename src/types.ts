export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'admin';
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  image_url: string;
  category: string;
  duration?: string;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'pending' | 'active' | 'completed';
  enrolled_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: 'Telebirr' | 'CBE';
  screenshot_url: string;
  status: 'pending' | 'verified' | 'rejected';
  transaction_id: string;
  created_at: string;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  file_url: string;
  file_type: 'pdf' | 'link' | 'video';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
