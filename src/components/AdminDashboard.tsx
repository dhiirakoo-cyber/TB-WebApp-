import React, { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, Users, 
  BookOpen, DollarSign, Clock, FileText, Upload, Image as ImageIcon, 
  Link as LinkIcon, FilePlus, ShieldAlert, BarChart3, GraduationCap 
} from "lucide-react";
import { dbService, storageService, isMockMode } from "../supabase";
import { Course, CourseMaterial, Enrollment, Payment, Profile } from "../types";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'courses' | 'materials' | 'users'>('overview');
  
  // States for DB data
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<(Payment & { course?: Course; profile?: Profile })[]>([]);
  const [enrollments, setEnrollments] = useState<(Enrollment & { course?: Course; profile?: Profile })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [courseForm, setCourseForm] = useState<{
    id?: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
    category: string;
    duration: string;
    imageFile: File | null;
    imageUrl: string;
  }>({
    title: "",
    description: "",
    instructor: "Amanuel",
    price: 1500,
    category: "Software Development",
    duration: "4 Weeks",
    imageFile: null,
    imageUrl: ""
  });

  const [materialForm, setMaterialForm] = useState<{
    course_id: string;
    title: string;
    file_type: 'pdf' | 'link' | 'video';
    fileUrl: string;
    pdfFile: File | null;
  }>({
    course_id: "",
    title: "",
    file_type: "pdf",
    fileUrl: "",
    pdfFile: null
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const fetchedCourses = await dbService.getCourses();
      const fetchedPayments = await dbService.getPayments();
      const fetchedEnrollments = await dbService.getEnrollments();
      const fetchedUsers = await dbService.getUsers();

      setCourses(fetchedCourses);
      setPayments(fetchedPayments);
      setEnrollments(fetchedEnrollments);
      setProfiles(fetchedUsers);

      // Default course ID for material form
      if (fetchedCourses.length > 0 && !materialForm.course_id) {
        setMaterialForm(prev => ({ ...prev, course_id: fetchedCourses[0].id }));
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // COURSE MANAGEMENT FUNCTIONS
  // ----------------------------------------------------
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setUploadingImage(true);

    try {
      let finalImageUrl = courseForm.imageUrl;

      if (courseForm.imageFile) {
        // Upload to course-images bucket
        finalImageUrl = await storageService.uploadFile('course-images', courseForm.imageFile);
      }

      if (!finalImageUrl) {
        finalImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500";
      }

      const coursePayload = {
        title: courseForm.title,
        description: courseForm.description,
        instructor: courseForm.instructor,
        price: Number(courseForm.price),
        category: courseForm.category,
        duration: courseForm.duration,
        image_url: finalImageUrl
      };

      if (editingCourseId) {
        await dbService.editCourse(editingCourseId, coursePayload);
        setFormSuccess("Course updated successfully!");
      } else {
        await dbService.addCourse(coursePayload);
        setFormSuccess("Course created successfully!");
      }

      // Reset form
      setCourseForm({
        title: "",
        description: "",
        instructor: "Amanuel",
        price: 1500,
        category: "Software Development",
        duration: "4 Weeks",
        imageFile: null,
        imageUrl: ""
      });
      setEditingCourseId(null);
      await fetchAdminData();
    } catch (err: any) {
      setFormError(err.message || "Failed to save course.");
    } finally {
      setUploadingImage(false);
    }
  };

  const startEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      price: course.price,
      category: course.category,
      duration: course.duration || "4 Weeks",
      imageFile: null,
      imageUrl: course.image_url || ""
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this course? All associated materials will be removed.")) {
      try {
        await dbService.deleteCourse(id);
        await fetchAdminData();
      } catch (err: any) {
        alert(err.message || "Failed to delete course.");
      }
    }
  };

  // ----------------------------------------------------
  // MATERIAL MANAGEMENT FUNCTIONS
  // ----------------------------------------------------
  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setUploadingPdf(true);

    try {
      let finalFileUrl = materialForm.fileUrl;

      if (materialForm.file_type === "pdf" && materialForm.pdfFile) {
        finalFileUrl = await storageService.uploadFile('course-pdfs', materialForm.pdfFile);
      }

      if (!finalFileUrl) {
        throw new Error("Please specify a URL or upload a PDF file.");
      }

      await dbService.addCourseMaterial({
        course_id: materialForm.course_id,
        title: materialForm.title,
        file_type: materialForm.file_type,
        file_url: finalFileUrl
      });

      setFormSuccess("Material added successfully!");
      setMaterialForm(prev => ({
        ...prev,
        title: "",
        fileUrl: "",
        pdfFile: null
      }));
      await fetchAdminData();
    } catch (err: any) {
      setFormError(err.message || "Failed to save material.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await dbService.deleteCourseMaterial(id);
        alert("Material deleted successfully.");
        await fetchAdminData();
      } catch (err: any) {
        alert(err.message || "Failed to delete material.");
      }
    }
  };

  // ----------------------------------------------------
  // PAYMENT & ACCESS VERIFICATION FUNCTIONS
  // ----------------------------------------------------
  const handleVerifyPayment = async (paymentId: string) => {
    try {
      await dbService.updatePaymentStatus(paymentId, 'verified');
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to verify payment");
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (window.confirm("Reject this payment? The student's enrollment will remain pending.")) {
      try {
        await dbService.updatePaymentStatus(paymentId, 'rejected');
        await fetchAdminData();
      } catch (err: any) {
        alert(err.message || "Failed to reject payment");
      }
    }
  };

  // ----------------------------------------------------
  // USER PROMOTION FUNCTIONS
  // ----------------------------------------------------
  const toggleUserRole = async (user: Profile) => {
    if (user.email === "amanuel@tb.com") {
      alert("Main admin's role cannot be modified.");
      return;
    }
    const targetRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      await dbService.updateUserRole(user.id, targetRole);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  // Statistics Computations
  const totalStudents = profiles.filter(p => p.role === "student").length;
  const activeEnrollments = enrollments.filter(e => e.status === "active").length;
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const verifiedPaymentsSum = payments
    .filter(p => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden font-sans">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 px-6 py-8 text-white relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <GraduationCap className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight">Admin Command Center</h1>
                <span className="bg-blue-500/30 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
                  SYSTEM ACTIVE
                </span>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                Welcome back, Head Administrator <span className="font-bold text-white text-base">Amanuel</span>
              </p>
            </div>
          </div>
          {isMockMode && (
            <div className="bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs px-3 py-1.5 rounded-xl flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Interactive Sandbox Mock Database active</span>
            </div>
          )}
        </div>

        {/* Dashboard Tabs */}
        <div className="flex space-x-1 mt-8 bg-white/5 p-1 rounded-xl max-w-xl border border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'overview' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 relative ${
              activeTab === 'payments' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Payments</span>
            {pendingPayments > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-indigo-950 animate-pulse">
                {pendingPayments}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'courses' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'materials' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Materials</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'users' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Querying secure records...</p>
        </div>
      ) : (
        <div className="p-6">
          
          {/* TAB 1: OVERVIEW STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stats Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-900/60 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center space-x-4 backdrop-blur-md">
                  <div className="p-3.5 bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] text-white rounded-2xl shadow-md">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Verified Revenue</span>
                    <span className="text-xl font-black text-white mt-1 block font-mono tracking-tight">{verifiedPaymentsSum.toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center space-x-4 backdrop-blur-md">
                  <div className="p-3.5 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Students</span>
                    <span className="text-xl font-black text-white mt-1 block font-mono tracking-tight">{totalStudents.toLocaleString()} Members</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center space-x-4 backdrop-blur-md">
                  <div className="p-3.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Course Enrollment</span>
                    <span className="text-xl font-black text-white mt-1 block font-mono tracking-tight">{activeEnrollments.toLocaleString()} Active</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center space-x-4 backdrop-blur-md relative overflow-hidden">
                  <div className="p-3.5 bg-gradient-to-tr from-rose-600 to-pink-600 text-white rounded-2xl shadow-md">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
                    <span className="text-xl font-black text-amber-400 mt-1 block font-mono tracking-tight">{pendingPayments} Payments</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Log */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pending List Preview */}
                <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col backdrop-blur-md">
                  <h3 className="font-bold text-white text-base mb-4 flex items-center justify-between">
                    <span>Recent Payment Submissions</span>
                    <span className="text-xs font-semibold bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full">{payments.length} total</span>
                  </h3>
                  {payments.filter(p => p.status === 'pending').length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400">
                      <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
                      <p className="text-sm">Excellent! Zero pending verifications.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                      {payments.filter(p => p.status === 'pending').map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
                          <div>
                            <span className="font-semibold text-sm block text-white">{p.profile?.full_name || "Unknown User"}</span>
                            <span className="text-xs text-slate-400">Enrolled in <strong className="text-slate-200">{p.course?.title || "Course"}</strong></span>
                          </div>
                          <button 
                            onClick={() => setActiveTab('payments')}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                          >
                            Verify Receipts
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Course List Preview */}
                <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col backdrop-blur-md">
                  <h3 className="font-bold text-white text-base mb-4">Quick Course Stats</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {courses.map(c => {
                      const count = enrollments.filter(e => e.course_id === c.id).length;
                      return (
                        <div key={c.id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5">
                          <div>
                            <span className="font-bold text-sm text-white block">{c.title}</span>
                            <span className="text-xs text-slate-400">Instructor: {c.instructor} | Price: {c.price} ETB</span>
                          </div>
                          <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg">
                            {count} Students
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: VERIFY PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Student Payment Screenshot Verification</h2>
                  <p className="text-sm text-slate-400">Match transactions with CBE / Telebirr statements and approve student enrollment instantly.</p>
                </div>
                <div className="flex space-x-2 bg-white/5 border border-white/10 p-1 rounded-xl">
                  <span className="text-xs font-semibold bg-white/10 text-slate-200 px-3 py-1.5 rounded-lg">
                    Payments: {payments.length}
                  </span>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No payment records have been submitted by students yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {payments.map(p => (
                    <div 
                      key={p.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row items-start gap-6 backdrop-blur-md shadow-xl ${
                        p.status === 'pending' ? 'border-amber-500/30 bg-amber-500/10' : p.status === 'verified' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-slate-900/40'
                      }`}
                    >
                      {/* Screenshot Preview */}
                      <div className="w-full lg:w-48 h-48 bg-white/5 rounded-xl overflow-hidden border border-white/10 relative group flex-shrink-0 flex items-center justify-center">
                        {p.screenshot_url ? (
                          <img 
                            src={p.screenshot_url} 
                            alt="Receipt" 
                            className="w-full h-full object-contain group-hover:scale-105 transition-all cursor-zoom-in"
                            onClick={() => window.open(p.screenshot_url, '_blank')}
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No screenshot file</span>
                        )}
                      </div>

                      {/* Payment Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            p.status === 'verified' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : p.status === 'rejected' 
                              ? 'bg-red-500/20 text-red-300' 
                              : 'bg-amber-500/20 text-amber-300 animate-pulse'
                          }`}>
                            {p.status}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ID: {p.id.substring(0, 8)}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-white text-base">{p.profile?.full_name || "Unknown Student"}</h4>
                          <p className="text-xs text-slate-400">{p.profile?.email}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                          <div>
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Course</span>
                            <span className="text-xs font-bold text-slate-200 block truncate">{p.course?.title}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Method</span>
                            <span className="text-xs font-bold text-slate-200 block">{p.payment_method}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount Paid</span>
                            <span className="text-xs font-bold text-cyan-400 block font-mono">{p.amount} ETB</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ref ID</span>
                            <span className="text-xs font-bold text-slate-200 block font-mono truncate">{p.transaction_id || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Decisions */}
                      {p.status === 'pending' && (
                        <div className="flex lg:flex-col gap-2 w-full lg:w-36 justify-end">
                          <button
                            onClick={() => handleVerifyPayment(p.id)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Verify & Grant</span>
                          </button>
                          <button
                            onClick={() => handleRejectPayment(p.id)}
                            className="flex-1 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-300 font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 border border-red-500/30 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COURSES CRUD */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Side */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 h-fit space-y-4 backdrop-blur-md shadow-xl">
                <h3 className="font-bold text-white text-base border-b border-white/10 pb-2 flex items-center justify-between">
                  <span>{editingCourseId ? "Edit Course" : "Add New Course"}</span>
                  {editingCourseId && (
                    <button 
                      onClick={() => {
                        setEditingCourseId(null);
                        setCourseForm({
                          title: "",
                          description: "",
                          instructor: "Amanuel",
                          price: 1500,
                          category: "Software Development",
                          duration: "4 Weeks",
                          imageFile: null,
                          imageUrl: ""
                        });
                      }}
                      className="text-xs text-red-400 hover:underline font-semibold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </h3>

                {formError && (
                  <div className="p-3 bg-red-500/20 text-xs text-red-300 font-medium border border-red-500/30 rounded-xl">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-500/20 text-xs text-emerald-300 font-medium border border-emerald-500/30 rounded-xl">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs font-semibold text-slate-300">
                  <div>
                    <label className="block mb-1.5 text-slate-300">Course Title</label>
                    <input
                      type="text"
                      required
                      value={courseForm.title}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Master React in 30 Days"
                      className="w-full p-2.5 bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-300">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={courseForm.description}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed learning path objectives..."
                      className="w-full p-2.5 bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-slate-300">Instructor</label>
                      <input
                        type="text"
                        required
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, instructor: e.target.value }))}
                        className="w-full p-2.5 bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-slate-300">Price (ETB)</label>
                      <input
                        type="number"
                        required
                        value={courseForm.price}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full p-2.5 bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-300">Course Duration</label>
                    <input
                      type="text"
                      required
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g. 4 Weeks, 3 Months, 12 Chapters"
                      className="w-full p-2.5 bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-300">Category</label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2.5 bg-slate-900 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white"
                    >
                      <option value="Software Development">Software Development</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Cyber Security">Cyber Security</option>
                      <option value="Mobile Development">Mobile Development</option>
                      <option value="Design & UI/UX">Design & UI/UX</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-300">Course Image Banner</label>
                    <div className="flex items-center space-x-3 bg-white/5 p-2.5 border border-white/10 rounded-xl">
                      <ImageIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCourseForm(prev => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                        className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-500/25 file:text-blue-300 hover:file:bg-blue-500/40 cursor-pointer w-full"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingImage}
                    className="w-full py-2.5 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#3B82F6] hover:to-[#8B5CF6] text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{uploadingImage ? "Saving Course..." : editingCourseId ? "Save Updates" : "Create Course"}</span>
                  </button>
                </form>
              </div>

              {/* Course Listing Side */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-white text-base">Active Course Catalogue ({courses.length})</h3>
                {courses.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No courses in database. Add one to begin.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {courses.map(c => (
                      <div key={c.id} className="flex flex-col sm:flex-row items-center bg-white border border-blue-500/10 rounded-2xl p-4 gap-4 shadow-[0_10px_40px_rgba(37,99,235,0.15)] hover:scale-[1.01] transition-all">
                        <img 
                          src={c.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"} 
                          alt="Banner" 
                          className="w-full sm:w-24 h-24 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold bg-blue-50 text-[#2563EB] px-2.5 py-0.5 rounded-md uppercase">
                              {c.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-[#0F172A] text-base mt-1.5 truncate">{c.title}</h4>
                          <p className="text-xs text-[#64748B] line-clamp-2 mt-1 font-medium">{c.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-[#64748B] font-semibold">
                            <span>Instructor: <strong className="text-[#0F172A]">{c.instructor}</strong></span>
                            <span>•</span>
                            <span className="font-mono text-[#2563EB] font-bold">{c.price} ETB</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => startEditCourse(c)}
                            className="flex-1 p-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-[#0F172A] rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="text-xs font-semibold sm:hidden">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c.id)}
                            className="flex-1 p-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs font-semibold sm:hidden">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: MATERIALS MANAGEMENT */}
          {activeTab === 'materials' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Add Material Side */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 h-fit space-y-4 backdrop-blur-md shadow-xl">
                <h3 className="font-bold text-white text-base border-b border-white/10 pb-2">
                  Upload Course Materials
                </h3>                <form onSubmit={handleMaterialSubmit} className="space-y-4 text-xs font-semibold text-slate-300">
                  <div>
                    <label className="block mb-1.5 text-slate-300">Select Course</label>
                    <select
                      required
                      value={materialForm.course_id}
                      onChange={(e) => setMaterialForm(prev => ({ ...prev, course_id: e.target.value }))}
                      className="w-full p-2.5 bg-slate-900 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-300">Material / Chapter Title</label>
                    <input
                      type="text"
                      required
                      value={materialForm.title}
                      onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Chapter 1: Introduction to State Hook"
                      className="w-full p-2.5 bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-300">Material Type</label>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setMaterialForm(prev => ({ ...prev, file_type: 'pdf', fileUrl: "" }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          materialForm.file_type === 'pdf' ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Document</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialForm(prev => ({ ...prev, file_type: 'link', fileUrl: "" }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          materialForm.file_type === 'link' ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Web Link</span>
                      </button>
                    </div>
                  </div>

                  {materialForm.file_type === 'pdf' ? (
                    <div>
                      <label className="block mb-1.5 text-slate-300">Upload PDF File</label>
                      <div className="flex items-center space-x-3 bg-white/5 p-2.5 border border-white/10 rounded-xl">
                        <Upload className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <input
                          type="file"
                          accept=".pdf"
                          required={!materialForm.fileUrl}
                          onChange={(e) => setMaterialForm(prev => ({ ...prev, pdfFile: e.target.files?.[0] || null }))}
                          className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-500/25 file:text-blue-300 hover:file:bg-blue-500/40 cursor-pointer w-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block mb-1.5 text-slate-300">Web/Video URL</label>
                      <input
                        type="url"
                        required
                        value={materialForm.fileUrl}
                        onChange={(e) => setMaterialForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                        placeholder="https://example.com/lecture-doc"
                        className="w-full p-2.5 bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl focus:outline-none font-normal text-sm text-white placeholder-slate-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploadingPdf}
                    className="w-full py-2.5 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#3B82F6] hover:to-[#8B5CF6] text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>{uploadingPdf ? "Uploading Document..." : "Add Material"}</span>
                  </button>
                </form>
              </div>

              {/* Material List Side grouped by Course */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="font-bold text-gray-950 text-base">Course Material Management</h3>
                
                {courses.map(c => (
                  <CourseMaterialGroup
                    key={c.id}
                    course={c}
                    formSuccess={formSuccess}
                    onDeleteMaterial={handleDeleteMaterial}
                  />
                ))}
              </div>

            </div>
          )}          {/* TAB 5: USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Student & Instructor Directory</h2>
                <p className="text-sm text-slate-400">Manage organizational members, audit credentials, and distribute supervisor roles.</p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl">
                <table className="w-full text-left border-collapse bg-transparent">
                  <thead>
                    <tr className="bg-white/5 text-xs font-semibold text-slate-300 uppercase border-b border-white/10">
                      <th className="p-4">Profile Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role Privileges</th>
                      <th className="p-4 text-right">System Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-200 font-medium">
                    {profiles.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-blue-500/20 text-blue-300 font-bold rounded-full flex items-center justify-center">
                              {p.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-white">{p.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 font-mono">{p.email}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            p.role === 'admin' 
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                              : 'bg-white/5 text-slate-300 border border-white/10'
                          }`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => toggleUserRole(p)}
                            disabled={p.email === "amanuel@tb.com"}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-all text-slate-200 hover:text-white cursor-pointer"
                          >
                            Toggle Privilege
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

interface CourseMaterialGroupProps {
  course: Course;
  formSuccess: string | null;
  onDeleteMaterial: (id: string) => Promise<void>;
  key?: any;
}

function CourseMaterialGroup({ course, formSuccess, onDeleteMaterial }: CourseMaterialGroupProps) {
  const [materialsList, setMaterialsList] = useState<CourseMaterial[]>([]);

  const fetchMaterials = async () => {
    try {
      const list = await dbService.getCourseMaterials(course.id);
      setMaterialsList(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [course.id, formSuccess]);

  const handleDelete = async (id: string) => {
    await onDeleteMaterial(id);
    fetchMaterials();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="font-bold text-sm text-gray-900 truncate max-w-[80%]">{course.title}</span>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
          {materialsList.length} items
        </span>
      </div>

      {materialsList.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No materials uploaded for this course yet.</p>
      ) : (
        <div className="space-y-2">
          {materialsList.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`p-2 rounded-lg flex-shrink-0 ${m.file_type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {m.file_type === 'pdf' ? <FileText className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </div>
                <span className="text-sm font-semibold text-gray-800 truncate">{m.title}</span>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
