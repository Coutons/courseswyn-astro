# CoursesWyn Build with Astro.js - Real-Time Udemy Course Reviews 2026

![CoursesWyn](https://courseswyn.com/images/generative-ai-dashboard.svg)

**Live Site** → https://courseswyn.com  
**Stack** → Astro 5 + Tailwind CSS + Markdown + Schema.org LD+JSON

CoursesWyn is an independent Udemy review site that pulls **real-time enrollment numbers, ratings, and sale prices** directly from Udemy dashboards — updated monthly (January 2026 data verified).

Every article includes:
- Comparison tables
- Table of Contents + FAQ
- Real student outcomes & portfolio projects
- Transparent affiliate disclosure

### Latest Reviews (2026)
- [Top 10 Python AI Courses on Udemy 2026](https://courseswyn.com/top-10-python-courses-on-udemy/)
- [Top 8 AI-Powered Web Development Courses on Udemy 2026](https://courseswyn.com/top-8-ai-powered-web-development-courses-udemy-2026/)
- [Top 10 Generative AI Bootcamps on Udemy 2026](https://courseswyn.com/top-10-generative-ai-bootcamps-udemy-2026/)

### Features
- Blazing fast static site with Astro 4
- Tailwind CSS + dark/light mode toggle
- Full Schema.org structured data (BlogPosting + Review)
- Modern numbered pagination
- Mobile-first, responsive design
- Vercel-ready deployment

### Run Locally
```bash
git clone https://github.com/Coutons/courseswyn-astro.git
cd courseswyn-astro
npm install
npm run dev
```

### Manual Maintenance Tasks

#### Adding New Courses
1. Edit `src/data/coupons.json`
2. Add new course object with required fields:
   - `slug`: URL-friendly identifier
   - `title`: Course title
   - `description`: Course description
   - `price`: Current discounted price (e.g., "9.99")
   - `originalPrice`: Original price (e.g., "$74.99")
   - Other fields: image, provider, instructor, category, rating, students, etc.
3. After adding, run: `npm run update-discounts`
   - This automatically calculates the `discount` field based on price and originalPrice

#### Updating Course Data
- Run `npm run update-discounts` after any manual changes to price/originalPrice
- Update ratings, student counts, expiry dates manually as needed

#### Content Management
- Blog posts: Add new `.md` files to `src/content/blog/` directories
- Static pages: Edit `.astro` files in `src/pages/`
- Images: Place in `public/images/` or `src/assets/images/`

#### Deployment
- Build: `npm run build`
- Preview: `npm run preview`
- Deploy to Vercel or your preferred platform

#### Badge System
- **Free courses** (100% off): Automatically show "Highest Rated" badge (purple star ⭐)
- **Paid courses**: Show "Best Seller" badge (yellow trophy 🏆)
- Badges appear on course cards and detail pages

### Contributing
Contributions welcome!
Feel free to open issues, submit PRs, or help update enrollment data every month.

### Licence
MIT — free to use, modify, or fork as your own review site template.

Made with ❤️ for the global learning community
Visit the live site → https://courseswyn.com
#Udemy #Astro #TailwindCSS #WebDev #AI #Python #2026
