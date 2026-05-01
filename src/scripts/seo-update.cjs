const fs = require('fs');
let md = fs.readFileSync('src/content/blog/best-data-structures-algorithms-udemy-2026/index.md', 'utf8');

// 1. Update enrollments
md = md.replace('- **Enrollment**: 400,000+ students', '- **Enrollment**: ~220,000+ students');
md = md.replace('- **Enrollment**: 300,000+ students', '- **Enrollment**: ~150,000+ students');
md = md.replace('- **Enrollment**: 150,000+ students', '- **Enrollment**: ~50,000+ students');

// Also update the Comparison table enrollments
md = md.replace('| 400,000+ |', '| ~220,000+ |');
md = md.replace('| 300,000+ |', '| ~150,000+ |');
md = md.replace('| 150,000+ |', '| ~50,000+ |');

// 2. Update Salary Claims
md = md.replace('currently offer average starting salaries exceeding $150,000 annually.', 'especially at top tech companies, often offer total compensation exceeding $180,000–$250,000 for new graduates in 2026.');
md = md.replace('which offer an average starting salary exceeding $150,000 according to 2026 industry employment data.', 'which offer total compensation exceeding $180,000–$250,000 according to 2026 top-tier tech industry data.');

// 3. Update Image Alt Texts
md = md.replace(/!\[([^\]]+)\]\(/g, '![$1 Udemy Course 2026](');

// 4. Schema Markup
const schema = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is the optimal data structures course for beginners on Udemy in 2026?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Abdul Bari's C/C++ course provides exceptional foundational clarity, while Colt Steele's JavaScript Masterclass serves as the optimal starting point for modern web developers."
    }
  }, {
    "@type": "Question",
    "name": "Are Udemy courses enough to pass FAANG interviews?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "While Udemy courses provide an excellent foundation and strategic frameworks, passing FAANG interviews requires extensive active practice. You should supplement your course learning with rigorous practice on platforms like LeetCode or HackerRank."
    }
  }, {
    "@type": "Question",
    "name": "How long does it take to learn DSA for coding interviews?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "For a complete beginner, achieving interview readiness typically takes 3 to 6 months of consistent study (10-15 hours per week). This includes completing a core Udemy course to understand the fundamentals, followed by solving LeetCode problems."
    }
  }]
}
</script>
`;

if (!md.includes('<script type="application/ld+json">')) {
  md += '\n\n' + schema;
}

fs.writeFileSync('src/content/blog/best-data-structures-algorithms-udemy-2026/index.md', md);
console.log('Done');
