# M&M Recruitment Process Audit Dashboard

**Real-time QA Insights & Performance Analytics**

## 🌐 Live URLs

- **Development Server**: https://3000-ile3zkyblze0f5esem0nb-2e1b9533.sandbox.novita.ai
- **Production** (after deployment): Will be available at Cloudflare Pages URL

## 📊 Project Overview

A comprehensive, real-time audit dashboard for monitoring and analyzing M&M recruitment process quality metrics. The dashboard provides detailed insights into recruitment accuracy, error patterns, recruiter performance, and actionable recommendations.

### Key Features

✅ **Excel Data Import** - Upload and parse recruitment audit data from Excel files  
✅ **Real-time Filtering** - Filter by Year, Month, Week, Stage, Parameter, and Recruiter  
✅ **Key Metrics Dashboard** - Overall Accuracy, Error Rate, Total Audits, Sample Coverage  
✅ **Dynamic Visualizations** - 10+ interactive charts using Chart.js  
✅ **AI-Powered Insights** - Automated narrative generation and recommendations  
✅ **Multi-View Analysis** - Overview, Stage & Parameter, Recruiter, Trends, and Insights tabs  
✅ **Heatmap Visualization** - Stage x Parameter performance matrix  
✅ **Recruiter Performance** - Scatter plots, bar charts, and detailed tables  
✅ **Trend Analysis** - FY comparison and weekly performance tracking  
✅ **M&M Brand Styling** - Professional red and white color theme

## 🎨 Design Philosophy

The dashboard follows M&M's brand identity with:
- **Primary Color**: M&M Red (#C8102E)
- **Accent Colors**: Dark Red (#8B0000), Light Red (#FFE5E5)
- **Neutral Colors**: White backgrounds, Grey text and borders
- **Clean UI**: Card-based layout with subtle shadows and hover effects
- **Responsive Design**: Optimized for desktop and tablet viewing

## 📂 Data Architecture

### Expected Excel File Structure

The dashboard expects an Excel file with the following sheets:

#### 1. **Audit Count** (Main data sheet)
Required columns:
- Client
- Financial Year
- Month, Month Number
- Week
- Recruitment Stage
- Parameter
- Recruiter Name
- Program Manager
- Req ID
- Total Population
- Opportunity Count
- Opportunity Pass
- Opportunity Fail
- Opportunity NA
- Opportunity Excluding NA
- Accuracy Score
- Error (Error Rate)
- Sample Count

#### 2. **FY23** (Weekly data for FY23)
Columns:
- Week / Week Number
- Total Opportunities
- Accuracy Score
- Sample Size / Audit Samples

#### 3. **FY24** (Weekly data for FY24)
Same structure as FY23

#### 4. **Recruiter Wise Data**
Columns:
- Recruiter Name
- Accuracy Score
- Error Count
- Sample Count
- Program Manager

#### 5. **Sheet3 / Sheet5** (Parameter error tables)
Columns:
- Parameter
- Total Errors
- Error counts by recruiter

### Data Storage

**Current Implementation**: In-memory data storage (suitable for development)

**Recommended for Production**: 
- Cloudflare D1 Database for persistent storage
- Cloudflare KV for caching filter states
- Cloudflare R2 for storing uploaded Excel files

## 📊 Dashboard Views

### 1. Overview Tab
- **Key Metrics Tiles**: Accuracy, Error Rate, Total Audits, Sample Coverage
- **Dynamic Narrative**: AI-generated insights based on current data
- **Monthly Accuracy vs Error Rate**: FY comparison chart
- **Stage-wise Audit Scores**: Bar chart by recruitment stage
- **Parameter Error Hotspots**: Top 10 high-error parameters
- **Weekly Trends**: Accuracy and volume over time
- **Opportunities Funnel**: Visual flow from population to pass/fail

### 2. Stage & Parameter Comparison Tab
- **Top 3 Best/Worst Parameters**: Quick identification cards
- **Parameter Distribution**: Categorization by performance
- **Heatmap**: Stage x Parameter accuracy matrix with color coding

### 3. Recruiter View Tab
- **Performance Quadrant**: Scatter plot (Sample Count vs Accuracy)
- **Top 10 Recruiters**: Bar chart by accuracy
- **Performance Table**: Detailed recruiter metrics with status badges

### 4. Trends & FY Comparison Tab
- **FY Metrics Cards**: Summary for FY23, FY24, FY25
- **Monthly Trend Lines**: Multi-year accuracy comparison
- **Weekly Trends**: Detailed week-by-week analysis

### 5. Insights & Recommendations Tab
- **AI-Powered Insights**: Automated analysis of performance patterns
- **Recommended Actions**: Specific, actionable recommendations
- **Critical Error Patterns**: Top 5 error-prone parameters
- **Best Practices**: Top 5 high-performing parameters

## 🎯 Measures and Calculations

### Key Formulas

```javascript
// Accuracy Score
Accuracy = (Opportunity Pass / Opportunity Excluding NA) × 100

// Error Rate
Error Rate = (Opportunity Fail / Opportunity Excluding NA) × 100

// Sample Coverage
Sample Coverage = (Sample Count / Total Population) × 100

// Recruiter Error Contribution
Error Contribution % = (Recruiter Errors / Total Errors) × 100
```

## 🚀 User Guide

### Getting Started

1. **Upload Excel File**
   - Click the "Upload Excel" button in the header
   - Select your Excel file (must match expected structure)
   - Dashboard will validate and load the data

2. **Apply Filters**
   - Use the global filter bar to narrow down data
   - Filter by: Year, Month, Week, Stage, Parameter, Recruiter
   - Active filters display as pills below the filter bar

3. **Navigate Views**
   - Use the tab navigation to switch between views
   - Each tab provides specialized analysis

4. **Export Results**
   - Click "Export PDF" to generate a report (feature in development)
   - Use "Reset" button to clear all filters

### Filter Behavior

- **Default**: All filters set to "All" (shows all data)
- **Multiple Filters**: Applied as AND conditions (all must match)
- **Remove Filter**: Click the X on any active filter pill
- **Reset All**: Click the "Reset" button in header

### Chart Interactions

- **Hover**: View detailed tooltips on all charts
- **Legend**: Click legend items to show/hide data series
- **Heatmap**: Hover over cells for exact values

## 💻 Technical Stack

### Frontend
- **HTML5** with semantic markup
- **Tailwind CSS** via CDN for styling
- **Font Awesome** for icons
- **Chart.js 4.5.1** for data visualizations
- **SheetJS (XLSX)** for Excel parsing
- **Axios** for API communication

### Backend
- **Hono** - Lightweight web framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Wrangler** - Cloudflare Pages deployment

### Deployment
- **Platform**: Cloudflare Pages (Edge Computing)
- **Build**: `npm run build` → Vite bundling
- **Dev Server**: PM2 + Wrangler Pages Dev
- **Production**: Cloudflare Pages with global CDN

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd webapp

# Install dependencies
npm install

# Build the project
npm run build

# Start development server (local machine)
npm run dev

# Start development server (sandbox)
npm run dev:sandbox
# or use PM2
pm2 start ecosystem.config.cjs
```

### Project Structure

```
webapp/
├── src/
│   ├── index.tsx           # Main Hono application
│   └── renderer.tsx        # JSX renderer
├── public/
│   └── static/
│       └── dashboard.js    # Frontend JavaScript (2000+ lines)
├── sample-data.xlsx        # Sample Excel file for testing
├── ecosystem.config.cjs    # PM2 configuration
├── wrangler.jsonc         # Cloudflare configuration
├── vite.config.ts         # Vite build configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Available Scripts

```bash
npm run dev          # Vite dev server (local)
npm run dev:sandbox  # Wrangler dev server (sandbox)
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Deploy to Cloudflare Pages
npm run clean-port   # Kill process on port 3000
npm run test         # Test with curl
```

## 📈 Features Completed

### ✅ Data Management
- [x] Excel file upload with validation
- [x] Multi-sheet data parsing
- [x] In-memory data storage
- [x] Data structure validation
- [x] Error handling and user feedback

### ✅ Global Filtering
- [x] 6 filter dimensions (Year, Month, Week, Stage, Parameter, Recruiter)
- [x] Active filter pills display
- [x] Reset all filters
- [x] Real-time filter application

### ✅ Key Metrics
- [x] Overall Accuracy calculation
- [x] Overall Error Rate calculation
- [x] Total Audits count
- [x] Sample Coverage percentage
- [x] Dynamic narrative generation

### ✅ Visualizations
- [x] Monthly Accuracy vs Error Rate (combo chart)
- [x] Stage-wise Audit Scores (horizontal bar)
- [x] Parameter Error Hotspots (horizontal bar with color gradient)
- [x] Weekly Accuracy and Volume (line + bar combo)
- [x] Opportunities Funnel (horizontal bar)
- [x] Stage x Parameter Heatmap (table with color coding)
- [x] Recruiter Scatter Plot (bubble chart)
- [x] Recruiter Bar Chart (top 10)
- [x] FY Comparison Line Chart (multi-year)
- [x] Weekly FY Trends (line chart)

### ✅ Analysis Views
- [x] Overview tab with key charts
- [x] Stage & Parameter comparison with heatmap
- [x] Recruiter performance view
- [x] Trends and FY comparison
- [x] Insights and recommendations

### ✅ UI/UX
- [x] M&M brand color theme (red and white)
- [x] Responsive card-based layout
- [x] Sticky navigation and filters
- [x] Hover effects and transitions
- [x] Loading states
- [x] Success/error toast notifications
- [x] Icon integration (Font Awesome)

### ✅ Insights Generation
- [x] Dynamic narrative based on filters
- [x] AI-powered insight generation
- [x] Automated recommendations
- [x] Critical error pattern identification
- [x] Best practices identification

## 🔮 Future Enhancements

### Short-term
- [ ] PDF export functionality (jsPDF integration)
- [ ] Excel export of filtered data
- [ ] User preferences (dark mode toggle)
- [ ] Chart download as images

### Medium-term
- [ ] Cloudflare D1 database integration
- [ ] User authentication (Cloudflare Access)
- [ ] Historical data comparison
- [ ] Custom alert thresholds
- [ ] Email notifications for critical errors

### Long-term
- [ ] Predictive analytics (trend forecasting)
- [ ] Machine learning for anomaly detection
- [ ] Multi-client support with role-based access
- [ ] Real-time data streaming
- [ ] Mobile app (React Native)

## 🎯 Recommended Next Steps

1. **Data Persistence**: Migrate from in-memory to Cloudflare D1 database
2. **Authentication**: Add user login with Cloudflare Access
3. **PDF Export**: Complete the PDF generation feature
4. **Testing**: Add comprehensive unit and integration tests
5. **Performance**: Optimize chart rendering for large datasets
6. **Documentation**: Add inline code documentation and API docs

## 📊 Sample Data

A sample Excel file (`sample-data.xlsx`) is included in the project root. This file contains:
- 4+ MB of real audit data
- Multiple recruitment stages
- Various parameters and error types
- FY23 and FY24 weekly data
- Recruiter-wise performance data

Use this file to explore all dashboard features.

## 🤝 Support

For issues, questions, or feature requests:
1. Upload the Excel file and verify the required sheets exist
2. Check browser console for error messages
3. Ensure all required columns are present in the data
4. Review the validation error messages in the UI

## 📝 Deployment Status

- **Platform**: Cloudflare Pages
- **Status**: ✅ Development Server Active
- **Tech Stack**: Hono + TypeScript + Chart.js + TailwindCSS
- **Last Updated**: 2025-12-26

## 🏆 Project Highlights

- **2000+ lines** of frontend JavaScript
- **28000+ characters** of backend TypeScript
- **10+ interactive charts** with Chart.js
- **5 specialized views** for comprehensive analysis
- **AI-powered insights** with dynamic recommendations
- **Real-time filtering** across 6 dimensions
- **Professional M&M branding** throughout

---

**Built with ❤️ using Hono, Vite, and Cloudflare Pages**
