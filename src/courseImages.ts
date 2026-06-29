const CATEGORY_IMAGES: Record<string, string> = {
  "photo editing": "https://images.unsplash.com/photo-1542038784-456-1ea8e935640e?q=80&w=800&auto=format&fit=crop",
  "logo design": "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop",
  "contact center": "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=800&auto=format&fit=crop",
  "social media management": "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop",
};

export function getCourseImage(category: string, title?: string, existingUrl?: string): string {
  const normCat = (category || "").trim().toLowerCase();
  const normTitle = (title || "").trim().toLowerCase();
  
  // 1. Direct title/category keyword matches for Photo Editing
  if (
    normTitle.includes("photo") || 
    normTitle.includes("edit") || 
    normTitle.includes("photoshop") || 
    normTitle.includes("lightroom") || 
    normTitle.includes("camera") ||
    normCat.includes("photo") || 
    normCat.includes("edit")
  ) {
    return CATEGORY_IMAGES["photo editing"];
  }

  // 2. Direct title/category keyword matches for Logo Design
  if (
    normTitle.includes("logo") || 
    normTitle.includes("illustrator") || 
    normTitle.includes("vector") ||
    normCat.includes("logo") || 
    (normCat.includes("design") && !normTitle.includes("photo") && !normTitle.includes("edit"))
  ) {
    return CATEGORY_IMAGES["logo design"];
  }

  // 3. Direct title/category keyword matches for Contact Center
  if (
    normTitle.includes("contact") || 
    normTitle.includes("support") || 
    normTitle.includes("call") || 
    normTitle.includes("customer") || 
    normTitle.includes("agent") ||
    normCat.includes("contact") || 
    normCat.includes("support") || 
    normCat.includes("customer")
  ) {
    return CATEGORY_IMAGES["contact center"];
  }

  // 4. Direct title/category keyword matches for Social Media Management
  if (
    normTitle.includes("social") || 
    normTitle.includes("media") || 
    normTitle.includes("market") || 
    normTitle.includes("digital") || 
    normTitle.includes("facebook") || 
    normTitle.includes("instagram") ||
    normCat.includes("social") || 
    normCat.includes("media") || 
    normCat.includes("market")
  ) {
    return CATEGORY_IMAGES["social media management"];
  }

  // 5. Exact category keys check
  for (const [key, value] of Object.entries(CATEGORY_IMAGES)) {
    if (normCat.includes(key)) {
      return value;
    }
  }

  return existingUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
}

export interface CategoryStyle {
  badge: string;
  accentText: string;
  buttonBg: string;
  gradientFrom: string;
  glowShadow: string;
  borderColor: string;
}

export function getCategoryStyle(category: string, title?: string): CategoryStyle {
  const normCat = (category || "").trim().toLowerCase();
  const normTitle = (title || "").trim().toLowerCase();
  
  if (
    normTitle.includes("photo") || 
    normTitle.includes("edit") || 
    normTitle.includes("photoshop") || 
    normTitle.includes("lightroom") || 
    normTitle.includes("camera") ||
    normCat.includes("photo") || 
    normCat.includes("edit")
  ) {
    return {
      badge: "bg-violet-50 text-violet-700 border border-violet-200/60",
      accentText: "text-violet-600",
      buttonBg: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200 hover:shadow-violet-300",
      gradientFrom: "from-violet-500/10",
      glowShadow: "hover:shadow-[0_15px_35px_-5px_rgba(124,58,237,0.12)]",
      borderColor: "hover:border-violet-200/80"
    };
  }
  
  if (
    normTitle.includes("logo") || 
    normTitle.includes("illustrator") || 
    normTitle.includes("vector") ||
    normCat.includes("logo") || 
    normCat.includes("design") || 
    normCat.includes("brand")
  ) {
    return {
      badge: "bg-rose-50 text-rose-700 border border-rose-200/60",
      accentText: "text-rose-600",
      buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 hover:shadow-rose-300",
      gradientFrom: "from-rose-500/10",
      glowShadow: "hover:shadow-[0_15px_35px_-5px_rgba(225,29,72,0.12)]",
      borderColor: "hover:border-rose-200/80"
    };
  }
  
  if (
    normTitle.includes("contact") || 
    normTitle.includes("support") || 
    normTitle.includes("call") || 
    normTitle.includes("customer") || 
    normTitle.includes("agent") ||
    normCat.includes("contact") || 
    normCat.includes("support") || 
    normCat.includes("customer")
  ) {
    return {
      badge: "bg-teal-50 text-teal-700 border border-teal-200/60",
      accentText: "text-teal-600",
      buttonBg: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 hover:shadow-teal-300",
      gradientFrom: "from-teal-500/10",
      glowShadow: "hover:shadow-[0_15px_35px_-5px_rgba(13,148,136,0.12)]",
      borderColor: "hover:border-teal-200/80"
    };
  }
  
  if (
    normTitle.includes("social") || 
    normTitle.includes("media") || 
    normTitle.includes("market") || 
    normTitle.includes("digital") || 
    normTitle.includes("facebook") || 
    normTitle.includes("instagram") ||
    normCat.includes("social") || 
    normCat.includes("media") || 
    normCat.includes("market")
  ) {
    return {
      badge: "bg-sky-50 text-sky-700 border border-sky-200/60",
      accentText: "text-sky-600",
      buttonBg: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200 hover:shadow-sky-300",
      gradientFrom: "from-sky-500/10",
      glowShadow: "hover:shadow-[0_15px_35px_-5px_rgba(2,132,199,0.12)]",
      borderColor: "hover:border-sky-200/80"
    };
  }
  
  // Default blue fallback style
  return {
    badge: "bg-blue-50 text-blue-700 border border-blue-200/60",
    accentText: "text-blue-600",
    buttonBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300",
    gradientFrom: "from-blue-500/10",
    glowShadow: "hover:shadow-[0_15px_35px_-5px_rgba(37,99,235,0.12)]",
    borderColor: "hover:border-blue-200/80"
  };
}

