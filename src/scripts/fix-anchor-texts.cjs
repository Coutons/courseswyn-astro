const fs = require('fs');
let md = fs.readFileSync('src/content/blog/top-10-best-langchain-courses-udemy/index.md', 'utf8');

// Array of varied CTA templates
const ctaTemplates = [
  'Enroll in {TITLE} with 90% Off',
  'View {TITLE} Course Details',
  'Start Learning {TITLE} on Udemy',
  'Get the {TITLE} Discount',
  'Check out {TITLE} Syllabus',
  'Join {TITLE} Today',
  'Master LangChain with {TITLE}'
];

let i = 0;
md = md.replace(/\[Enroll Now with 90% Off\]\((.*?)\)/g, (match, url) => {
  // Extract a readable title from the slug
  let slug = url.split('/').pop();
  let readableTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Sometimes slugs are very long, if it's over 30 chars, just truncate it for the CTA
  if (readableTitle.length > 30) {
      readableTitle = readableTitle.substring(0, 30) + '...';
  }

  let cta = ctaTemplates[i % ctaTemplates.length].replace('{TITLE}', readableTitle);
  i++;
  
  return `[${cta}](${url})`;
});

fs.writeFileSync('src/content/blog/top-10-best-langchain-courses-udemy/index.md', md);
console.log('Anchor texts updated successfully!');
