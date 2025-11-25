#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get arguments
const [title, tags = ''] = process.argv.slice(2);

if (!title) {
  console.error('Usage: node new-post.mjs "Post Title" "tag1,tag2,tag3"');
  process.exit(1);
}

// Create slug from title
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .trim('-');

// Create folder path
const folderPath = path.join(__dirname, '..', 'src', 'content', 'blog', slug);
const filePath = path.join(folderPath, 'index.md');

// Create folder if it doesn't exist
if (fs.existsSync(folderPath)) {
  console.error(`Post "${slug}" already exists!`);
  process.exit(1);
}

fs.mkdirSync(folderPath, { recursive: true });

// Parse tags
const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : ['udemy'];

// Generate frontmatter
const now = new Date().toISOString();
const frontmatter = `---
title: "${title}"
description: "Brief description for SEO and meta tags"
pubDate: ${now}
tags:
${tagArray.map(tag => `  - ${tag}`).join('\n')}
image: /images/${slug}.jpg
affiliate_links:
  - text: "Course Name on Udemy"
    url: "https://trk.udemy.com/c/6564357/3227798/39854?prodsku=COURSE_ID"
---

## Introduction

Write your introduction here...

## Why This Topic Matters in 2026?

List key reasons why readers should care about this topic.

## Top Courses

### 1. Course Name

**Instructor**: Name  
**Rating**: X.X/5 (XXX,XXX+ students)  
**Duration**: XX hours  

Describe the course, its pros, and cons.

![Course Image](/images/course-screenshot.jpg)

## Conclusion

Summarize your recommendations and final thoughts.

---

*Disclosure: This post contains affiliate links. We may earn a commission if you purchase through our links, at no extra cost to you.*
`;

// Write file
fs.writeFileSync(filePath, frontmatter);

console.log(`✅ New post created: ${filePath}`);
console.log(`📝 Don't forget to:`);
console.log(`   1. Update the description`);
console.log(`   2. Add course image to public/images/${slug}.jpg`);
console.log(`   3. Update affiliate links with real course IDs`);
console.log(`   4. Write the actual content!`);
