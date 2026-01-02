import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// In-memory data store (in production, use Cloudflare D1 or KV)
let dashboardData: any = null

// API route to upload and parse Excel data
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    // Return success - parsing will be done on client side
    return c.json({ 
      success: true, 
      message: 'File uploaded successfully',
      filename: file.name,
      size: file.size
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// API route to get dashboard data
app.get('/api/data', (c) => {
  if (!dashboardData) {
    return c.json({ error: 'No data available' }, 404)
  }
  return c.json(dashboardData)
})

// API route to save parsed data
app.post('/api/data', async (c) => {
  try {
    const data = await c.req.json()
    dashboardData = data
    return c.json({ success: true, message: 'Data saved successfully' })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Main dashboard route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>M&M Recruitment Process Audit Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          /* CSS Variables - Dark Theme (Default) */
          :root {
            /* Brand Colors - Always constant */
            --mm-red: #C8102E;
            --mm-dark-red: #8B0000;
            --mm-light-red-accent: #FFE5E5;
            
            /* Dark Theme Colors (Default) */
            --bg-primary: #000000;
            --bg-secondary: #1a1a1a;
            --bg-tertiary: #2a2a2a;
            --bg-card: #1a1a1a;
            --bg-hover: #2a2a2a;
            
            --text-primary: #FFFFFF;
            --text-secondary: #CCCCCC;
            --text-tertiary: #999999;
            
            --border-primary: #333333;
            --border-secondary: #444444;
            
            --shadow-color: rgba(0, 0, 0, 0.5);
            
            /* Derived Colors */
            --mm-white: var(--text-primary);
            --mm-grey: var(--text-secondary);
            --mm-light-grey: var(--bg-tertiary);
            --mm-light-red: var(--bg-secondary);
            --mm-border-grey: var(--border-primary);
          }
          
          /* Light Theme */
          body.light-theme {
            --bg-primary: #FFFFFF;
            --bg-secondary: #F9FAFB;
            --bg-tertiary: #F3F4F6;
            --bg-card: #FFFFFF;
            --bg-hover: #FFE5E5;
            
            --text-primary: #1F2937;
            --text-secondary: #6B7280;
            --text-tertiary: #9CA3AF;
            
            --border-primary: #E5E7EB;
            --border-secondary: #D1D5DB;
            
            --shadow-color: rgba(0, 0, 0, 0.1);
            
            /* Derived Colors for Light */
            --mm-white: #FFFFFF;
            --mm-grey: #6B7280;
            --mm-light-grey: #F3F4F6;
            --mm-light-red: #FFE5E5;
            --mm-border-grey: #E5E7EB;
            
            /* Success and Status Colors for Light Theme */
            --success-color: #10B981;
            --warning-color: #F59E0B;
            --error-color: #EF4444;
          }
          
          /* Success and Status Colors for Dark Theme */
          body.dark-theme {
            --success-color: #34D399;
            --warning-color: #FBBF24;
            --error-color: #F87171;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            transition: background-color 0.3s ease, color 0.3s ease;
          }
          
          .mm-red { color: var(--mm-red); }
          .bg-mm-red { background-color: var(--mm-red); }
          .bg-mm-dark-red { background-color: var(--mm-dark-red); }
          .bg-mm-light-red { background-color: var(--mm-light-red); }
          .border-mm-red { border-color: var(--mm-red); }
          .hover\\:bg-mm-dark-red:hover { background-color: var(--mm-dark-red); }
          
          .dashboard-card {
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            box-shadow: 0 2px 4px var(--shadow-color);
            transition: box-shadow 0.3s ease, background-color 0.3s ease;
            color: var(--text-primary);
          }
          
          .dashboard-card:hover {
            box-shadow: 0 4px 12px rgba(200, 16, 46, 0.1);
          }
          
          .stage-icon {
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--mm-light-red);
            color: var(--mm-red);
            border-radius: 50%;
            margin-right: 8px;
          }
          
          .insight-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 600;
          }
          
          .insight-negative {
            background: var(--mm-light-red);
            color: var(--mm-dark-red);
          }
          
          .insight-positive {
            background: #D1FAE5;
            color: #065F46;
          }
          
          .loading-spinner {
            border: 3px solid var(--mm-light-red);
            border-top: 3px solid var(--mm-red);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Vertical Sidebar Navigation */
          .sidebar-nav {
            position: fixed;
            left: 0;
            top: 96px; /* Below header */
            width: 280px;
            height: calc(100vh - 96px);
            background: white;
            border-right: 2px solid var(--mm-border-grey);
            overflow-y: auto;
            z-index: 50;
            box-shadow: 2px 0 8px rgba(0,0,0,0.05);
          }
          
          .nav-tab {
            display: flex;
            align-items: center;
            padding: 16px 20px;
            cursor: pointer;
            border-left: 4px solid transparent;
            transition: all 0.3s ease;
            color: var(--mm-grey);
            margin: 4px 0;
          }
          
          .nav-tab:hover {
            color: var(--mm-red);
            background: linear-gradient(90deg, #FFF5F5 0%, #FEE2E2 100%);
            border-left-color: var(--mm-light-red);
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(200, 16, 46, 0.15);
          }
          
          .nav-tab:hover .nav-tab-icon {
            background: linear-gradient(135deg, #C8102E 0%, #8B0000 100%);
            color: white;
            transform: scale(1.1);
          }
          
          .nav-tab:hover .nav-tab-title {
            color: #C8102E;
          }
          
          .nav-tab.active {
            color: var(--mm-red);
            background: var(--mm-light-red);
            border-left-color: var(--mm-red);
            font-weight: 600;
          }
          
          .nav-tab-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--mm-light-red);
            border-radius: 12px;
            margin-right: 16px;
            font-size: 24px;
            color: var(--mm-red);
            flex-shrink: 0;
          }
          
          .nav-tab.active .nav-tab-icon {
            background: var(--mm-red);
            color: white;
          }
          
          .nav-tab-content {
            flex: 1;
          }
          
          .nav-tab-title {
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .nav-tab-desc {
            font-size: 0.75rem;
            color: var(--mm-grey);
            line-height: 1.3;
          }
          
          .nav-tab.active .nav-tab-desc {
            color: var(--mm-red);
          }
          
          /* Sub-navigation */
          .nav-sub-items {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            background: #F9FAFB;
            margin-left: 0;
          }
          
          .nav-sub-items.expanded {
            max-height: 500px;
          }
          
          .nav-sub-item {
            display: flex;
            align-items: center;
            padding: 12px 20px 12px 48px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--mm-grey);
            font-size: 0.875rem;
            border-left: 4px solid transparent;
          }
          
          .nav-sub-item:hover {
            background: #FEE2E2;
            color: var(--mm-red);
            padding-left: 60px;
          }
          
          .nav-sub-item:hover i {
            transform: scale(1.2);
          }
          
          .nav-sub-item.active {
            background: var(--mm-light-red);
            color: var(--mm-red);
            border-left-color: var(--mm-red);
            font-weight: 600;
          }
          
          .nav-sub-item i {
            margin-right: 12px;
            width: 20px;
            text-align: center;
          }
          
          .nav-expand-icon {
            margin-left: auto;
            transition: transform 0.3s ease;
            font-size: 0.875rem;
          }
          
          .nav-tab.expanded .nav-expand-icon {
            transform: rotate(180deg);
          }
          
          /* Main content with sidebar offset */
          .main-content-wrapper {
            margin-left: 280px;
            padding-top: 96px;
          }
          
          .filter-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: var(--mm-light-red);
            color: var(--mm-red);
            border-radius: 16px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .filter-pill:hover {
            background: var(--mm-red);
            color: white;
          }
          
          select, input[type="file"] {
            border: 1px solid var(--mm-border-grey);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 0.875rem;
            transition: border-color 0.2s ease;
          }
          
          select:focus, input[type="file"]:focus {
            outline: none;
            border-color: var(--mm-red);
            box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.1);
          }
          
          .metric-card {
            text-align: center;
            padding: 24px;
            background: linear-gradient(135deg, var(--mm-white) 0%, var(--mm-light-red) 100%);
          }
          
          .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--mm-red);
            line-height: 1;
          }
          
          .metric-label {
            font-size: 0.875rem;
            color: var(--mm-grey);
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .chart-container {
            position: relative;
            height: 400px;
            padding: 20px;
          }
          
          .heatmap-cell {
            padding: 12px;
            text-align: center;
            font-weight: 600;
            border: 1px solid var(--mm-border-grey);
            transition: transform 0.2s ease;
          }
          
          .heatmap-cell:hover {
            transform: scale(1.05);
            z-index: 10;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }
          
          /* Upload Progress Modal */
          .upload-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          
          .upload-modal-content {
            background: white;
            border-radius: 12px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          
          .progress-bar-container {
            width: 100%;
            height: 8px;
            background: var(--mm-light-red);
            border-radius: 4px;
            overflow: hidden;
            margin: 20px 0;
          }
          
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--mm-red) 0%, var(--mm-dark-red) 100%);
            transition: width 0.3s ease;
            border-radius: 4px;
          }
          
          .progress-steps {
            margin-top: 16px;
          }
          
          .progress-step {
            display: flex;
            align-items: center;
            padding: 8px 0;
            color: var(--mm-grey);
            font-size: 0.875rem;
          }
          
          .progress-step.active {
            color: var(--mm-red);
            font-weight: 600;
          }
          
          .progress-step.completed {
            color: #10B981;
          }
          
          .progress-step i {
            margin-right: 8px;
            width: 20px;
          }
          
          /* Strategic View Tabs */
          .strategic-tab {
            background: transparent;
            border: none;
            border-bottom: 3px solid transparent;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .strategic-tab:hover {
            color: var(--mm-red);
            background: var(--bg-hover);
          }
          
          .strategic-tab.active {
            color: var(--mm-red);
            border-bottom-color: var(--mm-red);
            background: var(--bg-hover);
            font-weight: 600;
          }
          
          .strategic-content {
            animation: fadeIn 0.3s ease-in-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Card Hover Effects */
          .dashboard-card {
            transition: all 0.3s ease;
          }
          
          .dashboard-card:hover {
            transform: translateY(-2px);
          }
          
          /* Status Badge Colors */
          .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          /* Utility Classes */
          .hidden {
            display: none !important;
          }
          
          .border-color {
            border-color: var(--border-primary);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Upload Progress Modal -->
        <div id="upload-modal" class="upload-modal hidden">
            <div class="upload-modal-content">
                <h3 class="text-xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-file-upload text-mm-red mr-2"></i>
                    Processing Excel File
                </h3>
                <p class="text-sm text-gray-600 mb-4" id="upload-filename">Power BI Data.xlsx</p>
                
                <div class="progress-bar-container">
                    <div id="progress-bar" class="progress-bar" style="width: 0%"></div>
                </div>
                
                <div class="text-center mb-4">
                    <span id="progress-percentage" class="text-2xl font-bold text-mm-red">0%</span>
                </div>
                
                <div class="progress-steps">
                    <div id="step-reading" class="progress-step">
                        <i class="fas fa-circle-notch fa-spin"></i>
                        <span>Reading file...</span>
                    </div>
                    <div id="step-parsing" class="progress-step">
                        <i class="fas fa-circle"></i>
                        <span>Parsing Excel sheets...</span>
                    </div>
                    <div id="step-validating" class="progress-step">
                        <i class="fas fa-circle"></i>
                        <span>Validating data structure...</span>
                    </div>
                    <div id="step-processing" class="progress-step">
                        <i class="fas fa-circle"></i>
                        <span>Processing data...</span>
                    </div>
                    <div id="step-complete" class="progress-step">
                        <i class="fas fa-circle"></i>
                        <span>Rendering dashboard...</span>
                    </div>
                </div>
            </div>
        </div>
        <!-- Header -->
        <header class="bg-mm-red text-white shadow-lg">
            <div class="container mx-auto px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div>
                            <h1 class="text-2xl font-bold">M&M Recruitment Process Audit Dashboard</h1>
                            <p class="text-sm text-red-100 mt-1">Real-time QA Insights & Performance Analytics</p>
                        </div>
                        <!-- Audio Description & Theme Toggle -->
                        <div class="flex gap-2 ml-6">
                            <button onclick="toggleAudioDescription()" id="audio-toggle" class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition flex items-center gap-2" title="Toggle Audio Description">
                                <i class="fas fa-volume-up"></i>
                                <span class="text-xs font-medium">Audio</span>
                            </button>
                            <button onclick="toggleTheme()" id="theme-toggle" class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition flex items-center gap-2" title="Toggle Theme">
                                <i class="fas fa-moon"></i>
                                <span class="text-xs font-medium">Theme</span>
                            </button>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <label for="excel-upload" class="bg-white text-red-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-red-50 transition flex items-center gap-2 font-semibold">
                            <i class="fas fa-upload"></i>
                            <span>Upload Excel</span>
                            <input type="file" id="excel-upload" accept=".xlsx,.xls" class="hidden" onchange="handleFileUpload(event)">
                        </label>
                        <button onclick="exportToPDF()" class="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition flex items-center gap-2 font-semibold">
                            <i class="fas fa-file-pdf"></i>
                            <span>Export PDF</span>
                        </button>
                        <button onclick="resetFilters()" class="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition flex items-center gap-2 font-semibold">
                            <i class="fas fa-redo"></i>
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Vertical Sidebar Navigation -->
        <nav class="sidebar-nav">
            <div class="nav-tab active" onclick="switchTab('overview')">
                <div class="nav-tab-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="nav-tab-content">
                    <div class="nav-tab-title">Overview</div>
                    <div class="nav-tab-desc">Key metrics & summary</div>
                </div>
            </div>
            
            <div class="nav-tab" onclick="switchTab('stage-parameter')">
                <div class="nav-tab-icon">
                    <i class="fas fa-table"></i>
                </div>
                <div class="nav-tab-content">
                    <div class="nav-tab-title">Stage & Parameter</div>
                    <div class="nav-tab-desc">Heatmap analysis</div>
                </div>
            </div>
            
            <div class="nav-tab" onclick="switchTab('recruiter')">
                <div class="nav-tab-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="nav-tab-content">
                    <div class="nav-tab-title">Recruiter View</div>
                    <div class="nav-tab-desc">Performance metrics</div>
                </div>
            </div>
            
            <div class="nav-tab" onclick="switchTab('trends')">
                <div class="nav-tab-icon">
                    <i class="fas fa-chart-area"></i>
                </div>
                <div class="nav-tab-content">
                    <div class="nav-tab-title">Trends & FY</div>
                    <div class="nav-tab-desc">Historical analysis</div>
                </div>
            </div>
            
            <div class="nav-tab" onclick="switchTab('insights')">
                <div class="nav-tab-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <div class="nav-tab-content">
                    <div class="nav-tab-title">Insights</div>
                    <div class="nav-tab-desc">AI recommendations</div>
                </div>
            </div>
            
            <div class="nav-tab" onclick="switchTab('strategic')">
                <div class="nav-tab-icon">
                    <i class="fas fa-chess"></i>
                </div>
                <div class="nav-tab-content">
                    <div class="nav-tab-title">Strategic View</div>
                    <div class="nav-tab-desc">RCAs, CAPAs & Six Sigma</div>
                </div>
            </div>
            
        </nav>

        <!-- Main Content Wrapper -->
        <div class="main-content-wrapper">
        
        <!-- Global Filters -->
        <div class="bg-white border-b border-gray-200 py-4 sticky top-0 z-30 shadow-sm">
            <div class="px-6">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-2">FINANCIAL YEAR</label>
                        <select id="filter-year" onchange="applyFilters()" class="w-full" multiple size="1">
                            <option value="all" selected>All Years</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-2">MONTH</label>
                        <select id="filter-month" onchange="applyFilters()" class="w-full">
                            <option value="all" selected>All Months</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-2">WEEK</label>
                        <select id="filter-week" onchange="applyFilters()" class="w-full">
                            <option value="all" selected>All Weeks</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-2">RECRUITMENT STAGE</label>
                        <select id="filter-stage" onchange="applyFilters()" class="w-full">
                            <option value="all" selected>All Stages</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-2">PARAMETER</label>
                        <select id="filter-parameter" onchange="applyFilters()" class="w-full">
                            <option value="all" selected>All Parameters</option>
                        </select>
                    </div>
                </div>
                <div id="active-filters" class="mt-3 flex flex-wrap gap-2"></div>
            </div>
        </div>

        <!-- Main Content -->
        <main class="px-6 py-6">
            <!-- Loading State -->
            <div id="loading-state" class="text-center py-20">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-600">Please upload the Excel file to begin...</p>
            </div>

            <!-- Overview Tab -->
            <div id="tab-overview" class="tab-content hidden">
                <!-- Key Metrics -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div class="dashboard-card metric-card">
                        <div class="metric-value" id="metric-accuracy">--</div>
                        <div class="metric-label">Overall Accuracy</div>
                        <div class="text-xs text-gray-500 mt-2">Weighted by Opportunity Count</div>
                    </div>
                    <div class="dashboard-card metric-card">
                        <div class="metric-value" id="metric-error-rate">--</div>
                        <div class="metric-label">Overall Error Rate</div>
                        <div class="text-xs text-gray-500 mt-2">Opportunities Failed / Total</div>
                    </div>
                    <div class="dashboard-card metric-card">
                        <div class="metric-value" id="metric-total-audits">--</div>
                        <div class="metric-label">Total Audits</div>
                        <div class="text-xs text-gray-500 mt-2">Opportunity Count</div>
                    </div>
                    <div class="dashboard-card metric-card">
                        <div class="metric-value" id="metric-sample-coverage">--</div>
                        <div class="metric-label">Sample Coverage</div>
                        <div class="text-xs text-gray-500 mt-2">Sample / Population</div>
                    </div>
                </div>

                <!-- Dynamic Narrative -->
                <div class="dashboard-card p-6 mb-6 bg-blue-50 border-blue-200">
                    <h3 class="text-lg font-bold text-gray-800 mb-3">
                        <i class="fas fa-info-circle text-blue-600 mr-2"></i>Key Insights
                    </h3>
                    <div id="dynamic-narrative" class="text-gray-700 space-y-2">
                        <p>Upload data to see insights...</p>
                    </div>
                </div>

                <!-- Charts Row 1 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-chart-bar text-mm-red mr-2"></i>Monthly Accuracy vs Error Rate (FY Comparison)
                            </h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="monthly-accuracy-chart"></canvas>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-layer-group text-mm-red mr-2"></i>Recruitment Stage-wise Audit Scores
                            </h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="stage-audit-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Charts Row 2 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-exclamation-triangle text-mm-red mr-2"></i>Parameter-wise Error Hotspots
                            </h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="parameter-error-chart"></canvas>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-calendar-week text-mm-red mr-2"></i>Weekly Accuracy and Volume Trend
                            </h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="weekly-trend-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Funnel Chart -->
                <div class="dashboard-card mb-6">
                    <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                        <h3 class="font-bold text-gray-800">
                            <i class="fas fa-filter text-mm-red mr-2"></i>Opportunities Funnel
                        </h3>
                    </div>
                    <div class="chart-container" style="height: 300px;">
                        <canvas id="funnel-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Stage & Parameter Tab -->
            <div id="tab-stage-parameter" class="tab-content hidden">
                <!-- Breadcrumb -->
                <div class="mb-6">
                    <div class="flex items-center text-sm text-gray-600">
                        <a href="#" onclick="switchTab('overview'); return false;" class="hover:text-mm-red">Home</a>
                        <i class="fas fa-chevron-right mx-2 text-xs"></i>
                        <span>Stages</span>
                        <i class="fas fa-chevron-right mx-2 text-xs"></i>
                        <span class="text-mm-red font-semibold" id="stage-breadcrumb">Deep Dive</span>
                    </div>
                </div>

                <!-- Stage Tabs -->
                <div class="mb-6">
                    <div class="flex flex-wrap gap-3">
                        <button onclick="selectStageTab('Pre-Sourcing')" class="stage-tab-btn" data-stage="Pre-Sourcing">
                            <i class="fas fa-search mr-2"></i>Pre-Sourcing
                        </button>
                        <button onclick="selectStageTab('Intake')" class="stage-tab-btn active" data-stage="Intake">
                            <i class="fas fa-clipboard-list mr-2"></i>Intake
                        </button>
                        <button onclick="selectStageTab('Screening')" class="stage-tab-btn" data-stage="Screening">
                            <i class="fas fa-user-check mr-2"></i>Screening
                        </button>
                        <button onclick="selectStageTab('Assessment')" class="stage-tab-btn" data-stage="Assessment">
                            <i class="fas fa-tasks mr-2"></i>Assessment
                        </button>
                        <button onclick="selectStageTab('OfferAPL')" class="stage-tab-btn" data-stage="OfferAPL">
                            <i class="fas fa-file-contract mr-2"></i>Offer/APL
                        </button>
                        <button onclick="selectStageTab('Pre-Onboarding')" class="stage-tab-btn" data-stage="Pre-Onboarding">
                            <i class="fas fa-user-plus mr-2"></i>Pre-Onboarding
                        </button>
                    </div>
                </div>

                <!-- Stage Metrics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <!-- Accuracy Metric -->
                    <div class="dashboard-card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                                <div class="text-4xl font-bold text-orange-600 mb-1" id="stage-accuracy">--</div>
                                <div class="text-sm text-gray-700 font-semibold mb-1" id="stage-accuracy-label">Intake Accuracy</div>
                                <div class="inline-flex items-center px-2 py-1 bg-white rounded text-xs font-medium" id="stage-accuracy-badge">
                                    <span class="text-orange-600">fd7e14</span>
                                </div>
                            </div>
                            <div class="text-orange-400">
                                <i class="fas fa-arrow-trend-down text-3xl"></i>
                            </div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-orange-200">
                            <span class="inline-flex items-center text-xs text-red-600">
                                <i class="fas fa-triangle-exclamation mr-1"></i>
                                <span class="font-semibold">Below Target</span>
                            </span>
                        </div>
                    </div>

                    <!-- Total Audits -->
                    <div class="dashboard-card p-6 bg-white">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="text-4xl font-bold text-blue-600 mb-1" id="stage-audits">--</div>
                                <div class="text-sm text-gray-600 font-semibold mb-3">Total Audits</div>
                                <div class="inline-flex items-center text-xs text-green-600">
                                    <i class="fas fa-arrow-up mr-1"></i>
                                    <span class="font-semibold" id="stage-trend">+12% vs Last Month</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error Rate -->
                    <div class="dashboard-card p-6 bg-white">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="text-4xl font-bold text-red-600 mb-1" id="stage-error-rate">--</div>
                                <div class="text-sm text-gray-600 font-semibold mb-3">Error Rate</div>
                                <div class="inline-flex items-center px-2 py-1 bg-red-100 rounded text-xs text-red-700">
                                    <i class="fas fa-circle-exclamation mr-1"></i>
                                    <span class="font-semibold">Needs Attention</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Completeness Score -->
                    <div class="dashboard-card p-6 bg-white">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="text-4xl font-bold text-yellow-600 mb-1" id="stage-completeness">--</div>
                                <div class="text-sm text-gray-600 font-semibold mb-3">Completeness Score</div>
                                <div class="text-yellow-600">
                                    <i class="fas fa-arrow-trend-up text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Parameter Breakdown & Parameters Side by Side -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- Parameter Breakdown -->
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <h3 class="font-bold text-gray-800 flex items-center">
                                    <span>Parameter Breakdown</span>
                                    <i class="fas fa-circle-info ml-2 text-gray-400 text-sm"></i>
                                </h3>
                                <span class="text-2xl font-bold text-gray-400" id="breakdown-percentage">40%</span>
                            </div>
                        </div>
                        <div class="p-6" id="parameter-breakdown-list">
                            <!-- Parameter items will be inserted here -->
                        </div>
                    </div>

                    <!-- Parameters -->
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200">
                            <h3 class="font-bold text-gray-800">Parameters</h3>
                        </div>
                        <div class="p-6" id="parameters-list">
                            <!-- Parameter items will be inserted here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recruiter View Tab -->
            <div id="tab-recruiter" class="tab-content hidden">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-chart-scatter text-mm-red mr-2"></i>Recruiter Performance Quadrant
                            </h3>
                            <p class="text-xs text-gray-600 mt-1">Sample Count vs Accuracy Score</p>
                        </div>
                        <div class="chart-container">
                            <canvas id="recruiter-scatter-chart"></canvas>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-user-chart text-mm-red mr-2"></i>Top 10 Recruiters by Accuracy
                            </h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="recruiter-bar-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                        <h3 class="font-bold text-gray-800">
                            <i class="fas fa-table text-mm-red mr-2"></i>Recruiter Performance Table
                        </h3>
                    </div>
                    <div class="p-6 overflow-x-auto">
                        <table id="recruiter-table" class="w-full text-sm">
                            <thead class="bg-gray-100 text-gray-700">
                                <tr>
                                    <th class="px-4 py-3 text-left">Recruiter Name</th>
                                    <th class="px-4 py-3 text-center">Accuracy Score</th>
                                    <th class="px-4 py-3 text-center">Error Count</th>
                                    <th class="px-4 py-3 text-center">Sample Count</th>
                                    <th class="px-4 py-3 text-center">Program Manager</th>
                                    <th class="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody id="recruiter-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Trends & FY Comparison Tab -->
            <!-- Trends & Predictive Analytics Tab -->
            <div id="tab-trends" class="tab-content hidden">
                <!-- Header with Toggle -->
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <p class="text-xs text-gray-500 uppercase mb-1">HEADER</p>
                        <h2 class="text-3xl font-bold text-gray-800">TRENDS & PREDICTIVE ANALYTICS</h2>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-gray-600">Historical View</span>
                            <span class="text-blue-600 font-semibold">| Forecast View</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="forecast-toggle" class="sr-only peer" checked onchange="toggleForecastView()">
                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-400"></div>
                        </label>
                        <button class="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition">
                            <i class="fas fa-calendar"></i>
                            <span class="text-sm font-semibold">Last 12 Months</span>
                        </button>
                    </div>
                </div>

                <!-- TOP SECTION - 3 Forecast Cards -->
                <p class="text-xs text-gray-500 uppercase mb-3">TOP SECTION</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <!-- Forecasted Accuracy -->
                    <div class="forecast-card forecast-card-blue">
                        <div class="forecast-card-header">FORECASTED ACCURACY</div>
                        <div class="forecast-card-value forecast-value-cyan" id="forecast-accuracy">98.8%</div>
                        <div class="forecast-card-subtitle">Next Month Prediction</div>
                        <div class="forecast-confidence">
                            <span>Confidence: <strong>92%</strong></span>
                            <span class="forecast-trend forecast-trend-up">
                                <i class="fas fa-arrow-up"></i> +0.6%
                            </span>
                        </div>
                        <div class="forecast-progress">
                            <div class="forecast-progress-bar" style="width: 92%; background: linear-gradient(90deg, #22D3EE 0%, #06B6D4 100%);"></div>
                        </div>
                    </div>

                    <!-- Predicted Error Rate -->
                    <div class="forecast-card forecast-card-purple">
                        <div class="forecast-card-header">PREDICTED ERROR RATE</div>
                        <div class="forecast-card-value forecast-value-magenta" id="forecast-error">1.2%</div>
                        <div class="forecast-card-subtitle">30-Day Forecast</div>
                        <div class="forecast-confidence">
                            <span>Confidence: <strong>88%</strong></span>
                            <span class="forecast-trend forecast-trend-down">
                                <i class="fas fa-arrow-down"></i> -0.4%
                            </span>
                        </div>
                        <div class="forecast-progress">
                            <div class="forecast-progress-bar" style="width: 88%; background: linear-gradient(90deg, #C084FC 0%, #A855F7 100%);"></div>
                        </div>
                    </div>

                    <!-- Audit Volume Forecast -->
                    <div class="forecast-card forecast-card-teal">
                        <div class="forecast-card-header">AUDIT VOLUME FORECAST</div>
                        <div class="forecast-card-value forecast-value-teal" id="forecast-volume">3,240</div>
                        <div class="forecast-card-subtitle">Expected Audits</div>
                        <div class="forecast-confidence">
                            <span>Confidence: <strong>94%</strong></span>
                            <span class="forecast-change">+8% vs Current</span>
                        </div>
                        <div class="forecast-progress">
                            <div class="forecast-progress-bar" style="width: 94%; background: linear-gradient(90deg, #14B8A6 0%, #0D9488 100%);"></div>
                        </div>
                    </div>
                </div>

                <!-- MAIN CONTENT - Historical & Forecasted Performance Chart -->
                <p class="text-xs text-gray-500 uppercase mb-3">MAIN CONTENT - LARGE CHART SECTION</p>
                <div class="forecast-chart-container">
                    <div class="forecast-chart-header">
                        <h3 class="text-xl font-bold text-white">Historical & Forecasted Performance</h3>
                        <div class="flex items-center gap-6 text-sm">
                            <div class="flex items-center gap-2">
                                <span class="forecast-legend-dot" style="background: #22D3EE;"></span>
                                <span class="text-cyan-200">Forecasted Accuracy</span>
                                <span class="text-cyan-400 font-bold" id="chart-forecast-accuracy">98.8%</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="forecast-legend-dot" style="background: #C084FC;"></span>
                                <span class="text-purple-200">Predicted Error Rate</span>
                                <span class="text-purple-400 font-bold" id="chart-forecast-error">1.2%</span>
                            </div>
                        </div>
                    </div>
                    <div class="forecast-chart-body">
                        <canvas id="predictive-chart" height="80"></canvas>
                        <div class="forecast-start-line">FORECAST START</div>
                    </div>
                </div>
            </div>

            <!-- Insights & Recommendations Tab -->
            <div id="tab-insights" class="tab-content hidden">
                <div class="dashboard-card p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>AI-Powered Insights
                    </h3>
                    <div id="ai-insights" class="space-y-3"></div>
                </div>

                <div class="dashboard-card p-6 mb-6 bg-mm-light-red">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-check-circle text-mm-red mr-2"></i>Recommended Actions
                    </h3>
                    <div id="recommendations" class="space-y-3"></div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="dashboard-card p-6">
                        <h4 class="font-bold text-gray-800 mb-4">
                            <i class="fas fa-fire text-red-500 mr-2"></i>Critical Error Patterns
                        </h4>
                        <div id="critical-errors" class="space-y-2"></div>
                    </div>
                    <div class="dashboard-card p-6">
                        <h4 class="font-bold text-gray-800 mb-4">
                            <i class="fas fa-star text-yellow-500 mr-2"></i>Best Practices Identified
                        </h4>
                        <div id="best-practices" class="space-y-2"></div>
                    </div>
                </div>
            </div>

            <!-- Team & People Analytics - Recruiter Performance Tab -->
            <div id="tab-recruiter-performance" class="tab-content hidden">
                <div class="dashboard-card p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user text-mm-red mr-2"></i>Individual Recruiter Scorecards
                    </h3>
                    <p class="text-gray-600 mb-4">Detailed performance metrics for each recruiter</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div class="dashboard-card p-6">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">SELECT RECRUITER</h4>
                        <select id="recruiter-select" class="w-full border rounded p-2" onchange="loadRecruiterScorecard()">
                            <option value="">Choose a recruiter...</option>
                        </select>
                    </div>
                    <div class="dashboard-card p-6 bg-green-50">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">ACCURACY SCORE</h4>
                        <div class="text-3xl font-bold text-green-600" id="recruiter-accuracy">--</div>
                    </div>
                    <div class="dashboard-card p-6 bg-blue-50">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">TOTAL AUDITS</h4>
                        <div class="text-3xl font-bold text-blue-600" id="recruiter-audits">--</div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                        <h3 class="font-bold text-gray-800">
                            <i class="fas fa-chart-bar text-mm-red mr-2"></i>Recruiter Performance Breakdown
                        </h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="recruiter-scorecard-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Team Comparison Tab -->
            <div id="tab-team-comparison" class="tab-content hidden">
                <div class="dashboard-card p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-users text-mm-red mr-2"></i>Team-wise Performance Ranking
                    </h3>
                    <p class="text-gray-600">Compare performance across different teams and program managers</p>
                </div>

                <div class="dashboard-card">
                    <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                        <h3 class="font-bold text-gray-800">
                            <i class="fas fa-ranking-star text-mm-red mr-2"></i>Team Performance Leaderboard
                        </h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="team-comparison-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Top Performers Tab -->
            <div id="tab-top-performers" class="tab-content hidden">
                <div class="dashboard-card p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-trophy text-yellow-500 mr-2"></i>Best Performing Recruiters
                    </h3>
                    <p class="text-gray-600">Recognition and analysis of top performers</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="dashboard-card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
                        <div class="text-center">
                            <i class="fas fa-trophy text-6xl text-yellow-500 mb-3"></i>
                            <h4 class="text-lg font-bold text-gray-800 mb-2">🥇 Top Performer</h4>
                            <div class="text-2xl font-bold text-yellow-600" id="top-1-name">--</div>
                            <div class="text-sm text-gray-600" id="top-1-score">--</div>
                        </div>
                    </div>
                    <div class="dashboard-card p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300">
                        <div class="text-center">
                            <i class="fas fa-medal text-6xl text-gray-500 mb-3"></i>
                            <h4 class="text-lg font-bold text-gray-800 mb-2">🥈 Second Place</h4>
                            <div class="text-2xl font-bold text-gray-600" id="top-2-name">--</div>
                            <div class="text-sm text-gray-600" id="top-2-score">--</div>
                        </div>
                    </div>
                    <div class="dashboard-card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300">
                        <div class="text-center">
                            <i class="fas fa-award text-6xl text-orange-500 mb-3"></i>
                            <h4 class="text-lg font-bold text-gray-800 mb-2">🥉 Third Place</h4>
                            <div class="text-2xl font-bold text-orange-600" id="top-3-name">--</div>
                            <div class="text-sm text-gray-600" id="top-3-score">--</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                        <h3 class="font-bold text-gray-800">
                            <i class="fas fa-chart-bar text-mm-red mr-2"></i>Top 10 Performers
                        </h3>
                    </div>
                    <div class="p-6">
                        <div id="top-performers-list"></div>
                    </div>
                </div>
            </div>

            <!-- Improvement Areas Tab -->
            <div id="tab-improvement-areas" class="tab-content hidden">
                <div class="dashboard-card p-6 mb-6 bg-red-50 border-red-200">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>Recruiters Needing Coaching
                    </h3>
                    <p class="text-gray-600">Identify areas requiring intervention and support</p>
                </div>

                <div class="dashboard-card p-6 mb-6">
                    <h4 class="font-bold text-gray-800 mb-4">Improvement Focus Areas</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 border-l-4 border-red-500 bg-red-50">
                            <h5 class="font-semibold text-red-800 mb-2">Low Accuracy (&lt;80%)</h5>
                            <div id="low-accuracy-list" class="space-y-2"></div>
                        </div>
                        <div class="p-4 border-l-4 border-orange-500 bg-orange-50">
                            <h5 class="font-semibold text-orange-800 mb-2">High Error Rate (&gt;15%)</h5>
                            <div id="high-error-list" class="space-y-2"></div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                        <h3 class="font-bold text-gray-800">
                            <i class="fas fa-chart-line text-mm-red mr-2"></i>Performance Trend Analysis
                        </h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="improvement-trend-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Program Manager View Tab -->
            <div id="tab-program-manager-view" class="tab-content hidden">
                <div class="dashboard-card p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user-tie text-mm-red mr-2"></i>Program Manager Team Performance
                    </h3>
                    <p class="text-gray-600">PM-wise team analytics and performance metrics</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="dashboard-card p-6">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">SELECT PM</h4>
                        <select id="pm-select" class="w-full border rounded p-2" onchange="loadPMView()">
                            <option value="">Choose a PM...</option>
                        </select>
                    </div>
                    <div class="dashboard-card p-6 bg-blue-50">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">TEAM SIZE</h4>
                        <div class="text-3xl font-bold text-blue-600" id="pm-team-size">--</div>
                    </div>
                    <div class="dashboard-card p-6 bg-green-50">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">AVG ACCURACY</h4>
                        <div class="text-3xl font-bold text-green-600" id="pm-accuracy">--</div>
                    </div>
                    <div class="dashboard-card p-6 bg-purple-50">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">TOTAL AUDITS</h4>
                        <div class="text-3xl font-bold text-purple-600" id="pm-audits">--</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-users text-mm-red mr-2"></i>Team Member Performance
                            </h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="pm-team-chart"></canvas>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                            <h3 class="font-bold text-gray-800">
                                <i class="fas fa-chart-pie text-mm-red mr-2"></i>Team Accuracy Distribution
                            </h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="pm-distribution-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="p-4 border-b border-gray-200 bg-mm-light-red">
                        <h3 class="font-bold text-gray-800">
                            <i class="fas fa-table text-mm-red mr-2"></i>Team Members Details
                        </h3>
                    </div>
                    <div class="p-6">
                        <div id="pm-team-table"></div>
                    </div>
                </div>
            </div>

            <!-- Strategic View Tab -->
            <div id="tab-strategic" class="tab-content hidden">
                <div class="mb-6">
                    <h2 class="text-3xl font-bold" style="color: var(--text-primary);">Strategic View</h2>
                    <p class="text-sm" style="color: var(--text-secondary);">Root Cause Analysis, Corrective Actions & Six Sigma Projects</p>
                </div>

                <!-- RCA/CAPA Section -->
                <div class="dashboard-card p-6 mb-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold flex items-center" style="color: var(--text-primary);">
                            <i class="fas fa-search-plus mr-3" style="color: var(--mm-red);"></i>
                            Root Cause Analysis (RCA) & CAPAs
                        </h3>
                        <button onclick="addNewRCA()" class="px-4 py-2 bg-mm-red text-white rounded-lg hover:bg-mm-dark-red transition">
                            <i class="fas fa-plus mr-2"></i>Add New RCA
                        </button>
                    </div>

                    <!-- RCA Status Overview -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="text-sm font-semibold mb-1" style="color: var(--text-secondary);">TOTAL RCAs</div>
                            <div class="text-3xl font-bold" style="color: var(--text-primary);" id="total-rcas">0</div>
                        </div>
                        <div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="text-sm font-semibold mb-1" style="color: var(--text-secondary);">IN PROGRESS</div>
                            <div class="text-3xl font-bold text-yellow-500" id="inprogress-rcas">0</div>
                        </div>
                        <div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="text-sm font-semibold mb-1" style="color: var(--text-secondary);">COMPLETED</div>
                            <div class="text-3xl font-bold text-green-500" id="completed-rcas">0</div>
                        </div>
                        <div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="text-sm font-semibold mb-1" style="color: var(--text-secondary);">PENDING</div>
                            <div class="text-3xl font-bold text-red-500" id="pending-rcas">0</div>
                        </div>
                    </div>

                    <!-- RCA Table -->
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead style="background: var(--bg-tertiary);">
                                <tr>
                                    <th class="px-4 py-3 text-left" style="color: var(--text-primary);">ID</th>
                                    <th class="px-4 py-3 text-left" style="color: var(--text-primary);">Issue Description</th>
                                    <th class="px-4 py-3 text-left" style="color: var(--text-primary);">Root Cause</th>
                                    <th class="px-4 py-3 text-left" style="color: var(--text-primary);">CAPA</th>
                                    <th class="px-4 py-3 text-left" style="color: var(--text-primary);">Owner</th>
                                    <th class="px-4 py-3 text-left" style="color: var(--text-primary);">Status</th>
                                    <th class="px-4 py-3 text-left" style="color: var(--text-primary);">Due Date</th>
                                    <th class="px-4 py-3 text-center" style="color: var(--text-primary);">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="rca-table-body">
                                <!-- Sample RCA Data -->
                                <tr style="border-bottom: 1px solid var(--border-primary);">
                                    <td class="px-4 py-3" style="color: var(--text-primary);">RCA-001</td>
                                    <td class="px-4 py-3" style="color: var(--text-primary);">High error rate in Intake Meeting form completion</td>
                                    <td class="px-4 py-3" style="color: var(--text-secondary);">Mandatory fields not enforced in ATS</td>
                                    <td class="px-4 py-3" style="color: var(--text-secondary);">Enable mandatory field validation</td>
                                    <td class="px-4 py-3" style="color: var(--text-primary);">John Doe</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">In Progress</span>
                                    </td>
                                    <td class="px-4 py-3" style="color: var(--text-primary);">2025-01-15</td>
                                    <td class="px-4 py-3 text-center">
                                        <button class="text-blue-500 hover:text-blue-700 mr-2"><i class="fas fa-edit"></i></button>
                                        <button class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--border-primary);">
                                    <td class="px-4 py-3" style="color: var(--text-primary);">RCA-002</td>
                                    <td class="px-4 py-3" style="color: var(--text-primary);">Document verification errors in BGV</td>
                                    <td class="px-4 py-3" style="color: var(--text-secondary);">Lack of standardized checklist</td>
                                    <td class="px-4 py-3" style="color: var(--text-secondary);">Create and deploy BGV checklist template</td>
                                    <td class="px-4 py-3" style="color: var(--text-primary);">Jane Smith</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">Completed</span>
                                    </td>
                                    <td class="px-4 py-3" style="color: var(--text-primary);">2024-12-20</td>
                                    <td class="px-4 py-3 text-center">
                                        <button class="text-blue-500 hover:text-blue-700 mr-2"><i class="fas fa-eye"></i></button>
                                        <button class="text-green-500 hover:text-green-700"><i class="fas fa-download"></i></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Six Sigma Projects Section -->
                <div class="dashboard-card p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold flex items-center" style="color: var(--text-primary);">
                            <i class="fas fa-project-diagram mr-3" style="color: var(--mm-red);"></i>
                            Six Sigma Projects
                        </h3>
                        <button onclick="addNewProject()" class="px-4 py-2 bg-mm-red text-white rounded-lg hover:bg-mm-dark-red transition">
                            <i class="fas fa-plus mr-2"></i>Add New Project
                        </button>
                    </div>

                    <!-- Six Sigma Metrics -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="text-sm font-semibold mb-1" style="color: var(--text-secondary);">ACTIVE PROJECTS</div>
                            <div class="text-3xl font-bold" style="color: var(--text-primary);" id="active-projects">3</div>
                        </div>
                        <div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="text-sm font-semibold mb-1" style="color: var(--text-secondary);">AVG. SIGMA LEVEL</div>
                            <div class="text-3xl font-bold text-blue-500" id="avg-sigma">4.2σ</div>
                        </div>
                        <div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="text-sm font-semibold mb-1" style="color: var(--text-secondary);">TOTAL SAVINGS</div>
                            <div class="text-3xl font-bold text-green-500" id="total-savings">$125K</div>
                        </div>
                    </div>

                    <!-- Projects Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Project 1 -->
                        <div class="p-6 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                                        D
                                    </div>
                                    <div>
                                        <h4 class="font-bold" style="color: var(--text-primary);">DMAIC: Intake Quality</h4>
                                        <p class="text-xs" style="color: var(--text-secondary);">Phase: Analyze</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">Active</span>
                            </div>
                            <p class="text-sm mb-4" style="color: var(--text-secondary);">
                                Reduce Intake form errors by 50% through process standardization and automation
                            </p>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span style="color: var(--text-secondary);">Progress</span>
                                    <span style="color: var(--text-primary);">60%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-500 h-2 rounded-full" style="width: 60%"></div>
                                </div>
                            </div>
                            <div class="mt-4 flex justify-between text-xs" style="color: var(--text-secondary);">
                                <span><i class="fas fa-user mr-1"></i>Sarah Johnson</span>
                                <span><i class="fas fa-calendar mr-1"></i>Due: Feb 2025</span>
                            </div>
                        </div>

                        <!-- Project 2 -->
                        <div class="p-6 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                                        L
                                    </div>
                                    <div>
                                        <h4 class="font-bold" style="color: var(--text-primary);">Lean: BGV Process</h4>
                                        <p class="text-xs" style="color: var(--text-secondary);">Phase: Control</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">On Track</span>
                            </div>
                            <p class="text-sm mb-4" style="color: var(--text-secondary);">
                                Eliminate waste in BGV document verification, reduce cycle time by 30%
                            </p>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span style="color: var(--text-secondary);">Progress</span>
                                    <span style="color: var(--text-primary);">85%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
                                </div>
                            </div>
                            <div class="mt-4 flex justify-between text-xs" style="color: var(--text-secondary);">
                                <span><i class="fas fa-user mr-1"></i>Mike Chen</span>
                                <span><i class="fas fa-calendar mr-1"></i>Due: Jan 2025</span>
                            </div>
                        </div>

                        <!-- Project 3 -->
                        <div class="p-6 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold mr-3">
                                        K
                                    </div>
                                    <div>
                                        <h4 class="font-bold" style="color: var(--text-primary);">Kaizen: Offer Letter QC</h4>
                                        <p class="text-xs" style="color: var(--text-secondary);">Phase: Implement</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">Active</span>
                            </div>
                            <p class="text-sm mb-4" style="color: var(--text-secondary);">
                                Continuous improvement in offer letter accuracy through peer review system
                            </p>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span style="color: var(--text-secondary);">Progress</span>
                                    <span style="color: var(--text-primary);">40%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-purple-500 h-2 rounded-full" style="width: 40%"></div>
                                </div>
                            </div>
                            <div class="mt-4 flex justify-between text-xs" style="color: var(--text-secondary);">
                                <span><i class="fas fa-user mr-1"></i>Emma Wilson</span>
                                <span><i class="fas fa-calendar mr-1"></i>Due: Mar 2025</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Strategic View Tab -->
            <div id="tab-strategic" class="tab-content hidden">
                <!-- Strategic View Header -->
                <div class="dashboard-card p-6 mb-6">
                    <h2 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-chess text-mm-red mr-2"></i>Strategic View
                    </h2>
                    <p style="color: var(--text-secondary);">Root Cause Analysis (RCA), Corrective Actions (CAPA), and Six Sigma Project Management</p>
                </div>

                <!-- Strategic Tabs Navigation -->
                <div class="dashboard-card mb-6">
                    <div class="flex border-b" style="border-color: var(--border-color);">
                        <button onclick="switchStrategicTab('rca')" id="strategic-tab-rca" class="strategic-tab active px-6 py-3 font-semibold transition-all">
                            <i class="fas fa-search mr-2"></i>RCA Projects
                        </button>
                        <button onclick="switchStrategicTab('capa')" id="strategic-tab-capa" class="strategic-tab px-6 py-3 font-semibold transition-all">
                            <i class="fas fa-clipboard-check mr-2"></i>CAPA Actions
                        </button>
                        <button onclick="switchStrategicTab('sixsigma')" id="strategic-tab-sixsigma" class="strategic-tab px-6 py-3 font-semibold transition-all">
                            <i class="fas fa-chart-line mr-2"></i>Six Sigma Projects
                        </button>
                    </div>
                </div>

                <!-- RCA Projects Content -->
                <div id="strategic-content-rca" class="strategic-content">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <!-- Summary Cards -->
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">TOTAL RCA PROJECTS</h4>
                                <i class="fas fa-project-diagram" style="color: var(--mm-red);"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">12</div>
                            <div class="text-xs" style="color: var(--success-color);">
                                <i class="fas fa-arrow-up mr-1"></i>3 new this month
                            </div>
                        </div>
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">IN PROGRESS</h4>
                                <i class="fas fa-spinner" style="color: #F59E0B;"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">7</div>
                            <div class="text-xs" style="color: var(--text-secondary);">
                                Average 23 days to completion
                            </div>
                        </div>
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">COMPLETED</h4>
                                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">5</div>
                            <div class="text-xs" style="color: var(--success-color);">
                                <i class="fas fa-check mr-1"></i>100% effectiveness
                            </div>
                        </div>
                    </div>

                    <!-- RCA Projects List -->
                    <div class="dashboard-card">
                        <div class="p-4 border-b" style="background: var(--card-bg); border-color: var(--border-color);">
                            <h3 class="font-bold" style="color: var(--text-primary);">
                                <i class="fas fa-list text-mm-red mr-2"></i>Active RCA Projects
                            </h3>
                        </div>
                        <div class="p-6">
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead>
                                        <tr style="border-bottom: 2px solid var(--border-color);">
                                            <th class="text-left py-3 px-4 font-semibold" style="color: var(--text-secondary);">Project ID</th>
                                            <th class="text-left py-3 px-4 font-semibold" style="color: var(--text-secondary);">Issue Description</th>
                                            <th class="text-left py-3 px-4 font-semibold" style="color: var(--text-secondary);">Root Cause</th>
                                            <th class="text-left py-3 px-4 font-semibold" style="color: var(--text-secondary);">Stage</th>
                                            <th class="text-left py-3 px-4 font-semibold" style="color: var(--text-secondary);">Owner</th>
                                            <th class="text-left py-3 px-4 font-semibold" style="color: var(--text-secondary);">Status</th>
                                            <th class="text-left py-3 px-4 font-semibold" style="color: var(--text-secondary);">Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody id="rca-projects-table">
                                        <!-- Dynamic content will be loaded here -->
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td class="py-4 px-4 font-mono text-sm" style="color: var(--text-primary);">RCA-2025-001</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Low accuracy in Offer Letter validation</td>
                                            <td class="py-4 px-4" style="color: var(--text-secondary);">Inconsistent checklist usage</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Offer/APL</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Sarah Johnson</td>
                                            <td class="py-4 px-4">
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #FEF3C7; color: #92400E;">In Progress</span>
                                            </td>
                                            <td class="py-4 px-4">
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #FEE2E2; color: #991B1B;">High</span>
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td class="py-4 px-4 font-mono text-sm" style="color: var(--text-primary);">RCA-2025-002</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Document completeness issues in Pre-Onboarding</td>
                                            <td class="py-4 px-4" style="color: var(--text-secondary);">Manual tracking process</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Pre-Onboarding</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Mike Chen</td>
                                            <td class="py-4 px-4">
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #FEF3C7; color: #92400E;">In Progress</span>
                                            </td>
                                            <td class="py-4 px-4">
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #DBEAFE; color: #1E40AF;">Medium</span>
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td class="py-4 px-4 font-mono text-sm" style="color: var(--text-primary);">RCA-2024-089</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Screening quality variance across recruiters</td>
                                            <td class="py-4 px-4" style="color: var(--text-secondary);">Training gaps identified</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Screening</td>
                                            <td class="py-4 px-4" style="color: var(--text-primary);">Emma Wilson</td>
                                            <td class="py-4 px-4">
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #D1FAE5; color: #065F46;">Completed</span>
                                            </td>
                                            <td class="py-4 px-4">
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #DBEAFE; color: #1E40AF;">Medium</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CAPA Actions Content -->
                <div id="strategic-content-capa" class="strategic-content hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <!-- Summary Cards -->
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">TOTAL CAPA ACTIONS</h4>
                                <i class="fas fa-tasks" style="color: var(--mm-red);"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">28</div>
                            <div class="text-xs" style="color: var(--success-color);">
                                <i class="fas fa-arrow-up mr-1"></i>5 new actions
                            </div>
                        </div>
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">OPEN ACTIONS</h4>
                                <i class="fas fa-clock" style="color: #F59E0B;"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">15</div>
                            <div class="text-xs" style="color: var(--text-secondary);">
                                3 due this week
                            </div>
                        </div>
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">EFFECTIVENESS RATE</h4>
                                <i class="fas fa-chart-line" style="color: var(--success-color);"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">94%</div>
                            <div class="text-xs" style="color: var(--success-color);">
                                <i class="fas fa-check mr-1"></i>Above target
                            </div>
                        </div>
                    </div>

                    <!-- CAPA Actions List -->
                    <div class="dashboard-card">
                        <div class="p-4 border-b" style="background: var(--card-bg); border-color: var(--border-color);">
                            <h3 class="font-bold" style="color: var(--text-primary);">
                                <i class="fas fa-clipboard-list text-mm-red mr-2"></i>Active CAPA Actions
                            </h3>
                        </div>
                        <div class="p-6">
                            <div class="space-y-4">
                                <!-- CAPA Card 1 -->
                                <div class="p-4 rounded-lg" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="font-mono text-sm font-bold" style="color: var(--mm-red);">CAPA-2025-014</span>
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #FEE2E2; color: #991B1B;">High Priority</span>
                                            </div>
                                            <h4 class="font-semibold mb-1" style="color: var(--text-primary);">Implement automated checklist validation for Offer Letters</h4>
                                            <p class="text-sm mb-3" style="color: var(--text-secondary);">
                                                <strong>Corrective Action:</strong> Deploy automated system to validate offer letter completeness before submission
                                            </p>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Owner</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Sarah Johnson</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Stage</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Offer/APL</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Due Date</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Jan 15, 2025</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Status</div>
                                            <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #FEF3C7; color: #92400E;">In Progress</span>
                                        </div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex justify-between text-sm">
                                            <span style="color: var(--text-secondary);">Progress</span>
                                            <span style="color: var(--text-primary);">65%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="h-2 rounded-full" style="width: 65%; background: var(--mm-red);"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CAPA Card 2 -->
                                <div class="p-4 rounded-lg" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="font-mono text-sm font-bold" style="color: var(--mm-red);">CAPA-2025-013</span>
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #DBEAFE; color: #1E40AF;">Medium Priority</span>
                                            </div>
                                            <h4 class="font-semibold mb-1" style="color: var(--text-primary);">Standardize screening interview evaluation criteria</h4>
                                            <p class="text-sm mb-3" style="color: var(--text-secondary);">
                                                <strong>Corrective Action:</strong> Develop and deploy unified evaluation framework across all recruiters
                                            </p>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Owner</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Mike Chen</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Stage</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Screening</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Due Date</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Jan 20, 2025</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Status</div>
                                            <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #FEF3C7; color: #92400E;">In Progress</span>
                                        </div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex justify-between text-sm">
                                            <span style="color: var(--text-secondary);">Progress</span>
                                            <span style="color: var(--text-primary);">40%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="h-2 rounded-full" style="width: 40%; background: var(--mm-red);"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CAPA Card 3 -->
                                <div class="p-4 rounded-lg" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="font-mono text-sm font-bold" style="color: var(--mm-red);">CAPA-2024-092</span>
                                                <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #D1FAE5; color: #065F46;">Completed</span>
                                            </div>
                                            <h4 class="font-semibold mb-1" style="color: var(--text-primary);">Enhance Pre-Onboarding documentation tracking</h4>
                                            <p class="text-sm mb-3" style="color: var(--text-secondary);">
                                                <strong>Corrective Action:</strong> Implemented digital tracking system for all pre-onboarding documents
                                            </p>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Owner</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Emma Wilson</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Stage</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Pre-Onboarding</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Completed</div>
                                            <div class="text-sm" style="color: var(--text-primary);">Dec 28, 2024</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Effectiveness</div>
                                            <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #D1FAE5; color: #065F46;">Verified</span>
                                        </div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex justify-between text-sm">
                                            <span style="color: var(--text-secondary);">Progress</span>
                                            <span style="color: var(--text-primary);">100%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-green-500 h-2 rounded-full" style="width: 100%;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Six Sigma Projects Content -->
                <div id="strategic-content-sixsigma" class="strategic-content hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                        <!-- Summary Cards -->
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">ACTIVE PROJECTS</h4>
                                <i class="fas fa-project-diagram" style="color: var(--mm-red);"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">6</div>
                            <div class="text-xs" style="color: var(--success-color);">
                                <i class="fas fa-arrow-up mr-1"></i>2 Yellow Belts
                            </div>
                        </div>
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">AVG. CYCLE TIME</h4>
                                <i class="fas fa-clock" style="color: #F59E0B;"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">45</div>
                            <div class="text-xs" style="color: var(--text-secondary);">
                                days (target: 60)
                            </div>
                        </div>
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">DEFECT REDUCTION</h4>
                                <i class="fas fa-chart-line" style="color: var(--success-color);"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">32%</div>
                            <div class="text-xs" style="color: var(--success-color);">
                                <i class="fas fa-arrow-down mr-1"></i>vs. baseline
                            </div>
                        </div>
                        <div class="dashboard-card p-6">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-sm font-semibold" style="color: var(--text-secondary);">COST SAVINGS</h4>
                                <i class="fas fa-dollar-sign" style="color: var(--success-color);"></i>
                            </div>
                            <div class="text-3xl font-bold mb-1" style="color: var(--text-primary);">$48K</div>
                            <div class="text-xs" style="color: var(--success-color);">
                                <i class="fas fa-check mr-1"></i>YTD savings
                            </div>
                        </div>
                    </div>

                    <!-- Six Sigma Projects Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Project 1 -->
                        <div class="dashboard-card">
                            <div class="p-4 border-b" style="background: var(--card-bg); border-color: var(--border-color);">
                                <div class="flex items-center justify-between">
                                    <h3 class="font-bold" style="color: var(--text-primary);">
                                        <i class="fas fa-certificate text-mm-red mr-2"></i>SS-YB-2025-01
                                    </h3>
                                    <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #FEF3C7; color: #92400E;">Measure Phase</span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h4 class="font-semibold mb-2" style="color: var(--text-primary);">Reduce Offer Letter Error Rate</h4>
                                <p class="text-sm mb-4" style="color: var(--text-secondary);">
                                    DMAIC project to reduce offer letter errors from 8.2% to below 3% through process standardization
                                </p>
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Belt Level</div>
                                        <div class="text-sm font-semibold" style="color: var(--mm-red);">Yellow Belt</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Champion</div>
                                        <div class="text-sm" style="color: var(--text-primary);">David Lee</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Black Belt</div>
                                        <div class="text-sm" style="color: var(--text-primary);">Sarah Johnson</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Timeline</div>
                                        <div class="text-sm" style="color: var(--text-primary);">Q1 2025</div>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <div class="text-xs font-semibold mb-2" style="color: var(--text-secondary);">DMAIC Progress</div>
                                    <div class="flex gap-2">
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full" style="background: var(--mm-red);"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-primary);">Define</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full" style="background: var(--mm-red);"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-primary);">Measure</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full bg-gray-300"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-secondary);">Analyze</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full bg-gray-300"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-secondary);">Improve</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full bg-gray-300"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-secondary);">Control</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-4 pt-4" style="border-top: 1px solid var(--border-color);">
                                    <div class="text-center">
                                        <div class="text-xs mb-1" style="color: var(--text-secondary);">Baseline</div>
                                        <div class="text-lg font-bold" style="color: var(--mm-red);">8.2%</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-xs mb-1" style="color: var(--text-secondary);">Current</div>
                                        <div class="text-lg font-bold" style="color: var(--text-primary);">6.8%</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-xs mb-1" style="color: var(--text-secondary);">Target</div>
                                        <div class="text-lg font-bold" style="color: var(--success-color);">3.0%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Project 2 -->
                        <div class="dashboard-card">
                            <div class="p-4 border-b" style="background: var(--card-bg); border-color: var(--border-color);">
                                <div class="flex items-center justify-between">
                                    <h3 class="font-bold" style="color: var(--text-primary);">
                                        <i class="fas fa-certificate text-mm-red mr-2"></i>SS-YB-2024-12
                                    </h3>
                                    <span class="px-2 py-1 rounded text-xs font-semibold" style="background: #D1FAE5; color: #065F46;">Control Phase</span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h4 class="font-semibold mb-2" style="color: var(--text-primary);">Improve Screening Consistency</h4>
                                <p class="text-sm mb-4" style="color: var(--text-secondary);">
                                    DMAIC project to standardize screening evaluation and reduce variance across recruiters
                                </p>
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Belt Level</div>
                                        <div class="text-sm font-semibold" style="color: var(--mm-red);">Yellow Belt</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Champion</div>
                                        <div class="text-sm" style="color: var(--text-primary);">Rachel Adams</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Black Belt</div>
                                        <div class="text-sm" style="color: var(--text-primary);">Mike Chen</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-semibold mb-1" style="color: var(--text-secondary);">Timeline</div>
                                        <div class="text-sm" style="color: var(--text-primary);">Q4 2024</div>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <div class="text-xs font-semibold mb-2" style="color: var(--text-secondary);">DMAIC Progress</div>
                                    <div class="flex gap-2">
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full" style="background: var(--mm-red);"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-primary);">Define</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full" style="background: var(--mm-red);"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-primary);">Measure</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full" style="background: var(--mm-red);"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-primary);">Analyze</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full" style="background: var(--mm-red);"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-primary);">Improve</div>
                                        </div>
                                        <div class="flex-1 text-center">
                                            <div class="w-full h-2 rounded-full" style="background: var(--mm-red);"></div>
                                            <div class="text-xs mt-1" style="color: var(--text-primary);">Control</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-4 pt-4" style="border-top: 1px solid var(--border-color);">
                                    <div class="text-center">
                                        <div class="text-xs mb-1" style="color: var(--text-secondary);">Baseline</div>
                                        <div class="text-lg font-bold" style="color: var(--mm-red);">5.8%</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-xs mb-1" style="color: var(--text-secondary);">Current</div>
                                        <div class="text-lg font-bold" style="color: var(--success-color);">2.1%</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-xs mb-1" style="color: var(--text-secondary);">Target</div>
                                        <div class="text-lg font-bold" style="color: var(--success-color);">2.5%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </main>
        
        </div>
        <!-- End Main Content Wrapper -->

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
        <script src="/static/dashboard.js"></script>
    </body>
    </html>
  `)
})

export default app
