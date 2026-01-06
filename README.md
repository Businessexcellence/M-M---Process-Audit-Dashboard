# M&M Recruitment Process Audit Dashboard

## 🎯 Project Overview

A comprehensive, real-time QA insights dashboard for monitoring and analyzing the M&M recruitment process audit data. This dashboard provides detailed analytics, visualizations, and actionable recommendations to improve recruitment quality and efficiency.

### Key Features

✅ **Excel Data Import** - Upload and validate Excel files with real-time progress tracking  
✅ **Smart Column Detection** - Financial Year automatically extracted from Column B of Audit Count sheet  
✅ **Real-time Metrics** - Track accuracy, error rates, audit counts, and sample coverage  
✅ **Interactive Visualizations** - Multiple chart types including line, bar, heatmap, scatter, and funnel charts  
✅ **Multi-dimensional Filtering** - Filter by year, month, week, stage, and parameter  
✅ **Stage & Parameter Analysis** - Heatmap view with top/worst parameter identification  
✅ **Recruiter Performance** - Individual recruiter metrics with quadrant analysis  
✅ **Comparison View** - Side-by-side performance comparisons  
✅ **Trend Analysis** - Historical trends and predictive analytics  
✅ **RCA/CAPA Tracking** - Root Cause Analysis and Corrective Actions management  
✅ **Six Sigma Projects** - DMAIC project tracking and metrics  
✅ **Best Practices** - Industry benchmark comparisons (Google, Amazon, Microsoft, LinkedIn)  
✅ **User Manual** - Complete dashboard creation documentation  
✅ **AI-Powered Insights** - Dynamic narrative generation and recommendations  
✅ **Dark/Light Theme** - Full-page theme toggle with persistent preferences  
✅ **PDF Export** - Generate downloadable reports  
✅ **Audio Commands** - Accessibility feature with voice announcements  
✅ **Creative UI Enhancements** - FAB menu, Quick Stats widget, Breadcrumbs, Search panel  
✅ **M&M Branding** - Custom red and white theme with professional styling

## 🌐 URLs

**Development Dashboard**: https://3000-ile3zkyblze0f5esem0nb-2e1b9533.sandbox.novita.ai

**GitHub Repository**: https://github.com/Businessexcellence/M-M---Process-Audit-Dashboard

**Production**: (Deploy to Cloudflare Pages for production URL)

## 📊 Data Architecture

### Data Models

The dashboard expects Excel files with the following structure:

#### Required Sheets:

1. **Audit Count** - Main audit data with dimensions and metrics
   - Dimensions: Client, Financial Year, Month, Month Number, Week, Recruitment Stage, Parameter, Recruiter Name, Program Manager, Req ID
   - Metrics: Total Population, Opportunity Count, Opportunity Pass, Opportunity Fail, Opportunity NA, Accuracy Score, Error Rate, Sample Count

2. **FY23** - FY23 weekly figures
   - Week, Total Opportunities, Accuracy Score, Sample Size

3. **FY24** - FY24 weekly figures (optional)
   - Week, Total Opportunities, Accuracy Score, Sample Size

4. **Recruiter Wise Data** - Recruiter-level audit scores
   - Recruiter Name, Accuracy Score, Error Count, Sample Count, Program Manager

5. **Sheet3/Sheet5** - Parameter and error tables
   - Parameter, Total Errors, Error counts by recruiter

6. **RCA Or CAPA** - Root Cause Analysis and Corrective Actions
   - Type, Project ID, Issue Description, Root Cause, Stage, Owner, Status, Priority, Due Date

7. **Six Sigma Projects** - DMAIC project tracking
   - Project ID, Title, Status, Sigma Level, Belt Level, Champion, Black Belt, Owner, Timeline, DMAIC Phase, Baseline, Current, Target, Cycle Time (Days), Cost Savings

### Recruitment Stages

- Pre-Sourcing
- Intake
- Intake Meeting
- Screening
- Assessment Interview
- OfferAPL
- Pre-Onboarding

### Key Parameters Tracked

- Intake Meeting form Completeness Correctness
- Candidate assessment sheet submission
- Completeness Correctness of CES
- Documents Check (Resume, ID Proof, Educational Certificates, etc.)
- Offer Letter Accuracy
- Pre-Offer Documents check
- BGV Initiation
- Medical Test
- Joining Bonus / Notice Buyout
- And more...

### Calculated Measures

**✅ CORRECTED FORMULAS (Applied in Dashboard):**

```javascript
// 1. Overall Accuracy - measures % of opportunities that passed audit
Overall Accuracy = Sum(Opportunity Pass) / [Sum(Opportunity Count) - Sum(Opportunity NA)] × 100

// 2. Error Rate - measures % of opportunities that failed audit
Error Rate = Sum(Opportunity Fail) / [Sum(Opportunity Count) - Sum(Opportunity NA)] × 100

// 3. Sample Coverage - measures % of total population that was audited
Sample Coverage = Sum(Opportunity Count) / Sum(Total Population) × 100

// 4. Error Contribution - measures individual recruiter's contribution to total errors
Error Contribution = Recruiter Errors / Total Errors × 100
```

**Key Points:**
- All formulas use **Sum** aggregation across filtered data
- Denominator for Accuracy and Error Rate excludes NA opportunities
- Sample Coverage uses **Opportunity Count** (not Sample Count) as numerator
- Formulas automatically adjust based on applied filters (Year, Month, Week, Stage, Parameter)

### Storage Services

- **Local Development**: In-memory data storage with sample data generator
- **Production**: Can integrate with Cloudflare D1, KV, or R2 for persistent storage

## 📱 Dashboard Views

### 1. Overview View
- **Key Metrics Cards**: Overall Accuracy, Error Rate, Total Audits, Sample Coverage
- **AI-Generated Insights**: 4 insight cards with color-coded priorities
- **Actionable Recommendations**: 3 recommendation cards with implementation suggestions
- **Dynamic Narrative**: AI-generated insights based on current data
- **Monthly Accuracy vs Error Rate**: FY comparison chart
- **Stage-wise Audit Scores**: Performance by recruitment stage
- **Parameter Error Hotspots**: Top 10 error-prone parameters
- **Weekly Trend**: Accuracy and volume over time
- **Opportunities Funnel**: Conversion visualization

### 2. Stage & Parameter Comparison
- **Heatmap Matrix**: Stage × Parameter with color-coded accuracy scores
- **Top 3 Best Parameters**: Highest performing parameters
- **Top 3 Worst Parameters**: Parameters needing improvement
- **Color Scale**: White (100%) → Dark Red (0%) for visual clarity

### 3. Recruiter View
- **Performance Table**: Detailed recruiter metrics
- **Scatter Plot**: Sample count vs accuracy with error bubble size
- **Quadrant Analysis**: Identify high-volume/low-accuracy recruiters
- **Program Manager Grouping**: Color-coded by PM

### 4. Comparison View
- **Side-by-Side Analysis**: Compare metrics across different dimensions
- **Performance Benchmarking**: Compare against team averages
- **Visual Comparisons**: Bar and radar charts for multi-metric comparison

### 5. Trend Analysis
- **Historical Trends**: Accuracy and error trends over time
- **Predictive Analytics**: Forecast future performance
- **Pattern Recognition**: Identify seasonal patterns and anomalies
- **Moving Averages**: Smoothed trend lines for better insights

### 6. Insights & Recommendations
- **Dynamic Recommendations**: Auto-generated based on data patterns
- **Priority Matrix**: High/Medium priority action items
- **Training Needs**: Targeted recommendations by parameter
- **Error Pattern Analysis**: Critical insights for improvement

### 7. Strategic View
- **Root Cause Analysis (RCA)**: Track RCA projects with status and priorities
  - Total RCAs, In Progress, Completed, Pending
  - RCA table with Project ID, Issue Description, Root Cause, Stage, Owner, Status, Priority
- **Corrective Actions (CAPA)**: Monitor CAPA implementation
  - Total CAPAs, Open CAPAs, Effectiveness Rate
- **Six Sigma Projects**: DMAIC project management
  - Active Projects, Avg. Sigma Level, Total Savings
  - Project cards with phase, status, and metrics

### 8. Best Practices
- **Industry Benchmarks**: Compare against top companies
  - Google's Structured Hiring with scorecards (Quality of Hire: 85%+)
  - Amazon's Bar Raiser program with 14 Leadership Principles
  - Microsoft's Data-Driven Hiring with ML predictions
  - LinkedIn's Talent Intelligence with skills-based hiring
- **Comparison Metrics**:
  - Your Accuracy: 94.8% vs Elite: 95%
  - Your Sample Coverage: 85% vs Standard: 80%
  - Your Error Rate: 3.2% vs Elite: <3%
- **90-Day Action Plan**: Structured implementation roadmap
  - Week 1-2: Standardized scorecards (+15% accuracy)
  - Week 3-4: Quality Champion program (+20% audit coverage)
  - Month 2: Real-time monitoring dashboard
  - Month 3: Calibration sessions

### 9. User Manual
- **How This Dashboard Was Created**: 7-step creation process
  1. Tech Stack Selection (Hono + Cloudflare Workers)
  2. Data Pipeline Design (Excel → JSON → Visualizations)
  3. UI/UX Design (M&M Branding + Tailwind CSS)
  4. Chart Implementation (Chart.js + Custom visualizations)
  5. Advanced Features (RCA/CAPA, Six Sigma, Best Practices)
  6. Creative Enhancements (FAB, Quick Stats, Dark Theme)
  7. Testing & Deployment (PM2, Cloudflare Pages)
- **Tech Stack**: Detailed technology breakdown
- **Design System**: Color palette, typography, component library
- **Data Pipeline**: Excel parsing → Validation → Processing → Visualization
- **Key Learnings**: Development insights and best practices

## 🎨 Design & Creative Features

### Fixed Header
- **Immovable Header**: Stays fixed at top even when scrolling
- **Z-index Hierarchy**: Header (10000) > FAB (9999) > Sidebar (9000)
- **Centered Title**: "M&M Recruitment Process Audit Dashboard"
- **Centered Subtitle**: "Real-time QA Insights & Performance Analytics"

### Left Sidebar Navigation
- **Fixed Sidebar**: Always visible, scrollable navigation
- **Static Logo**: Mahindra logo with hover scale effect (no animation)
- **9 Navigation Tabs**:
  1. 📊 Overview
  2. 📋 Stage & Parameter
  3. 👥 Recruiter View
  4. 🔄 Comparison View
  5. 📈 Trend Analysis
  6. 💡 Insights
  7. 🎯 Strategic View
  8. ⭐ Best Practices
  9. 📖 User Manual
- **Hover Effects**: Working on all tabs including active tabs

### Floating Action Button (FAB)
- **Position**: Bottom-right corner, fixed
- **Main Button**: Red circular button with + icon
- **6 Actions**:
  1. 🔊 **Audio Commands** - Toggle voice announcements
  2. 📤 **Upload Excel** - Import data files
  3. 📊 **Quick Stats** - View summary widget
  4. 📑 **Export PDF** - Download report
  5. 🔄 **Reset Filters** - Clear all filters
  6. 🌓 **Toggle Theme** - Switch light/dark mode

### Dark/Light Theme Toggle
- **Full Page Coverage**: Works on every element across all tabs
- **Persistent**: Saves preference to localStorage
- **Smooth Transitions**: Animated color changes
- **Comprehensive**: 100% element coverage including:
  - All dashboard cards
  - All navigation elements
  - All charts and visualizations
  - All input fields and filters
  - All tables and data displays

### Creative UI Elements
1. **Breadcrumb Navigation**: Shows current location (Home > Tab Name)
2. **Quick Stats Widget**: Floating widget with Last Updated and Total Records
3. **Global Search**: Advanced search with debouncing (300ms)
4. **Enhanced Filter Pills**: Active filters with X to remove
5. **Data Refresh Indicator**: Visual feedback during updates
6. **Page Transitions**: Smooth fade-in animations
7. **Data Highlight**: Shimmer effect on updated data
8. **Loading Skeletons**: Placeholder animations during load
9. **Interactive Cards**: Hover effects with shadow and scale
10. **Notification Badge System**: Count badges on FAB actions
11. **Color-Coded Insights**: Priority-based color system
12. **Gradient Text**: Accent gradients on key metrics
13. **Animations**: Slide-in, shimmer, glow, pulse effects

### M&M Color Palette
- **Primary Red**: #C8102E
- **Dark Red**: #A00D25
- **Light Red**: #FFE5E9
- **White**: #FFFFFF
- **Grey**: #6B7280
- **Light Grey**: #F3F4F6
- **Border**: #E5E7EB

**Dark Theme Colors**:
- **Background Primary**: #1F2937
- **Background Secondary**: #111827
- **Background Tertiary**: #374151
- **Text Primary**: #F9FAFB
- **Text Secondary**: #D1D5DB
- **Border Primary**: #4B5563

### Typography
- Font Family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- Headings: Bold, Red accent
- Body: Regular, Grey text

### Icons
- FontAwesome 6.4.0 for consistent iconography
- Stage-specific icons (magnifying glass, briefcase, checklist, etc.)

## 🚀 User Guide

### Getting Started

1. **Open Dashboard**: Navigate to the dashboard URL
2. **Upload Data**: Click FAB (+) → Upload Excel
3. **Select File**: Choose your "Power BI Data.xlsx" file (must contain Audit Count sheet)
4. **Watch Progress**: Real-time progress modal shows parsing steps
5. **View Insights**: Dashboard populates automatically with your data

### Financial Year Detection

**Important**: The dashboard **automatically extracts Financial Year values from Column B** of the "Audit Count" sheet:
- ✅ Column B should contain Financial Year values (e.g., "FY23", "FY24", "FY25")
- ✅ System reads directly from Column B (column index 1), not from header names
- ✅ All unique values from Column B are extracted and populate the filter dropdown
- ✅ No manual configuration required - fully automatic detection

### Using Filters

**Global Filters** (top band):
- **Financial Year**: Auto-populated from Column B - select specific FY or view all
- **Month**: Select specific month or view all
- **Week**: Filter by week number
- **Recruitment Stage**: Focus on specific stage
- **Parameter**: Analyze specific parameter

**Filter Actions**:
- **Apply**: Filters apply automatically on selection
- **Reset**: Click FAB → Reset Filters to clear all
- **Active Filters**: View applied filters as pills below filter bar
- **Remove Individual**: Click X icon on any filter pill

### Navigation

Use the left sidebar to switch between views:
- 📊 Overview - Main dashboard with key metrics
- 📋 Stage & Parameter - Detailed heatmap analysis
- 👥 Recruiter View - Individual performance
- 🔄 Comparison View - Side-by-side comparisons
- 📈 Trend Analysis - Historical trends and forecasts
- 💡 Insights - AI-powered suggestions
- 🎯 Strategic View - RCA/CAPA/Six Sigma tracking
- ⭐ Best Practices - Industry benchmarks
- 📖 User Manual - Dashboard documentation

### Theme Toggle

**Switch between Light and Dark modes**:
1. Click FAB (+) button in bottom-right
2. Click "Toggle Theme" option
3. Theme applies to entire dashboard instantly
4. Preference saved automatically

### Audio Commands

**Enable voice announcements**:
1. Click FAB (+) button
2. Click "Audio Commands"
3. Dashboard will speak tab names and actions
4. Click again to disable

### Exporting Data

**PDF Export**:
1. Click FAB (+) button
2. Click "Export PDF"
3. System generates report with key metrics
4. PDF downloads automatically

## 🛠 Technical Stack

### Frontend
- **Framework**: Hono (TypeScript)
- **Styling**: Tailwind CSS (CDN)
- **Charts**: Chart.js 4.4.0
- **Excel Parsing**: SheetJS (xlsx) 0.18.5
- **PDF Generation**: jsPDF 2.5.1
- **Icons**: FontAwesome 6.4.0

### Backend
- **Runtime**: Cloudflare Workers
- **Build Tool**: Vite 6.4.1
- **Package Manager**: npm

### Deployment
- **Platform**: Cloudflare Pages
- **CDN**: Global edge network
- **Development**: PM2 process manager

## 📦 Project Structure

```
webapp/
├── src/
│   └── index.tsx              # Main Hono application (HTML + CSS)
├── public/
│   └── static/
│       └── dashboard.js       # Dashboard logic and visualizations
├── dist/                      # Build output (generated)
│   ├── _worker.js            # Compiled worker
│   └── _routes.json          # Routes config
├── ecosystem.config.cjs       # PM2 configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript config
├── vite.config.ts            # Vite build config
├── wrangler.jsonc            # Cloudflare config
├── .gitignore                # Git ignore file
└── README.md                 # This file
```

## 💻 Development

### Prerequisites
- Node.js 18+ and npm
- PM2 (pre-installed in sandbox)

### Local Development

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start development server
npm run dev:sandbox

# Or use PM2
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs --nostream

# Test locally
curl http://localhost:3000
```

### Scripts

```json
{
  "dev": "vite",
  "dev:sandbox": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
  "build": "vite build",
  "preview": "wrangler pages dev dist",
  "deploy": "npm run build && wrangler pages deploy dist",
  "deploy:prod": "npm run build && wrangler pages deploy dist --project-name webapp",
  "clean-port": "fuser -k 3000/tcp 2>/dev/null || true",
  "test": "curl http://localhost:3000",
  "git:status": "git status",
  "git:commit": "git add . && git commit -m",
  "git:push": "git push origin main"
}
```

## 🚀 Deployment to Cloudflare Pages

### First Time Setup

1. **Setup Cloudflare API Key**
   ```bash
   # Tool will guide you through setup
   ```

2. **Build Project**
   ```bash
   npm run build
   ```

3. **Create Cloudflare Pages Project**
   ```bash
   npx wrangler pages project create webapp \
     --production-branch main \
     --compatibility-date 2024-01-01
   ```

4. **Deploy**
   ```bash
   npm run deploy:prod
   ```

### Production URLs
After deployment, you'll receive:
- **Production URL**: `https://webapp.pages.dev`
- **Branch URL**: `https://main.webapp.pages.dev`

## 📈 Current Status

**Deployment Status**: ✅ Active (Development)

**GitHub Repository**: ✅ Connected - https://github.com/Businessexcellence/M-M---Process-Audit-Dashboard

**Tech Stack**: Hono + TypeScript + TailwindCSS + Chart.js

**Features Completed**:
- ✅ Excel upload with progress tracking
- ✅ Smart Column B detection for Financial Year
- ✅ Data model and parsing with validation
- ✅ 9 dashboard views (Overview, Stage, Recruiter, Comparison, Trend, Insights, Strategic, Best Practices, User Manual)
- ✅ Interactive charts and visualizations (15+ chart types)
- ✅ Global filtering system (6 dimensions)
- ✅ RCA/CAPA tracking with defensive property access
- ✅ Six Sigma project management
- ✅ Industry benchmark comparisons
- ✅ Dynamic insights generation with AI recommendations
- ✅ Full-page dark/light theme toggle
- ✅ Fixed immovable header with centered title
- ✅ Floating Action Button (FAB) with 6 actions
- ✅ Audio commands for accessibility
- ✅ Creative UI enhancements (breadcrumbs, quick stats, search, animations)
- ✅ PDF export functionality
- ✅ M&M branding and styling
- ✅ Responsive design

**Recent Updates**:
- 🆕 Fixed RCA/CAPA and Six Sigma data loading with defensive property access (Jan 6, 2025)
- 🆕 Added comprehensive logging for debugging (Jan 6, 2025)
- 🆕 GitHub repository connected (Jan 6, 2025)
- 🆕 Added User Manual tab with complete documentation (Jan 6, 2025)
- 🆕 Added Best Practices tab with industry benchmarks (Jan 6, 2025)
- 🆕 Added Comparison View and Trend Analysis tabs (Jan 6, 2025)
- 🆕 Fixed dark theme full-page coverage (Jan 6, 2025)
- 🆕 Fixed header to be immovable with z-index hierarchy (Jan 6, 2025)
- 🆕 Moved Audio Commands to FAB menu (Jan 6, 2025)
- 🆕 Removed header buttons, kept clean design (Jan 6, 2025)
- 🆕 Stopped Mahindra logo animation (Jan 6, 2025)
- 🆕 Added creative UI features (FAB, breadcrumbs, quick stats, search) (Jan 6, 2025)

**Last Updated**: January 6, 2025

## 🔧 Customization

### Adding New Parameters
Edit `dashboard.js` to add parameters to sample data

### Modifying Color Scheme
Edit CSS variables in `index.tsx`:
```css
:root {
  --mm-red: #C8102E;        /* Primary red */
  --mm-dark-red: #A00D25;   /* Dark red for emphasis */
  --mm-light-red: #FFE5E9;  /* Light red for backgrounds */
}
```

### Adding Custom Charts
1. Add canvas element in HTML
2. Implement chart function in `dashboard.js`
3. Call from `updateAllViews()` function

## 🐛 Troubleshooting

### Excel Upload Fails
- **Required Sheets**: "Audit Count", "RCA Or CAPA", "Six Sigma Projects"
- **Financial Year Column**: Must be in Column B of "Audit Count" sheet
- **Column Names**: Defensive property access handles case variations
- **Data Types**: Numbers for metrics, text for dimensions
- **File Format**: .xlsx or .xls only

### RCA/CAPA Showing 0 Count
- ✅ **Fixed**: Now uses defensive property access for all fields
- ✅ Handles: "Status", "status", "STATUS", "Project Status"
- ✅ Handles: "Type", "type", "TYPE", "Project Type"
- ✅ Works with: "RCA Or CAPA", "RCA OR CAPA", "rca or capa"

### Six Sigma Wrong Count
- ✅ **Fixed**: Now uses defensive property access for all fields
- ✅ Handles: "Sigma Level", "sigma level", "SIGMA LEVEL"
- ✅ Handles: "Cost Savings", "Savings", "cost savings"

### Charts Not Displaying
- Check browser console for errors
- Ensure Chart.js library loaded (check network tab)
- Verify data structure in `dashboardData` object

### Theme Toggle Not Working
- ✅ **Fixed**: Now works on full page across all tabs
- ✅ Persists preference to localStorage
- ✅ Comprehensive dark theme CSS coverage

### Header Moving on Scroll
- ✅ **Fixed**: Header now immovable with z-index 10000
- ✅ Three-layer enforcement (CSS + Inline + Tailwind)

## 📚 Future Enhancements

**Potential Additions**:
- [ ] Real-time data refresh from API
- [ ] User authentication and role-based access
- [ ] Custom date range selection
- [ ] Export to Excel functionality
- [ ] Comparative benchmarking across clients
- [ ] Mobile app version
- [ ] Email report scheduling
- [ ] Integration with ATS systems
- [ ] Machine learning predictions

## 📝 License

Internal use only - M&M Recruitment Team

## 👥 Contributors

- Dashboard Development Team
- M&M Quality Assurance Team

## 🙏 Acknowledgments

Built using best practices from:
- Google's Structured Hiring framework
- Amazon's Bar Raiser program
- Microsoft's Data-Driven Hiring approach
- LinkedIn's Talent Intelligence platform

## 📞 Support

For issues or feature requests, contact the development team or create an issue on GitHub.

---

**Built with ❤️ using Hono + Cloudflare Pages**

**GitHub**: https://github.com/Businessexcellence/M-M---Process-Audit-Dashboard
