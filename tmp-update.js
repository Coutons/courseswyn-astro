import fs from 'fs';
let content = fs.readFileSync('src/content/blog/top-10-best-generative-ai-courses-udemy/index.md', 'utf8');

content = content.replace(/<h3 class="text-2xl md:text-4xl font-black text-white mb-2 pt-6">(.*?)<\/h3>/g, '### $1');
content = content.replace(/<h2 class="text-3xl font-black text-white mb-6 uppercase tracking-widest border-b border-white\/10 pb-4">Detailed Course Comparison Data<\/h2>/g, '## Detailed Course Comparison Data');
content = content.replace(/<h2 class="text-3xl font-black text-white mb-8 uppercase tracking-widest border-b border-white\/10 pb-4">🛑 FREQUENTLY ASKED QUESTIONS \(Read Before Buying!\)<\/h2>/g, '## 🛑 FREQUENTLY ASKED QUESTIONS (Read Before Buying!)');

fs.writeFileSync('src/content/blog/top-10-best-generative-ai-courses-udemy/index.md', content);
console.log("Replaced successfully!");
