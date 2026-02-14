// src/lib/courses.ts
// Course data structure and helper functions

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  originalPrice: string;
  couponCode: string;
  discount: string;
  rating: number;
  students: number;
  duration: number;
  resources: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  affiliateLink: string;
  imageUrl: string;
  lastVerified: string;
  expiresAt: string;
  marketDemand: 'high' | 'medium' | 'low';
  skillRelevance: 'high' | 'medium' | 'low';
  careerPath: {
    title: string;
    description: string;
    growth: string;
    salary: string;
  }[];
  alternatives: {
    title: string;
    reason: string;
    advantage?: string;
    consideration?: string;
  }[];
  learningOutcomes: string[];
  targetAudience: {
    icon: string;
    title: string;
    description: string;
  }[];
  pros: string[];
  cons: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
  reviews: {
    name: string;
    rating: number;
    date: string;
    text: string;
  }[];
  relatedCourses: string[];
}

// Sample course data - replace with your actual data source
const sampleCourses: Course[] = [
  {
    id: "1",
    slug: "complete-python-bootcamp",
    title: "Complete Python Bootcamp: From Zero to Hero",
    description: "Learn Python from scratch and build real-world applications with hands-on projects",
    instructor: "Jose Portilla",
    originalPrice: "$89.99",
    couponCode: "PYTHON2024",
    discount: "100% OFF",
    rating: 4.7,
    students: 350000,
    duration: 42,
    resources: 156,
    level: "Beginner",
    category: "Python",
    affiliateLink: "https://udemy.com/course/complete-python-bootcamp/?couponCode=PYTHON2024",
    imageUrl: "/images/python-bootcamp.jpg",
    lastVerified: "2024-12-15",
    expiresAt: "2024-12-31",
    marketDemand: "high",
    skillRelevance: "high",
    careerPath: [
      {
        title: "Python Developer",
        description: "Build web applications and automation scripts",
        growth: "High Growth",
        salary: "$80K-120K"
      },
      {
        title: "Data Scientist",
        description: "Analyze data and build ML models",
        growth: "Very High Growth",
        salary: "$100K-150K"
      },
      {
        title: "DevOps Engineer",
        description: "Automate infrastructure and deployment",
        growth: "High Growth",
        salary: "$90K-130K"
      }
    ],
    alternatives: [
      {
        title: "Python for Data Science",
        reason: "More focused on data analysis",
        advantage: "Better for data science careers"
      },
      {
        title: "Advanced Python Programming",
        reason: "For experienced programmers",
        consideration: "Requires prior programming knowledge"
      }
    ],
    learningOutcomes: [
      "Python fundamentals from scratch",
      "Object-oriented programming concepts",
      "Working with files and databases",
      "Building real-world applications",
      "Web scraping and automation",
      "Testing and debugging techniques"
    ],
    targetAudience: [
      {
        icon: "🎯",
        title: "Beginners",
        description: "No programming experience needed"
      },
      {
        icon: "💼",
        title: "Career Changers",
        description: "Transition into tech industry"
      },
      {
        icon: "🔧",
        title: "Developers",
        description: "Add Python to your skillset"
      }
    ],
    pros: [
      "Comprehensive curriculum",
      "Engaging teaching style",
      "Real-world projects",
      "Active community support",
      "Regular updates",
      "Lifetime access"
    ],
    cons: [
      "Pace might be slow for advanced users",
      "Limited advanced topics",
      "Some sections could use more depth"
    ],
    faqs: [
      {
        question: "Is this coupon really 100% free?",
        answer: "Yes! This is a legitimate Udemy coupon that gives you lifetime access to the course completely free."
      },
      {
        question: "How long do I have to enroll?",
        answer: "The coupon expires on December 31, 2024. We recommend enrolling as soon as possible to secure your free access."
      },
      {
        question: "What if I'm a complete beginner?",
        answer: "This course is designed for absolute beginners. No prior programming experience is required."
      }
    ],
    reviews: [
      {
        name: "John D.",
        rating: 5,
        date: "2 weeks ago",
        text: "Amazing course! Jose explains everything clearly. Best Python course I've taken."
      },
      {
        name: "Sarah M.",
        rating: 4,
        date: "1 month ago",
        text: "Great content and projects. Some sections could be more detailed, but overall excellent."
      },
      {
        name: "Mike R.",
        rating: 5,
        date: "3 weeks ago",
        text: "Perfect for beginners! I went from knowing nothing to building real applications."
      }
    ],
    relatedCourses: [
      "python-django-web-development",
      "python-data-science-bootcamp",
      "python-machine-learning"
    ]
  },
  {
    id: "2",
    slug: "web-development-bootcamp",
    title: "The Complete Web Development Bootcamp",
    description: "Learn HTML, CSS, JavaScript, React, Node.js and more in one comprehensive course",
    instructor: "Angela Yu",
    originalPrice: "$94.99",
    couponCode: "WEB2024",
    discount: "100% OFF",
    rating: 4.8,
    students: 280000,
    duration: 54,
    resources: 200,
    level: "Beginner",
    category: "Web Development",
    affiliateLink: "https://udemy.com/course/the-complete-web-development-bootcamp/?couponCode=WEB2024",
    imageUrl: "/images/web-dev-bootcamp.jpg",
    lastVerified: "2024-12-15",
    expiresAt: "2024-12-31",
    marketDemand: "high",
    skillRelevance: "high",
    careerPath: [
      {
        title: "Frontend Developer",
        description: "Build user interfaces and web applications",
        growth: "High Growth",
        salary: "$70K-110K"
      },
      {
        title: "Full Stack Developer",
        description: "Work on both frontend and backend",
        growth: "Very High Growth",
        salary: "$80K-140K"
      },
      {
        title: "UI/UX Developer",
        description: "Focus on user experience and design",
        growth: "High Growth",
        salary: "$75K-120K"
      }
    ],
    alternatives: [
      {
        title: "React - The Complete Guide",
        reason: "More focused on React development",
        advantage: "Deeper React coverage"
      },
      {
        title: "Node.js Master Class",
        reason: "For backend specialization",
        consideration: "Requires JavaScript knowledge"
      }
    ],
    learningOutcomes: [
      "HTML5 and CSS3 fundamentals",
      "JavaScript ES6+ features",
      "React and modern frontend frameworks",
      "Node.js and backend development",
      "Database design and management",
      "API development and integration"
    ],
    targetAudience: [
      {
        icon: "🎯",
        title: "Beginners",
        description: "No coding experience required"
      },
      {
        icon: "🎨",
        title: "Designers",
        description: "Learn to code your designs"
      },
      {
        icon: "💼",
        title: "Career Switchers",
        description: "Enter the tech industry"
      }
    ],
    pros: [
      "Comprehensive full-stack coverage",
      "Excellent project-based learning",
      "Clear explanations and examples",
      "Great community support",
      "Regular content updates",
      "Professional portfolio projects"
    ],
    cons: [
      "Very fast-paced for absolute beginners",
      "Some advanced topics could be deeper",
      "Requires significant time commitment"
    ],
    faqs: [
      {
        question: "Do I need any prior coding experience?",
        answer: "No, this course starts from absolute basics and builds up to advanced topics."
      },
      {
        question: "Will I build real projects?",
        answer: "Yes! You'll build multiple projects including a full-stack web application."
      },
      {
        question: "Is this course up to date?",
        answer: "Yes, the course is regularly updated with the latest web development trends."
      }
    ],
    reviews: [
      {
        name: "Alex K.",
        rating: 5,
        date: "1 week ago",
        text: "Best web development course! Angela is an amazing instructor."
      },
      {
        name: "Lisa T.",
        rating: 4,
        date: "2 weeks ago",
        text: "Great content but very intensive. Be prepared to dedicate serious time."
      }
    ],
    relatedCourses: [
      "react-complete-guide",
      "nodejs-master-class",
      "javascript-basics"
    ]
  }
];

// Helper functions
export async function getAllCourses(): Promise<Course[]> {
  // In a real implementation, this would fetch from a database or API
  return sampleCourses;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const courses = await getAllCourses();
  return courses.find(course => course.slug === slug) || null;
}

export async function getCoursesByCategory(category: string): Promise<Course[]> {
  const courses = await getAllCourses();
  return courses.filter(course => course.category === category);
}

export async function getRelatedCourses(course: Course): Promise<Course[]> {
  const courses = await getAllCourses();
  return courses.filter(c => 
    c.category === course.category && 
    c.id !== course.id
  ).slice(0, 3);
}
