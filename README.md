# M&M Recruitment Process Audit Dashboard

## 🎯 Project Overview

A comprehensive, real-time QA insights dashboard for monitoring and analyzing the M&M recruitment process audit data. This dashboard provides detailed analytics, visualizations, and actionable recommendations to improve recruitment quality and efficiency.

### Key Features

✅ **Excel Data Import** - Upload and validate Excel files with automatic data parsing  
✅ **Real-time Metrics** - Track accuracy, error rates, audit counts, and sample coverage  
✅ **Interactive Visualizations** - Multiple chart types including line, bar, heatmap, scatter, and funnel charts  
✅ **Multi-dimensional Filtering** - Filter by year, month, week, stage, parameter, and recruiter  
✅ **Stage & Parameter Analysis** - Heatmap view with top/worst parameter identification  
✅ **Recruiter Performance** - Individual recruiter metrics with quadrant analysis  
✅ **FY Trend Comparison** - Compare performance across financial years  
✅ **AI-Powered Insights** - Dynamic narrative generation and recommendations  
✅ **PDF Export** - Generate downloadable reports  
✅ **M&M Branding** - Custom red and white theme with professional styling

## 🌐 URLs

**Development Dashboard**: https://3000-ile3zkyblze0f5esem0nb-2e1b9533.sandbox.novita.ai

**Production**: (Deploy to Cloudflare Pages for production URL)

**GitHub**: (Push to GitHub after deployment)

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

```javascript
Accuracy Score = Opportunity Pass / (Opportunity Count - Opportunity NA) × 100
Error Rate = Opportunity Fail / (Opportunity Count - Opportunity NA) × 100
Sample Coverage = Sample Count / Total Population × 100
Error Contribution = Recruiter Errors / Total Errors × 100
```

### Storage Services

- **Local Development**: In-memory data storage with sample data generator
- **Production**: Can integrate with Cloudflare D1, KV, or R2 for persistent storage

## 📱 Dashboard Views

### 1. Overview View
- **Key Metrics Cards**: Overall Accuracy, Error Rate, Total Audits, Sample Coverage
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

### 4. Trends & FY Comparison
- **FY Metrics Cards**: Aggregate metrics for FY23, FY24, FY25
- **Monthly Comparison**: Line chart comparing accuracy across financial years
- **Low Sample Indicators**: Markers for months below 20% sample threshold

### 5. Insights & Recommendations
- **Dynamic Recommendations**: Auto-generated based on data patterns
- **Priority Matrix**: High/Medium priority action items
- **Training Needs**: Targeted recommendations by parameter
- **Error Pattern Analysis**: Critical insights for improvement

## 🎨 Design & Styling

### M&M Color Palette
- **Primary Red**: #C8102E
- **Dark Red**: #A00D25
- **Light Red**: #FFE5E9
- **White**: #FFFFFF
- **Grey**: #6B7280
- **Light Grey**: #F3F4F6
- **Border**: #E5E7EB

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
2. **Upload Data**: Click "Upload Excel" button in top-right corner
3. **Select File**: Choose your Excel file (must match required format)
4. **Validation**: System validates required sheets automatically
5. **View Insights**: Dashboard populates with your data

### Using Filters

**Global Filters** (top band):
- **Financial Year**: Multi-select FY23, FY24, FY25
- **Month**: Select specific month or view all
- **Week**: Filter by week number
- **Recruitment Stage**: Focus on specific stage
- **Parameter**: Analyze specific parameter
- **Recruiter**: View individual recruiter performance

**Filter Actions**:
- **Apply**: Filters apply automatically on selection
- **Reset**: Click "Reset" button to clear all filters
- **Active Filters**: View applied filters as pills below filter bar

### Navigation

Use the tab menu to switch between views:
- 📊 Overview - Main dashboard with key metrics
- 📋 Stage & Parameter - Detailed heatmap analysis
- 👥 Recruiter View - Individual performance
- 📈 Trends & FY Comparison - Historical analysis
- 💡 Insights & Recommendations - AI-powered suggestions

### Exporting Data

**PDF Export**:
1. Click "Export PDF" button
2. System generates report with key metrics
3. PDF downloads automatically
4. Includes: Metrics, insights, and timestamp

### Sample Data

If no file is uploaded, the dashboard generates sample data for demonstration:
- 100 audit records
- 5 recruiters
- 10 parameters
- 6 recruitment stages
- FY23 and FY24 data

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
│   └── index.tsx              # Main Hono application
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
  "test": "curl http://localhost:3000"
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

### Environment Variables
No environment variables required for current implementation.

## 📈 Current Status

**Deployment Status**: ✅ Active (Development)

**Tech Stack**: Hono + TypeScript + TailwindCSS + Chart.js

**Features Completed**:
- ✅ Excel upload and validation
- ✅ Data model and parsing
- ✅ All 5 dashboard views
- ✅ Interactive charts and visualizations
- ✅ Global filtering system
- ✅ Dynamic insights generation
- ✅ PDF export functionality
- ✅ M&M branding and styling
- ✅ Responsive design
- ✅ Sample data generator

**Last Updated**: December 26, 2024

## 🔧 Customization

### Adding New Parameters
Edit `dashboard.js` line ~150 to add parameters to sample data:
```javascript
const parameters = [
  'Your New Parameter Name',
  // ... existing parameters
];
```

### Modifying Color Scheme
Edit CSS variables in `index.tsx` line ~29:
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
- Ensure file has required sheets: "Audit Count", "FY23", "Recruiter Wise Data"
- Check column names match exactly
- Verify data types (numbers for metrics, text for dimensions)

### Charts Not Displaying
- Check browser console for errors
- Ensure Chart.js library loaded (check network tab)
- Verify data structure in `dashboardData` object

### Filter Not Working
- Clear browser cache
- Check filter values in console
- Verify data has values for selected filter

### Performance Issues
- Large datasets (>10,000 rows) may cause slowness
- Consider pagination for recruiter table
- Implement data aggregation for better performance

## 📚 Future Enhancements

**Potential Additions**:
- [ ] Real-time data refresh from API
- [ ] User authentication and role-based access
- [ ] Drill-down capabilities for detailed analysis
- [ ] Custom date range selection
- [ ] Export to Excel functionality
- [ ] Comparative benchmarking across clients
- [ ] Mobile app version
- [ ] Email report scheduling
- [ ] Integration with ATS systems
- [ ] Machine learning predictions

## 📝 License

Internal use only - M&M Recruitment Team

## 👥 Support

For issues or feature requests, contact the development team.

---

**Built with ❤️ using Hono + Cloudflare Pages**
