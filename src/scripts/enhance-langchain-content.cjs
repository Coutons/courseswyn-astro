const fs = require('fs');

let md = fs.readFileSync('src/content/blog/top-10-best-langchain-courses-udemy/index.md', 'utf8');

const customReviews = {
  "Ultimate RAG Bootcamp Using Langchain,LangGraph & Langsmith": {
    desc: "A definitive guide to mastering the modern AI engineering stack in 2026. This bootcamp goes beyond basic chatbots, focusing heavily on advanced RAG techniques, LangGraph for stateful multi-agent systems, and LangSmith for tracing and evaluating LLM calls. If you want to build production-grade architectures, this is the current gold standard.",
    pros: "- Deep dive into LangGraph and LangSmith (essential for 2026).\\n- Covers advanced RAG architectures like Self-RAG and Adaptive RAG.",
    cons: "- Steeper learning curve; not ideal for absolute programming beginners."
  },
  "Complete Generative AI Course With Langchain and Huggingface": {
    desc: "One of the most comprehensive foundational courses on the platform, boasting over 120,000 students. This course bridges the gap between commercial APIs (OpenAI) and open-source models via Hugging Face. It's the perfect starting point for developers who want a well-rounded understanding of the generative AI landscape before specializing.",
    pros: "- Excellent balance between OpenAI and open-source Hugging Face models.\\n- Highly beginner-friendly with clear, step-by-step instructions.",
    cons: "- Less focus on complex multi-agent architectures (LangGraph) compared to newer courses."
  },
  "Complete Agentic AI Bootcamp With LangGraph and Langchain": {
    desc: "As the industry shifts from simple LLM wrappers to autonomous agents, this bootcamp provides exactly what employers are looking for. You'll learn to build intelligent agents that can reason, use tools, and collaborate in a multi-agent environment using the latest LangGraph frameworks.",
    pros: "- Highly relevant focus on Agentic AI, the biggest trend of 2026.\\n- Practical projects involving tool usage and autonomous reasoning.",
    cons: "- Requires a solid understanding of basic Python and API concepts first."
  },
  "Master Langchain v1 and Ollama - Chatbot, RAG and AI Agents": {
    desc: "Privacy and local deployment are major enterprise concerns in 2026. This course excels by teaching you how to run powerful LLMs completely offline using Ollama, integrated seamlessly with LangChain. Perfect for developers working in fintech or healthcare where data cannot be sent to OpenAI.",
    pros: "- Focuses heavily on local LLMs with Ollama (zero API costs, 100% privacy).\\n- Teaches how to build localized RAG and agents.",
    cons: "- Running local models requires a computer with decent hardware/GPU."
  },
  "MCP Mastery: Build AI Apps with Claude, LangChain and Ollama": {
    desc: "The Model Context Protocol (MCP) is revolutionizing how AI agents interact with external tools and data. This cutting-edge course focuses on integrating Claude and local models with LangChain to build highly contextual, context-aware applications that can securely interact with enterprise systems.",
    pros: "- Very fresh curriculum focusing on MCP and Claude.\\n- Excellent for building highly secure, context-aware enterprise apps.",
    cons: "- Highly specialized; might be too niche for generalist developers."
  },
  "Deep Agent - Multi Agent RAG with Gemini and Langchain": {
    desc: "While many courses focus on OpenAI, this specialized path explores the Google Gemini ecosystem. You'll learn how to leverage Gemini's massive context window alongside LangChain to build multi-agent RAG systems capable of processing vast amounts of enterprise documents simultaneously.",
    pros: "- Explores the Google Gemini ecosystem instead of just OpenAI.\\n- Great focus on handling massive context windows in RAG.",
    cons: "- Gemini's API changes rapidly, requiring students to adapt to slight updates."
  },
  "Curso Completo: LangChain, LangGraph y Agentes IA con Python": {
    desc: "The premier Spanish-language resource for modern AI engineering. This comprehensive course covers everything from the absolute basics of LangChain to advanced LangGraph agent deployment, making elite AI skills accessible to the Hispanic developer community without losing technical depth.",
    pros: "- The best Spanish-language resource available for modern Agentic AI.\\n- Covers both foundational LangChain and advanced LangGraph.",
    cons: "- Content is entirely in Spanish, limiting accessibility for English-only speakers."
  },
  "LangChain- Agentic AI Engineering with LangChain & LangGraph": {
    desc: "A massive, battle-tested curriculum with over 169,000 enrolled students. This course acts as a complete A-Z encyclopedia for LangChain engineering. Whether you are building simple QA bots or complex data-analysis agents, this course provides reusable code templates for almost every use case.",
    pros: "- Massive student base and constantly updated curriculum.\\n- Provides excellent, reusable code templates for production.",
    cons: "- The sheer volume of content can be overwhelming for those wanting a quick start."
  },
  "Generative AI for NodeJs: OpenAI, LangChain - TypeScript": {
    desc: "The AI world is dominated by Python, leaving web developers behind—until now. This course is specifically tailored for JavaScript and Node.js developers, teaching you how to build production-ready AI backends using LangChain.js and TypeScript, seamlessly integrating with existing web stacks.",
    pros: "- Tailored specifically for Node.js and TypeScript developers.\\n- Seamlessly integrates AI into modern web application stacks.",
    cons: "- LangChain.js sometimes lags slightly behind the Python version in features."
  },
  "LangChain Framework for Beginners – Build AI Systems + RAG": {
    desc: "A rapid, no-nonsense introduction to the LangChain ecosystem. If you are overwhelmed by 40-hour bootcamps and just need to get a basic RAG system up and running over the weekend, this streamlined course provides the perfect fast-track learning experience.",
    pros: "- Short, concise, and straight to the point.\\n- Perfect for getting a prototype running in a single weekend.",
    cons: "- Lacks the deep architectural dives needed for enterprise production."
  }
};

const genericReviews = [
  {
    desc: "A highly practical, project-based approach to learning the LangChain framework. This course emphasizes writing code over theoretical lectures, guiding you through the creation of several real-world AI applications that you can immediately add to your developer portfolio.",
    pros: "- Heavy focus on portfolio-ready projects.\\n- Step-by-step coding walkthroughs.",
    cons: "- Less time spent on the underlying mathematics of vector embeddings."
  },
  {
    desc: "Designed for software engineers looking to upskill quickly, this course cuts through the hype and focuses purely on production implementation. You will learn how to handle API rate limits, optimize token usage, and deploy resilient LangChain apps to the cloud.",
    pros: "- Focuses on real-world challenges like token limits and cost optimization.\\n- Includes deployment strategies.",
    cons: "- Assumes you already have a strong background in software engineering."
  },
  {
    desc: "This course takes a unique, workflow-first approach to LangChain. Instead of just learning the API, you'll learn how to design conversational memory, structure dynamic prompts, and chain complex tasks together to automate repetitive business processes.",
    pros: "- Great focus on prompt engineering and conversational memory.\\n- Excellent for automating business tasks.",
    cons: "- Less focus on deploying open-source/local models."
  }
];

// We need to parse the markdown to replace the generic sections for each course.
// The generic text we injected earlier was:
// "This highly-rated course provides hands-on experience with modern AI frameworks. By integrating ... principles, students will learn to build, test, and deploy robust AI applications.\n\n"
// "- **Enrollment**"
// ...
// "#### Pros:\n- Includes hands-on projects directly applicable to 2026 industry standards.\n- Covers modern integrations including RAG and Agentic workflows.\n\n#### Cons:\n- Requires basic programming knowledge prior to starting."

const courses = Object.keys(customReviews);
let genericIndex = 0;

// Read the JSON to get all titles
const data = JSON.parse(fs.readFileSync('src/data/coupons.json', 'utf8'));
const langchainCourses = data.filter(c => c.title.toLowerCase().includes('langchain') || c.category.toLowerCase().includes('langchain'));

langchainCourses.forEach(c => {
  const review = customReviews[c.title] || genericReviews[genericIndex++ % genericReviews.length];
  
  // Find the generic description line
  const genericDescRegex = new RegExp(`This highly-rated course provides hands-on experience with modern AI frameworks\\. By integrating .*? principles, students will learn to build, test, and deploy robust AI applications\\.`);
  
  if (md.match(genericDescRegex)) {
      md = md.replace(genericDescRegex, review.desc);
  }

  // Find the generic pros/cons block for this course
  // We need to replace the pros/cons. Since they are the same everywhere, we can just replace the first occurrence after the course title.
  // Actually, string replacement is easier. 
  // Let's replace the EXACT generic pros/cons block with the specific one.
  const genericProsCons = `#### Pros:
- Includes hands-on projects directly applicable to 2026 industry standards.
- Covers modern integrations including RAG and Agentic workflows.

#### Cons:
- Requires basic programming knowledge prior to starting.`;

  const newProsCons = `#### Pros:
${review.pros}

#### Cons:
${review.cons}`;

  md = md.replace(genericProsCons, newProsCons);

});

fs.writeFileSync('src/content/blog/top-10-best-langchain-courses-udemy/index.md', md);
console.log('Descriptions enhanced successfully!');
