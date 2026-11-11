/**
 * Featured-image design config, one entry per blog post.
 *
 * keyword : oversized outline word on the right (2-10 chars, UPPERCASE)
 * lines   : 2-line headline, each line must fit ~620px at 60px Space Grotesk
 * category: pill label, top right (UPPERCASE, keep <= 16 chars)
 * kicker  : mono line above the headline (<= 34 chars reads best)
 *
 * Rules of thumb:
 *  - keyword should be the thing a reader recognises at 300px wide, not a full title
 *  - headline is a short label, not the SEO title; full title lives in <title>
 *  - avoid two posts sharing the same keyword where both are likely to appear in one grid
 */

export const POST_SPECS = {
  // ---- Generative AI / LLM ----
  'top-10-best-generative-ai-courses-udemy': {
    keyword: 'GEN AI',
    lines: ['Generative AI', 'Courses on Udemy'],
    category: 'GENERATIVE AI',
    kicker: '2027 GUIDE \u00b7 LIVE COURSE DATA',
  },
  'best-rag-courses-on-udemy': {
    keyword: 'RAG',
    lines: ['Best RAG Courses', 'on Udemy'],
    category: 'GENERATIVE AI',
    kicker: 'TECHNICAL ANALYSIS \u00b7 8 PICKS',
  },
  'top-10-best-langchain-courses-udemy': {
    keyword: 'CHAIN',
    lines: ['LangChain Courses', 'Ranked by Engineers'],
    category: 'GENERATIVE AI',
    kicker: 'LANGGRAPH \u00b7 RAG \u00b7 MCP',
  },
  'best-langchain-langgraph-courses-udemy-2026-rag-agents-production': {
    keyword: 'LANG',
    lines: ['LangChain &', 'LangGraph Courses'],
    category: 'GENERATIVE AI',
    kicker: 'RAG \u00b7 AGENTS \u00b7 PRODUCTION',
  },
  'best-prompt-engineering-courses-udemy-2026': {
    keyword: 'PROMPT',
    lines: ['Prompt Engineering', 'Courses on Udemy'],
    category: 'GENERATIVE AI',
    kicker: 'RANKED \u00b7 UPDATED 2026',
  },
  'top-10-generative-ai-bootcamps-udemy-2026': {
    keyword: 'BOOT',
    lines: ['GenAI Bootcamps', 'on Udemy'],
    category: 'GENERATIVE AI',
    kicker: 'CHATGPT TO LLM AGENTS',
  },
  'best-udemy-multimodal-ai-courses-2026': {
    keyword: 'MULTI',
    lines: ['Multimodal AI', 'Courses on Udemy'],
    category: 'GENERATIVE AI',
    kicker: 'VISION \u00b7 AUDIO \u00b7 RAG',
  },
  'best-udemy-ai-personalization-courses-2026': {
    keyword: 'RECS',
    lines: ['AI Personalization', 'Courses on Udemy'],
    category: 'GENERATIVE AI',
    kicker: 'RECOMMENDER SYSTEMS \u00b7 2026',
  },
  'best-chatgpt-courses-udemy-2026': {
    keyword: 'GPT',
    lines: ['ChatGPT Courses', 'on Udemy'],
    category: 'GENERATIVE AI',
    kicker: 'GPT-6 ASTRA UPDATE',
  },
  'best-free-ai-courses-2026': {
    keyword: 'FREE',
    lines: ['Free AI Courses', 'That Are Worth It'],
    category: 'GENERATIVE AI',
    kicker: '8 COURSES \u00b7 ZERO COST',
  },

  // ---- AI agents / MCP / automation ----
  'best-udemy-agentic-ai-courses-2026': {
    keyword: 'AGENT',
    lines: ['Agentic AI', 'Courses on Udemy'],
    category: 'AI AGENTS',
    kicker: 'RANKED BY REAL REVIEWS',
  },
  'best-crewai-courses-udemy-2026': {
    keyword: 'CREW',
    lines: ['CrewAI Courses', 'for Automation'],
    category: 'AI AGENTS',
    kicker: '6 COURSES \u00b7 MULTI-AGENT',
  },
  'top-10-best-mcp-courses-udemy-2026': {
    keyword: 'MCP',
    lines: ['MCP Courses', 'on Udemy'],
    category: 'AI AGENTS',
    kicker: 'MODEL CONTEXT PROTOCOL',
  },
  'model-context-protocol-mcp-agentic-ai': {
    keyword: 'PROTO',
    lines: ['Model Context', 'Protocol Explained'],
    category: 'EXPLAINER',
    kicker: 'AGENTIC AI ARCHITECTURE',
  },
  'what-is-agentic-ai-architecture-mcp-use-cases': {
    keyword: 'ARCH',
    lines: ['What Is', 'Agentic AI?'],
    category: 'EXPLAINER',
    kicker: 'ARCHITECTURE \u00b7 MCP \u00b7 USE CASES',
  },
  'best-ai-agents': {
    keyword: 'TOOLS',
    lines: ['18 Best AI Agents', 'for Your Workflow'],
    category: 'AI TOOLS',
    kicker: 'COMPARED \u00b7 NOV 2026',
  },
  'best-ai-for-automation-courses-udemy-2026': {
    keyword: 'AUTO',
    lines: ['AI Automation', 'Courses on Udemy'],
    category: 'AUTOMATION',
    kicker: 'QA \u00b7 AGENTIC \u00b7 n8n',
  },
  'top-10-best-n8n-courses-udemy-2026': {
    keyword: 'N8N',
    lines: ['n8n Courses', 'on Udemy'],
    category: 'AUTOMATION',
    kicker: 'WORKFLOW AUTOMATION \u00b7 2026',
  },
  'openclaw-courses-udemy': {
    keyword: 'OPENCLAW',
    lines: ['OpenClaw Courses', 'on Udemy'],
    category: 'AI AGENTS',
    kicker: 'AUTONOMOUS AGENTS \u00b7 2026',
  },
  'ai-engineer-agentic-track-ed-donner-review': {
    keyword: 'DONNER',
    lines: ['Agentic Track', 'Course Review'],
    category: 'REVIEW',
    kicker: 'ED DONNER \u00b7 HANDS-ON TESTED',
  },

  // ---- AI coding tools ----
  'best-cursor-ai-courses-udemy': {
    keyword: 'CURSOR',
    lines: ['Cursor AI', 'Courses on Udemy'],
    category: 'AI CODING',
    kicker: 'VIBE CODING \u00b7 MCP \u00b7 2026',
  },
  'best-github-copilot-courses-udemy': {
    keyword: 'COPILOT',
    lines: ['GitHub Copilot', 'Courses on Udemy'],
    category: 'AI CODING',
    kicker: 'AGENTIC IDE \u00b7 2026',
  },
  'best-udemy-claude-code-courses-2026': {
    keyword: 'CLAUDE',
    lines: ['Claude Code', 'Courses on Udemy'],
    category: 'AI CODING',
    kicker: 'ANTHROPIC \u00b7 MCP \u00b7 2026',
  },
  'best-windsurf-courses-udemy-2026': {
    keyword: 'WINDSURF',
    lines: ['Windsurf Courses', 'on Udemy'],
    category: 'AI CODING',
    kicker: 'VIBE CODING \u00b7 CASCADE AI',
  },
  'top-vibe-coding-courses-udemy': {
    keyword: 'VIBE',
    lines: ['Vibe Coding', 'Courses on Udemy'],
    category: 'AI CODING',
    kicker: 'PROMPT TO PRODUCTION',
  },
  'best-ai-web-development-courses-udemy-2026': {
    keyword: 'WEB',
    lines: ['AI Web Dev', 'Courses on Udemy'],
    category: 'DEVELOPMENT',
    kicker: 'CURSOR \u00b7 COPILOT \u00b7 WINDSURF',
  },
  'top-8-ai-powered-web-development-courses-udemy-2026': {
    keyword: 'DEV',
    lines: ['AI-Powered', 'Web Development'],
    category: 'DEVELOPMENT',
    kicker: '8 COURSES \u00b7 RANKED',
  },

  // ---- Security / governance / certification ----
  'best-udemy-cybersecurity-courses-with-ai-integration-for-2026': {
    keyword: 'SEC',
    lines: ['Cybersecurity', 'Courses with AI'],
    category: 'SECURITY',
    kicker: 'REVIEWED \u00b7 UPDATED NOV 2026',
  },
  'best-ai-certification-courses-udemy': {
    keyword: 'CERT',
    lines: ['AI Certification', 'Courses Ranked'],
    category: 'CERTIFICATION',
    kicker: 'AZURE \u00b7 AWS \u00b7 GOOGLE CLOUD',
  },
  'best-aws-certification-courses-2026': {
    keyword: 'AWS',
    lines: ['Best AWS', 'Certification Courses'],
    category: 'CERTIFICATION',
    kicker: 'RANKED \u00b7 EXAM VOUCHERS',
  },
  'claude-certified-architect-courses-on-udemy': {
    keyword: 'CCA',
    lines: ['Claude Certified', 'Architect Courses'],
    category: 'CERTIFICATION',
    kicker: 'CCA-F \u00b7 ANTHROPIC',
  },
  'aigp-exam-prep-2026': {
    keyword: 'AIGP',
    lines: ['AIGP Exam Prep', 'Courses Reviewed'],
    category: 'CERTIFICATION',
    kicker: 'IAPP \u00b7 AI GOVERNANCE',
  },
  'reviews-udemy-ai-governance-professional-aigp-certification-masterclass-course': {
    keyword: 'GOV',
    lines: ['AIGP Masterclass', 'Course Review'],
    category: 'REVIEW',
    kicker: 'AI GOVERNANCE \u00b7 TESTED',
  },

  // ---- Cloud / data / engineering ----
  'cloud-computing-courses-udemy-2026': {
    keyword: 'CLOUD',
    lines: ['Cloud Computing', 'Courses on Udemy'],
    category: 'CLOUD',
    kicker: 'AWS \u00b7 AZURE \u00b7 GCP',
  },
  'best-aws-ai-courses-udemy-2026': {
    keyword: 'AIF',
    lines: ['AWS AI Courses', 'AIF-C01 & Bedrock'],
    category: 'CLOUD',
    kicker: 'AIF-C01 \u00b7 AIB-C01 \u00b7 BEDROCK',
  },
  'best-data-science-courses-udemy': {
    keyword: 'DATA',
    lines: ['Data Science', 'Courses on Udemy'],
    category: 'DATA SCIENCE',
    kicker: 'PYTHON \u00b7 ML \u00b7 ANALYTICS',
  },
  'best-sql-courses-2026': {
    keyword: 'SQL',
    lines: ['SQL Courses', 'on Udemy'],
    category: 'DATA',
    kicker: 'MYSQL \u00b7 POSTGRES \u00b7 DESIGN',
  },
  'best-udemy-mlops-courses-2026': {
    keyword: 'MLOPS',
    lines: ['MLOps Courses', 'Tested & Ranked'],
    category: 'ML ENGINEERING',
    kicker: '8 COURSES \u00b7 PRODUCTION AI',
  },
  'top-ai-and-machine-learning-courses-on-udemy-2026': {
    keyword: 'ML',
    lines: ['AI & Machine', 'Learning Courses'],
    category: 'MACHINE LEARNING',
    kicker: 'REVIEWED \u00b7 RANKED 2026',
  },
  'top-5-best-reinforcement-learning-courses': {
    keyword: 'RL',
    lines: ['Reinforcement', 'Learning Courses'],
    category: 'MACHINE LEARNING',
    kicker: 'DEEP RL \u00b7 PYTORCH',
  },
  'best-ollama-local-ai-udemy-2026': {
    keyword: 'LOCAL',
    lines: ['Ollama &', 'Local AI Courses'],
    category: 'LOCAL AI',
    kicker: 'RUN LLMs OFFLINE',
  },
  'top-ai-integration-courses-on-udemy': {
    keyword: 'STACK',
    lines: ['AI Integration', 'Courses on Udemy'],
    category: 'ENTERPRISE AI',
    kicker: 'GENAI \u00b7 MLOPS \u00b7 STRATEGY',
  },

  // ---- Web dev / programming ----
  '10-best-java-spring-courses-udemy-2025': {
    keyword: 'JAVA',
    lines: ['Java Spring', 'Courses on Udemy'],
    category: 'DEVELOPMENT',
    kicker: '37 COURSES \u00b7 RANKED FOR 2026',
  },
  'best-react-nextjs-courses-2026': {
    keyword: 'REACT',
    lines: ['React & Next.js', 'Courses on Udemy'],
    category: 'FRONTEND',
    kicker: 'DEVELOPER ROADMAP 2026',
  },
  'top-10-python-courses-on-udemy': {
    keyword: 'PY',
    lines: ['Python Courses', 'on Udemy'],
    category: 'DEVELOPMENT',
    kicker: 'TOP 10 \u00b7 RANKED 2026',
  },
  'best-data-structures-algorithms-udemy-2026': {
    keyword: 'DSA',
    lines: ['DSA Courses', 'Ranked for FAANG'],
    category: 'INTERVIEW PREP',
    kicker: '11 COURSES \u00b7 TESTED',
  },
  'angela-yu-100-days-code-review-2026': {
    keyword: '100',
    lines: ["Angela Yu's", '100 Days of Code'],
    category: 'REVIEW',
    kicker: 'PYTHON BOOTCAMP \u00b7 TESTED',
  },

  // ---- Design / creator / productivity ----
  'best-udemy-figma-courses-2026': {
    keyword: 'FIGMA',
    lines: ['Figma Courses', 'for UI/UX'],
    category: 'DESIGN',
    kicker: 'NO-CODE WEB DESIGN',
  },
  'best-udemy-canva-ai-courses-2026': {
    keyword: 'CANVA',
    lines: ['Canva AI Courses', 'on Udemy'],
    category: 'DESIGN',
    kicker: 'MAGIC STUDIO \u00b7 2026',
  },
  'top-blender-courses-udemy-2026': {
    keyword: '3D',
    lines: ['Blender Courses', 'on Udemy'],
    category: '3D DESIGN',
    kicker: 'MODELING \u00b7 RENDER \u00b7 2026',
  },
  'best-udemy-ai-video-courses-2026-monetize-tiktok-youtube-fast': {
    keyword: 'VIDEO',
    lines: ['AI Video Courses', 'Monetize Fast'],
    category: 'CREATOR',
    kicker: 'TIKTOK \u00b7 YOUTUBE SHORTS',
  },
  'best-udemy-notebooklm-courses-2026': {
    keyword: 'NOTEBOOK',
    lines: ['NotebookLM', 'Courses on Udemy'],
    category: 'AI TOOLS',
    kicker: 'GOOGLE GEMINI \u00b7 RESEARCH',
  },
  'best-excel-courses-on-udemy': {
    keyword: 'XLSX',
    lines: ['Excel Courses', 'on Udemy'],
    category: 'PRODUCTIVITY',
    kicker: '15 PICKS \u00b7 RANKED',
  },
  'best-business-courses-udemy-2026': {
    keyword: 'BIZ',
    lines: ['Business Courses', 'on Udemy'],
    category: 'BUSINESS',
    kicker: 'MANAGEMENT \u00b7 LEADERSHIP',
  },
  'best-digital-marketing-with-ai-courses-2026': {
    keyword: 'MKTG',
    lines: ['Digital Marketing', 'with AI'],
    category: 'MARKETING',
    kicker: 'BEGINNER FRIENDLY \u00b7 2026',
  },
  'best-udemy-genai-marketing-courses-beginners-2026': {
    keyword: 'GROWTH',
    lines: ['GenAI Marketing', 'for Beginners'],
    category: 'MARKETING',
    kicker: 'BEGINNER FRIENDLY \u00b7 2026',
  },
  'spanish-language-course': {
    keyword: 'ES',
    lines: ['Spanish Courses', 'on Udemy'],
    category: 'LANGUAGES',
    kicker: '10 COURSES \u00b7 IN SPANISH',
  },
  'top-10-best-nft-courses-udemy-2026': {
    keyword: 'NFT',
    lines: ['NFT Courses', 'on Udemy'],
    category: 'WEB3',
    kicker: 'BLOCKCHAIN \u00b7 2026',
  },
  'top-blockchain-courses-udemy': {
    keyword: 'BLOCK',
    lines: ['Blockchain Courses', 'for Beginners'],
    category: 'WEB3',
    kicker: '8 COURSES \u00b7 BEGINNER',
  },

  // ---- Career / buyer guides / platform ----
  'ai-engineer-roadmap-2026': {
    keyword: 'AI ENG',
    lines: ['AI Engineer', 'Roadmap 2026'],
    category: 'CAREER',
    kicker: '7 COURSES \u00b7 AGENTS, MCP, RAG',
  },
  'best-ai-engineer-courses-udemy-2026': {
    keyword: 'LLM',
    lines: ['AI Engineer', 'Courses on Udemy'],
    category: 'CAREER',
    kicker: '5 COURSES \u00b7 LLM, RAG, AGENTS',
  },
  'the-complete-ai-curriculum': {
    keyword: 'ROADMAP',
    lines: ['Complete AI', 'Curriculum 2026'],
    category: 'CAREER',
    kicker: 'ED DONNER \u00b7 FULL ROADMAP',
  },
  'best-udemy-courses-2026': {
    keyword: 'TOP 70',
    lines: ['Best Udemy Courses', 'Ranked for 2026'],
    category: 'BUYER GUIDE',
    kicker: '70 COURSES \u00b7 REAL STUDENT DATA',
  },
  'how-to-get-udemy-courses-for-free': {
    keyword: '$0',
    lines: ['Udemy Courses', 'for Free'],
    category: 'BUYER GUIDE',
    kicker: '7 LEGAL METHODS',
  },
  'is-udemy-worth-it': {
    keyword: '2026',
    lines: ['Is Udemy', 'Still Worth It?'],
    category: 'REVIEW',
    kicker: 'HONEST REVIEW \u00b7 2026',
  },
  'udemy-personal-plan-review-2026': {
    keyword: 'PLAN',
    lines: ['Udemy Personal', 'Plan Review'],
    category: 'REVIEW',
    kicker: 'PRICING \u00b7 WORTH IT?',
  },
  'udemy-vs-coursera-vs-pluralsight': {
    keyword: 'VS',
    lines: ['Udemy vs Coursera', 'vs Pluralsight'],
    category: 'COMPARISON',
    kicker: 'WHICH PLATFORM WINS',
  },
  'udemy-vs-linkedin-learning': {
    keyword: 'LINKED',
    lines: ['Udemy vs', 'LinkedIn Learning'],
    category: 'COMPARISON',
    kicker: 'VALUE FOR MONEY \u00b7 2026',
  },
  'udemy-black-friday-2026': {
    keyword: '95%',
    lines: ['Udemy Black Friday', '2026 Deals'],
    category: 'DEALS',
    kicker: '25 COURSES \u00b7 DATES INSIDE',
  },
  'udemy-flash-sale': {
    keyword: 'SALE',
    lines: ['Udemy Flash Sale', 'Calendar 2026'],
    category: 'DEALS',
    kicker: 'DATES \u00b7 PRICES \u00b7 CALENDAR',
  },
  'udemy-chatgpt-integration-review': {
    keyword: 'APPS',
    lines: ['Udemy Inside', 'ChatGPT'],
    category: 'EXPLAINER',
    kicker: 'HOW TO ACCESS COURSES',
  },
  'astro-showcase-courseswyn': {
    keyword: 'ASTRO',
    lines: ['CoursesWyn in the', 'Astro Showcase'],
    category: 'BUILD LOG',
    kicker: 'HOW WE SHIPPED IT',
  },
};

/* ------------------------------------------------------------------ *
 * Static pages (output file = <name>.jpg, no 600px card variant).
 * Same design system; keywords are deliberately short so the page
 * images never read as blog posts.
 * ------------------------------------------------------------------ */
export const PAGE_SPECS = {
  'og-default': {
    keyword: 'UDEMY',
    lines: ['Verified Udemy', 'Coupons & Reviews'],
    category: 'COURSESWYN',
    kicker: 'CHECKED BEFORE YOU PAY',
  },
  'og-home': {
    keyword: 'DEALS',
    lines: ['Udemy Coupons,', 'Verified Daily'],
    category: 'COUPONS',
    kicker: 'PRICE-CHECKED EVERY MORNING',
  },
  'og-blog': {
    keyword: 'BLOG',
    lines: ['Reviews &', 'Buying Guides'],
    category: 'ARTICLES',
    kicker: 'TESTED \u00b7 RANKED \u00b7 UPDATED',
  },
  'og-udemy-coupon-code': {
    keyword: 'CODE',
    lines: ['Udemy Coupon', 'Codes, Verified'],
    category: 'COUPONS',
    kicker: 'CHECKED BEFORE YOU PAY',
  },
  'og-udemy-coupons-today': {
    keyword: 'TODAY',
    lines: ['Udemy Deals', 'Live Today'],
    category: 'DEALS',
    kicker: 'UPDATED EVERY MORNING',
  },
  'og-udemy-coupons-guide': {
    keyword: 'GUIDE',
    lines: ['Udemy Coupon', 'Guide 2026'],
    category: 'EXPLAINER',
    kicker: 'HOW COUPONS ACTUALLY WORK',
  },
  'og-how-to-redeem': {
    keyword: 'APPLY',
    lines: ['How to Redeem', 'a Udemy Coupon'],
    category: 'HOW-TO',
    kicker: 'STEP BY STEP \u00b7 3 MINUTES',
  },
  'og-how-we-test': {
    keyword: 'TEST',
    lines: ['How We Verify', 'Every Coupon'],
    category: 'METHODOLOGY',
    kicker: 'OUR TESTING STANDARD',
  },
  'og-vouchers-certification': {
    keyword: 'CERT',
    lines: ['Certification', 'Exam Vouchers'],
    category: 'VOUCHERS',
    kicker: 'AWS \u00b7 COMPTIA \u00b7 MICROSOFT',
  },
  'og-vouchers-aws': {
    keyword: 'AWS',
    lines: ['AWS Exam', 'Vouchers'],
    category: 'VOUCHERS',
    kicker: 'PRICES \u00b7 DISCOUNTS \u00b7 TIPS',
  },
  'og-vouchers-comptia': {
    keyword: 'COMPTIA',
    lines: ['CompTIA Exam', 'Vouchers'],
    category: 'VOUCHERS',
    kicker: 'A+ \u00b7 NETWORK+ \u00b7 SECURITY+',
  },
  'og-vouchers-microsoft': {
    keyword: 'MS',
    lines: ['Microsoft Exam', 'Vouchers'],
    category: 'VOUCHERS',
    kicker: 'AZ \u00b7 MS \u00b7 SC EXAMS',
  },
};
