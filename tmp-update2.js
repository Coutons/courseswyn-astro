import fs from 'fs';
let content = fs.readFileSync('src/content/blog/top-10-best-generative-ai-courses-udemy/index.md', 'utf8');

content = content.replace(/### (.*?)\n/g, '\n\n### $1\n\n');
content = content.replace(/## (.*?)\n/g, '\n\n## $1\n\n');

fs.writeFileSync('src/content/blog/top-10-best-generative-ai-courses-udemy/index.md', content);
console.log("Blank lines added!");
