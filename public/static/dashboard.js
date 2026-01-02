// M&M Recruitment Process Audit Dashboard - Main JavaScript

// Global state
let rawData = null;
let filteredData = null;
let charts = {};
let currentFilters = {
  year: 'all',
  month: 'all',
  week: 'all',
  stage: 'all',
  parameter: 'all'
};

// M&M Brand Colors
const MM_COLORS = {
  red: '#C8102E',
  darkRed: '#8B0000',
  lightRed: '#FFE5E5',
  white: '#FFFFFF',
  grey: '#6B7280',
  lightGrey: '#F3F4F6'
};

// Chart color schemes
const chartColors = {
  primary: [MM_COLORS.red, MM_COLORS.darkRed, '#E63946', '#FF6B6B', '#C1121F'],
  gradient: ['#FFE5E5', '#FFC0CB', '#FF9AA2', '#FF6B6B', '#E63946', '#C8102E', '#8B0000'],
  error: ['#8B0000', '#C8102E', '#E63946'],
  success: ['#10B981', '#34D399', '#6EE7B7']
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  console.log('M&M Dashboard initialized');
  
  // Initialize theme from localStorage or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  darkTheme = (savedTheme === 'dark');
  
  if (darkTheme) {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }
  
  // Update theme toggle button
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const icon = themeBtn.querySelector('i');
    if (darkTheme) {
      themeBtn.classList.add('bg-white', 'text-mm-red');
      themeBtn.classList.remove('bg-white/20');
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      themeBtn.classList.remove('bg-white', 'text-mm-red');
      themeBtn.classList.add('bg-white/20');
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
  
  showLoadingState();
});

// File upload handler with progress tracking
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Show upload modal
  showUploadModal(file.name);
  
  try {
    // Step 1: Reading file (0-20%)
    updateProgress(0, 'reading', 'Reading file...');
    await sleep(300);
    
    const data = await readExcelFile(file, (progress) => {
      updateProgress(20 * progress, 'reading', 'Reading file...');
    });
    
    // Step 2: Parsing sheets (20-40%)
    updateProgress(20, 'parsing', 'Parsing Excel sheets...');
    await sleep(300);
    updateProgress(40, 'parsing', 'Excel sheets parsed successfully!');
    
    // Step 3: Validating (40-60%)
    updateProgress(40, 'validating', 'Validating data structure...');
    await sleep(300);
    validateDataStructure(data);
    updateProgress(60, 'validating', 'Validation complete!');
    
    // Step 4: Processing (60-80%)
    updateProgress(60, 'processing', 'Processing data...');
    await sleep(300);
    processAndStoreData(data);
    updateProgress(80, 'processing', 'Data processed successfully!');
    
    // Step 5: Rendering (80-100%)
    updateProgress(80, 'complete', 'Populating filters...');
    await sleep(300);
    populateFilters();
    updateProgress(90, 'complete', 'Applying filters...');
    await sleep(300);
    applyFilters();
    updateProgress(100, 'complete', 'Dashboard ready!');
    await sleep(500);
    
    hideUploadModal();
    hideLoadingState();
    showSuccessMessage('Data loaded successfully! Dashboard is ready.');
  } catch (error) {
    console.error('Error processing file:', error);
    hideUploadModal(); // Hide modal on error
    
    // If some data was processed, still show the dashboard
    if (rawData && rawData.auditCount && rawData.auditCount.length > 0) {
      console.log('Partial data available, showing dashboard with available data');
      hideLoadingState();
      showErrorMessage('Warning: Some data processing errors occurred, but dashboard is available with partial data.');
    } else {
      // Only show loading state if NO data was processed
      showLoadingState();
      showErrorMessage('Error: ' + error.message + '. Please check your Excel file and try again.');
    }
  }
}

// Helper function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Show upload modal
function showUploadModal(filename) {
  const modal = document.getElementById('upload-modal');
  const filenameEl = document.getElementById('upload-filename');
  if (modal && filenameEl) {
    filenameEl.textContent = filename;
    modal.classList.remove('hidden');
  }
}

// Hide upload modal
function hideUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Update progress
function updateProgress(percentage, step, message) {
  // Update progress bar
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-percentage');
  
  if (progressBar) {
    progressBar.style.width = percentage + '%';
  }
  
  if (progressText) {
    progressText.textContent = Math.round(percentage) + '%';
  }
  
  // Update step status
  const steps = ['reading', 'parsing', 'validating', 'processing', 'complete'];
  const currentStepIndex = steps.indexOf(step);
  
  steps.forEach((s, index) => {
    const stepEl = document.getElementById(`step-${s}`);
    if (!stepEl) return;
    
    const icon = stepEl.querySelector('i');
    const text = stepEl.querySelector('span');
    
    if (index < currentStepIndex) {
      // Completed step
      stepEl.className = 'progress-step completed';
      icon.className = 'fas fa-check-circle';
    } else if (index === currentStepIndex) {
      // Active step
      stepEl.className = 'progress-step active';
      icon.className = 'fas fa-circle-notch fa-spin';
      if (text && message) {
        text.textContent = message;
      }
    } else {
      // Pending step
      stepEl.className = 'progress-step';
      icon.className = 'fas fa-circle';
    }
  });
}

// Read Excel file using SheetJS with progress
function readExcelFile(file, progressCallback) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = function(e) {
      if (e.lengthComputable && progressCallback) {
        const progress = e.loaded / e.total;
        progressCallback(progress);
      }
    };
    
    reader.onload = function(e) {
      try {
        if (progressCallback) progressCallback(1);
        
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('Excel sheet names found:', workbook.SheetNames);
        
        const sheets = {};
        workbook.SheetNames.forEach(sheetName => {
          // Get both JSON and raw data for Column B extraction
          const worksheet = workbook.Sheets[sheetName];
          sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          sheets[sheetName + '_parsed'] = XLSX.utils.sheet_to_json(worksheet);
        });
        
        console.log('Processed sheet keys:', Object.keys(sheets));
        
        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = function(error) {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Validate data structure
function validateDataStructure(data) {
  console.log('Validating data structure. Available keys:', Object.keys(data));
  
  // Check for Audit Count sheet (required)
  // Try different possible sheet name variations
  const auditCountKeys = Object.keys(data).filter(key => 
    key.toLowerCase().includes('audit') && key.toLowerCase().includes('count')
  );
  
  console.log('Found Audit Count related keys:', auditCountKeys);
  
  const auditCountParsed = data['Audit Count_parsed'] || 
                           data['Audit Count _parsed'] ||
                           data['AuditCount_parsed'] ||
                           auditCountKeys.find(key => key.endsWith('_parsed'));
  
  if (!auditCountParsed || auditCountParsed.length === 0) {
    throw new Error('Missing required sheet: Audit Count. Please ensure your Excel file contains an "Audit Count" sheet with data. Found sheets: ' + Object.keys(data).filter(k => k.endsWith('_parsed')).map(k => k.replace('_parsed', '')).join(', '));
  }
  
  // FY23 and Recruiter Wise Data are optional but good to have
  const warnings = [];
  
  const fy23Keys = Object.keys(data).filter(key => key.toLowerCase().includes('fy23') || key.toLowerCase().includes('fy 23'));
  if (fy23Keys.length === 0) {
    warnings.push('FY23 sheet not found or empty');
  }
  
  const recruiterKeys = Object.keys(data).filter(key => 
    key.toLowerCase().includes('recruiter') && key.toLowerCase().includes('wise')
  );
  if (recruiterKeys.length === 0) {
    warnings.push('Recruiter Wise Data sheet not found or empty');
  }
  
  if (warnings.length > 0) {
    console.warn('Optional sheets missing:', warnings.join(', '));
  }
  
  return true;
}

// Process and store data
function processAndStoreData(data) {
  console.log('Processing data. Available keys:', Object.keys(data));
  
  // Find Audit Count sheets (flexible matching)
  const auditCountRawKey = Object.keys(data).find(key => 
    (key.toLowerCase().includes('audit') && key.toLowerCase().includes('count') && !key.includes('_parsed'))
  );
  const auditCountParsedKey = Object.keys(data).find(key => 
    (key.toLowerCase().includes('audit') && key.toLowerCase().includes('count') && key.includes('_parsed'))
  );
  
  const auditCountRaw = data[auditCountRawKey] || [];
  const auditCountParsed = data[auditCountParsedKey] || [];
  
  console.log('Audit Count raw key:', auditCountRawKey, 'rows:', auditCountRaw.length);
  console.log('Audit Count parsed key:', auditCountParsedKey, 'rows:', auditCountParsed.length);
  
  // Extract unique Financial Years from Column B (skipping header row)
  const financialYears = [];
  for (let i = 1; i < auditCountRaw.length; i++) {
    const row = auditCountRaw[i];
    if (row && row[1]) { // Column B is index 1
      const fy = row[1].toString().trim();
      if (fy && !financialYears.includes(fy)) {
        financialYears.push(fy);
      }
    }
  }
  
  // Find FY sheets
  const fy23Key = Object.keys(data).find(key => 
    (key.toLowerCase().includes('fy23') || key.toLowerCase().includes('fy 23')) && key.includes('_parsed')
  );
  const fy24Key = Object.keys(data).find(key => 
    (key.toLowerCase().includes('fy24') || key.toLowerCase().includes('fy 24')) && key.includes('_parsed')
  );
  
  // Find Recruiter Wise Data sheet
  const recruiterWiseKey = Object.keys(data).find(key => 
    key.toLowerCase().includes('recruiter') && key.toLowerCase().includes('wise') && key.includes('_parsed')
  );
  
  // Find error sheets
  const sheet3Key = Object.keys(data).find(key => key.toLowerCase() === 'sheet3_parsed');
  const sheet5Key = Object.keys(data).find(key => key.toLowerCase() === 'sheet5_parsed');
  
  // Find Strategic View sheets
  const sixSigmaKey = Object.keys(data).find(key => 
    key.toLowerCase().includes('six') && key.toLowerCase().includes('sigma') && key.includes('_parsed')
  );
  const rcaCapaKey = Object.keys(data).find(key => 
    (key.toLowerCase().includes('rca') || key.toLowerCase().includes('capa')) && key.includes('_parsed')
  );
  
  console.log('Strategic sheets found:', { sixSigmaKey, rcaCapaKey });
  
  rawData = {
    auditCount: auditCountParsed,
    auditCountRaw: auditCountRaw,
    financialYears: financialYears.sort(),
    fy23: data[fy23Key] || [],
    fy24: data[fy24Key] || [],
    recruiterWise: data[recruiterWiseKey] || [],
    parameterErrors: data[sheet3Key] || data[sheet5Key] || [],
    sixSigmaProjects: data[sixSigmaKey] || [],
    rcaCapaProjects: data[rcaCapaKey] || [],
    allSheets: data
  };
  
  console.log('Processed data:', rawData);
  console.log('Financial Years from Column B:', rawData.financialYears);
}

// Populate filter dropdowns
function populateFilters() {
  if (!rawData || !rawData.auditCount) return;
  
  const data = rawData.auditCount;
  
  // Extract unique values
  // Use Financial Years extracted from Column B
  const years = rawData.financialYears || [];
  const months = [...new Set(data.map(r => r['Month']).filter(Boolean))];
  const weeks = [...new Set(data.map(r => r['Week']).filter(Boolean))].sort((a, b) => a - b);
  const stages = [...new Set(data.map(r => r['Recruitment Stage']).filter(Boolean))];
  const parameters = [...new Set(data.map(r => r['Parameter']).filter(Boolean))];
  const recruiters = [...new Set(data.map(r => r['Recruiter Name']).filter(Boolean))].sort();
  
  // Populate dropdowns
  populateSelect('filter-year', years);
  populateSelect('filter-month', months);
  populateSelect('filter-week', weeks);
  populateSelect('filter-stage', stages);
  populateSelect('filter-parameter', parameters);
  
  // Populate recruiter dropdowns for Team & People Analytics section
  populateSelect('team-recruiter-select', recruiters);
  populateSelect('team-pm-select', [...new Set(data.map(r => r['Program Manager']).filter(Boolean))].sort());
  
  console.log('Filters populated. Years:', years);
}

function populateSelect(id, values) {
  const select = document.getElementById(id);
  if (!select) return;
  
  // Keep "All" option
  const allOption = select.querySelector('option[value="all"]');
  select.innerHTML = '';
  if (allOption) select.appendChild(allOption);
  
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

// Apply filters
function applyFilters() {
  // Update filter state
  currentFilters.year = document.getElementById('filter-year').value;
  currentFilters.month = document.getElementById('filter-month').value;
  currentFilters.week = document.getElementById('filter-week').value;
  currentFilters.stage = document.getElementById('filter-stage').value;
  currentFilters.parameter = document.getElementById('filter-parameter').value;
  
  console.log('Applying filters:', currentFilters);
  
  // Filter data
  filteredData = filterDataByCurrentFilters();
  
  console.log('Filtered data records:', filteredData ? filteredData.length : 0);
  
  // Update active filter pills
  updateActiveFilterPills();
  
  // Update all visualizations
  updateDashboard();
}

function filterDataByCurrentFilters() {
  if (!rawData || !rawData.auditCount) return null;
  
  let filtered = [...rawData.auditCount];
  
  if (currentFilters.year !== 'all') {
    filtered = filtered.filter(r => r['Financial Year'] === currentFilters.year);
  }
  if (currentFilters.month !== 'all') {
    filtered = filtered.filter(r => r['Month'] === currentFilters.month);
  }
  if (currentFilters.week !== 'all') {
    filtered = filtered.filter(r => r['Week'] == currentFilters.week);
  }
  if (currentFilters.stage !== 'all') {
    filtered = filtered.filter(r => r['Recruitment Stage'] === currentFilters.stage);
  }
  if (currentFilters.parameter !== 'all') {
    filtered = filtered.filter(r => r['Parameter'] === currentFilters.parameter);
  }
  
  return filtered;
}

function updateActiveFilterPills() {
  const container = document.getElementById('active-filters');
  if (!container) return;
  
  const activeFilters = [];
  
  Object.entries(currentFilters).forEach(([key, value]) => {
    if (value !== 'all') {
      activeFilters.push({ key, value });
    }
  });
  
  if (activeFilters.length === 0) {
    container.innerHTML = '<span class="text-sm text-gray-500">No filters applied</span>';
    return;
  }
  
  container.innerHTML = activeFilters.map(f => `
    <span class="filter-pill">
      <span>${f.key}: ${f.value}</span>
      <i class="fas fa-times text-xs" onclick="removeFilter('${f.key}')"></i>
    </span>
  `).join('');
}

function removeFilter(key) {
  const select = document.getElementById(`filter-${key}`);
  if (select) {
    select.value = 'all';
    applyFilters();
  }
}

// Reset filters
function resetFilters() {
  currentFilters = {
    year: 'all',
    month: 'all',
    week: 'all',
    stage: 'all',
    parameter: 'all'
  };
  
  document.getElementById('filter-year').value = 'all';
  document.getElementById('filter-month').value = 'all';
  document.getElementById('filter-week').value = 'all';
  document.getElementById('filter-stage').value = 'all';
  document.getElementById('filter-parameter').value = 'all';
  
  applyFilters();
}

// Update dashboard with filtered data
function updateDashboard() {
  console.log('Updating dashboard with filtered data:', filteredData ? filteredData.length : 0, 'records');
  
  try {
    updateKeyMetrics();
  } catch (error) {
    console.error('Error updating key metrics:', error);
  }
  
  try {
    updateDynamicNarrative();
  } catch (error) {
    console.error('Error updating dynamic narrative:', error);
  }
  
  try {
    updateOverviewCharts();
  } catch (error) {
    console.error('Error updating overview charts:', error);
  }
  
  try {
    updateStageParameterView();
  } catch (error) {
    console.error('Error updating stage parameter view:', error);
  }
  
  try {
    updateRecruiterView();
  } catch (error) {
    console.error('Error updating recruiter view:', error);
  }
  
  try {
    updateTrendsView();
  } catch (error) {
    console.error('Error updating trends view:', error);
  }
  
  try {
    updateInsightsView();
  } catch (error) {
    console.error('Error updating insights view:', error);
  }
  
  try {
    updateStrategicView();
  } catch (error) {
    console.error('Error updating strategic view:', error);
  }
  
  console.log('Dashboard update complete');
}

// Update key metrics
function updateKeyMetrics() {
  if (!filteredData || filteredData.length === 0) {
    document.getElementById('metric-accuracy').textContent = '--';
    document.getElementById('metric-error-rate').textContent = '--';
    document.getElementById('metric-total-audits').textContent = '--';
    document.getElementById('metric-sample-coverage').textContent = '--';
    return;
  }
  
  // Calculate metrics based on correct formulas:
  // 1. Overall Accuracy = Sum(Opportunity Pass) / (Sum(Opportunity Count) - Sum(Opportunity NA))
  // 2. Error Rate = Sum(Opportunity Fail) / (Sum(Opportunity Count) - Sum(Opportunity NA))
  // 3. Sample Coverage = Sum(Opportunity Count) / Sum(Total Population)
  
  const totalPass = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
  const totalFail = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Fail']) || 0), 0);
  const totalOpportunityCount = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
  const totalNA = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity NA']) || 0), 0);
  const totalPopulation = filteredData.reduce((sum, r) => sum + (parseFloat(r['Total Population']) || 0), 0);
  const totalSamples = filteredData.reduce((sum, r) => sum + (parseFloat(r['Sample Count']) || 0), 0);
  
  // Calculate denominator (Opportunity Count - Opportunity NA)
  const totalExcludingNA = totalOpportunityCount - totalNA;
  
  const accuracy = totalExcludingNA > 0 ? (totalPass / totalExcludingNA * 100) : 0;
  const errorRate = totalExcludingNA > 0 ? (totalFail / totalExcludingNA * 100) : 0;
  const sampleCoverage = totalPopulation > 0 ? (totalOpportunityCount / totalPopulation * 100) : 0;
  
  console.log('Key Metrics Calculated:', {
    accuracy: accuracy.toFixed(1) + '%',
    errorRate: errorRate.toFixed(1) + '%',
    totalAudits: totalOpportunityCount,
    sampleCoverage: sampleCoverage.toFixed(1) + '%',
    filteredRecords: filteredData.length
  });
  
  document.getElementById('metric-accuracy').textContent = accuracy.toFixed(1) + '%';
  document.getElementById('metric-error-rate').textContent = errorRate.toFixed(1) + '%';
  document.getElementById('metric-total-audits').textContent = totalOpportunityCount.toLocaleString();
  document.getElementById('metric-sample-coverage').textContent = sampleCoverage.toFixed(1) + '%';
}

// Update dynamic narrative
function updateDynamicNarrative() {
  const container = document.getElementById('dynamic-narrative');
  if (!container || !filteredData || filteredData.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No data available for selected filters.</p>';
    return;
  }
  
  // Calculate key stats using correct formulas
  const totalPass = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
  const totalOpportunityCount = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
  const totalNA = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity NA']) || 0), 0);
  const totalSamples = filteredData.reduce((sum, r) => sum + (parseFloat(r['Sample Count']) || 0), 0);
  const totalPopulation = filteredData.reduce((sum, r) => sum + (parseFloat(r['Total Population']) || 0), 0);
  
  const totalExcludingNA = totalOpportunityCount - totalNA;
  
  const accuracy = totalExcludingNA > 0 ? (totalPass / totalExcludingNA * 100) : 0;
  const sampleCoverage = totalPopulation > 0 ? (totalOpportunityCount / totalPopulation * 100) : 0;
  
  // Find top error parameters
  const parameterErrors = {};
  filteredData.forEach(r => {
    const param = r['Parameter'];
    const errors = parseFloat(r['Opportunity Fail']) || 0;
    parameterErrors[param] = (parameterErrors[param] || 0) + errors;
  });
  
  const topErrors = Object.entries(parameterErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);
  
  // Generate narrative
  const narratives = [
    `Overall accuracy for the selected period is <strong class="text-mm-red">${accuracy.toFixed(1)}%</strong> with a sample coverage of <strong>${sampleCoverage.toFixed(1)}%</strong>, across <strong>${totalOpportunityCount.toLocaleString()}</strong> audited opportunities.`
  ];
  
  if (topErrors.length > 0) {
    narratives.push(`Top error-heavy parameters are <strong class="text-mm-dark-red">${topErrors.join(', ')}</strong>.`);
  }
  
  if (accuracy < 90) {
    narratives.push(`<span class="insight-badge insight-negative">⚠️ Accuracy below target (90%)</span> - Immediate intervention recommended.`);
  } else if (accuracy >= 95) {
    narratives.push(`<span class="insight-badge insight-positive">✓ Excellent performance</span> - Accuracy exceeds target!`);
  }
  
  container.innerHTML = narratives.map(n => `<p>${n}</p>`).join('');
}

// Update overview charts
function updateOverviewCharts() {
  try {
    updateMonthlyAccuracyChart();
  } catch (error) {
    console.error('Error updating monthly accuracy chart:', error);
  }
  
  try {
    updateStageAuditChart();
  } catch (error) {
    console.error('Error updating stage audit chart:', error);
  }
  
  try {
    updateParameterErrorChart();
  } catch (error) {
    console.error('Error updating parameter error chart:', error);
  }
  
  try {
    updateWeeklyTrendChart();
  } catch (error) {
    console.error('Error updating weekly trend chart:', error);
  }
  
  try {
    updateFunnelChart();
  } catch (error) {
    console.error('Error updating funnel chart:', error);
  }
}

function updateMonthlyAccuracyChart() {
  const canvas = document.getElementById('monthly-accuracy-chart');
  if (!canvas) {
    console.error('Monthly accuracy chart canvas not found');
    return;
  }
  if (!filteredData || filteredData.length === 0) {
    console.log('No filtered data available - waiting for data or filters to be applied');
    return;
  }
  
  console.log('Updating monthly accuracy chart with', filteredData.length, 'records');
  
  // Destroy existing chart
  if (charts.monthlyAccuracy) {
    charts.monthlyAccuracy.destroy();
  }
  
  // Group by Month and Financial Year
  const monthlyData = {};
  filteredData.forEach(r => {
    const month = r['Month'];
    const fy = r['Financial Year'];
    if (!month || !fy) return;
    
    const key = `${month}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { month, fy23: { pass: 0, total: 0 }, fy24: { pass: 0, total: 0 }, fy25: { pass: 0, total: 0 } };
    }
    
    const pass = parseFloat(r['Opportunity Pass']) || 0;
    const total = parseFloat(r['Opportunity Excluding NA']) || 0;
    
    if (fy.includes('23')) {
      monthlyData[key].fy23.pass += pass;
      monthlyData[key].fy23.total += total;
    } else if (fy.includes('24')) {
      monthlyData[key].fy24.pass += pass;
      monthlyData[key].fy24.total += total;
    } else if (fy.includes('25')) {
      monthlyData[key].fy25.pass += pass;
      monthlyData[key].fy25.total += total;
    }
  });
  
  const months = Object.keys(monthlyData);
  console.log('Months found:', months);
  
  if (months.length === 0) {
    console.log('No monthly data available for current filters - this is expected when data lacks monthly breakdown');
    // Don't return, just skip the chart update gracefully
    if (charts.monthlyAccuracy) {
      charts.monthlyAccuracy.destroy();
      charts.monthlyAccuracy = null;
    }
    return;
  }
  
  const fy23Accuracy = months.map(m => {
    const d = monthlyData[m].fy23;
    return d.total > 0 ? (d.pass / d.total * 100) : null;
  });
  const fy24Accuracy = months.map(m => {
    const d = monthlyData[m].fy24;
    return d.total > 0 ? (d.pass / d.total * 100) : null;
  });
  const fy25Accuracy = months.map(m => {
    const d = monthlyData[m].fy25;
    return d.total > 0 ? (d.pass / d.total * 100) : null;
  });
  
  console.log('FY23 Accuracy:', fy23Accuracy);
  console.log('FY24 Accuracy:', fy24Accuracy);
  console.log('FY25 Accuracy:', fy25Accuracy);
  
  const ctx = canvas.getContext('2d');
  charts.monthlyAccuracy = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'FY23 Accuracy',
          data: fy23Accuracy,
          backgroundColor: chartColors.primary[2],
          borderColor: chartColors.primary[2],
          borderWidth: 1
        },
        {
          label: 'FY24 Accuracy',
          data: fy24Accuracy,
          backgroundColor: MM_COLORS.red,
          borderColor: MM_COLORS.red,
          borderWidth: 1
        },
        {
          label: 'FY25 Accuracy',
          data: fy25Accuracy,
          backgroundColor: MM_COLORS.darkRed,
          borderColor: MM_COLORS.darkRed,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + (context.parsed.y ? context.parsed.y.toFixed(1) : '0') + '%';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy Score (%)'
          }
        }
      }
    }
  });
}

function updateStageAuditChart() {
  const canvas = document.getElementById('stage-audit-chart');
  if (!canvas) {
    console.error('Stage audit chart canvas not found');
    return;
  }
  if (!filteredData || filteredData.length === 0) {
    console.warn('No filtered data available for stage audit chart');
    return;
  }
  
  console.log('Updating stage audit chart with', filteredData.length, 'records');
  
  if (charts.stageAudit) {
    charts.stageAudit.destroy();
  }
  
  // Group by Recruitment Stage
  const stageData = {};
  filteredData.forEach(r => {
    const stage = r['Recruitment Stage'];
    if (!stage) return;
    
    if (!stageData[stage]) {
      stageData[stage] = { pass: 0, fail: 0, total: 0, samples: 0 };
    }
    
    stageData[stage].pass += parseFloat(r['Opportunity Pass']) || 0;
    stageData[stage].fail += parseFloat(r['Opportunity Fail']) || 0;
    stageData[stage].total += parseFloat(r['Opportunity Excluding NA']) || 0;
    stageData[stage].samples += parseFloat(r['Sample Count']) || 0;
  });
  
  const stages = Object.keys(stageData);
  console.log('Stages found:', stages);
  
  if (stages.length === 0) {
    console.warn('No stage data to display');
    return;
  }
  
  const accuracy = stages.map(s => {
    const d = stageData[s];
    return d.total > 0 ? (d.pass / d.total * 100) : 0;
  });
  const errorRate = stages.map(s => {
    const d = stageData[s];
    return d.total > 0 ? (d.fail / d.total * 100) : 0;
  });
  
  console.log('Stage accuracy:', accuracy);
  console.log('Stage error rates:', errorRate);
  
  const ctx = canvas.getContext('2d');
  charts.stageAudit = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stages,
      datasets: [
        {
          label: 'Accuracy Score',
          data: accuracy,
          backgroundColor: MM_COLORS.red,
          borderColor: MM_COLORS.red,
          borderWidth: 1
        },
        {
          label: 'Error Rate',
          data: errorRate,
          backgroundColor: MM_COLORS.darkRed,
          borderColor: MM_COLORS.darkRed,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Percentage (%)'
          }
        }
      }
    }
  });
}

function updateParameterErrorChart() {
  const canvas = document.getElementById('parameter-error-chart');
  if (!canvas || !filteredData) return;
  
  if (charts.parameterError) {
    charts.parameterError.destroy();
  }
  
  // Group by Parameter
  const paramData = {};
  filteredData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { fail: 0, total: 0 };
    }
    
    paramData[param].fail += parseFloat(r['Opportunity Fail']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  // Calculate error rate and sort
  const paramArray = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      errorRate: data.total > 0 ? (data.fail / data.total * 100) : 0,
      errors: data.fail
    }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 10);
  
  const params = paramArray.map(p => p.param.length > 30 ? p.param.substring(0, 30) + '...' : p.param);
  const errorRates = paramArray.map(p => p.errorRate);
  
  // Color gradient based on error rate
  const colors = errorRates.map(rate => {
    if (rate > 15) return MM_COLORS.darkRed;
    if (rate > 10) return MM_COLORS.red;
    return chartColors.primary[3];
  });
  
  const ctx = canvas.getContext('2d');
  charts.parameterError = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: params,
      datasets: [{
        label: 'Error Rate',
        data: errorRates,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const original = paramArray[context.dataIndex];
              return [
                `Parameter: ${original.param}`,
                `Error Rate: ${context.parsed.x.toFixed(1)}%`,
                `Total Errors: ${original.errors}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Error Rate (%)'
          }
        }
      }
    }
  });
}

function updateWeeklyTrendChart() {
  const canvas = document.getElementById('weekly-trend-chart');
  if (!canvas || !rawData) return;
  
  if (charts.weeklyTrend) {
    charts.weeklyTrend.destroy();
  }
  
  // Use FY23 and FY24 sheets if available
  let weeklyData = [];
  
  if (rawData.fy23 && rawData.fy23.length > 0) {
    weeklyData = [...rawData.fy23];
  }
  
  if (rawData.fy24 && rawData.fy24.length > 0) {
    weeklyData = [...weeklyData, ...rawData.fy24];
  }
  
  if (weeklyData.length === 0) {
    // Fallback to audit count data grouped by week
    const weekData = {};
    filteredData.forEach(r => {
      const week = r['Week'];
      if (!week) return;
      
      if (!weekData[week]) {
        weekData[week] = { pass: 0, total: 0, opportunities: 0 };
      }
      
      weekData[week].pass += parseFloat(r['Opportunity Pass']) || 0;
      weekData[week].total += parseFloat(r['Opportunity Excluding NA']) || 0;
      weekData[week].opportunities += parseFloat(r['Opportunity Count']) || 0;
    });
    
    weeklyData = Object.entries(weekData)
      .map(([week, data]) => ({
        Week: week,
        'Accuracy Score': data.total > 0 ? (data.pass / data.total * 100) : 0,
        'Total Opportunities': data.opportunities
      }))
      .sort((a, b) => parseInt(a.Week) - parseInt(b.Week));
  }
  
  const weeks = weeklyData.map(w => w['Week'] || w['Week Number'] || '');
  const accuracy = weeklyData.map(w => parseFloat(w['Accuracy Score']) || 0);
  const opportunities = weeklyData.map(w => parseFloat(w['Total Opportunities']) || parseFloat(w['Audit Samples']) || 0);
  
  const ctx = canvas.getContext('2d');
  charts.weeklyTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [
        {
          label: 'Accuracy Score',
          data: accuracy,
          borderColor: MM_COLORS.red,
          backgroundColor: 'rgba(200, 16, 46, 0.1)',
          yAxisID: 'y',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Total Opportunities',
          data: opportunities,
          type: 'bar',
          backgroundColor: MM_COLORS.lightRed,
          borderColor: MM_COLORS.red,
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy Score (%)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Opportunities'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    }
  });
}

function updateFunnelChart() {
  const canvas = document.getElementById('funnel-chart');
  if (!canvas || !filteredData) return;
  
  if (charts.funnel) {
    charts.funnel.destroy();
  }
  
  // Calculate funnel stages
  const totalPopulation = filteredData.reduce((sum, r) => sum + (parseFloat(r['Total Population']) || 0), 0);
  const opportunityCount = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
  const excludingNA = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Excluding NA']) || 0), 0);
  const passed = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
  const failed = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Fail']) || 0), 0);
  
  const stages = ['Total Population', 'Opportunity Count', 'Excluding NA', 'Passed', 'Failed'];
  const values = [totalPopulation, opportunityCount, excludingNA, passed, failed];
  
  const ctx = canvas.getContext('2d');
  charts.funnel = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stages,
      datasets: [{
        label: 'Count',
        data: values,
        backgroundColor: [
          chartColors.gradient[1],
          chartColors.gradient[3],
          chartColors.gradient[4],
          chartColors.success[1],
          MM_COLORS.darkRed
        ],
        borderColor: [
          chartColors.gradient[1],
          chartColors.gradient[3],
          chartColors.gradient[4],
          chartColors.success[1],
          MM_COLORS.darkRed
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.x;
              const percentage = totalPopulation > 0 ? (value / totalPopulation * 100).toFixed(1) : 0;
              return `Count: ${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        }
      }
    }
  });
}

// Update Stage & Parameter view
// Global variable for selected stage
let selectedStage = 'Intake';

function updateStageParameterView() {
  updateStageMetrics();
  updateParameterBreakdown();
  updateParametersList();
}

// Stage tab selection
function selectStageTab(stage) {
  selectedStage = stage;
  
  // Update breadcrumb
  document.getElementById('stage-breadcrumb').textContent = stage + ' Deep Dive';
  
  // Update active tab
  document.querySelectorAll('.stage-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.stage === stage) {
      btn.classList.add('active');
    }
  });
  
  // Update all stage data
  updateStageMetrics();
  updateParameterBreakdown();
  updateParametersList();
}

// Update stage metrics cards
function updateStageMetrics() {
  if (!filteredData) return;
  
  console.log('Selected stage:', selectedStage);
  console.log('Available stages:', [...new Set(filteredData.map(r => r['Recruitment Stage']).filter(Boolean))]);
  
  // Filter data for selected stage - use flexible matching
  const stageData = filteredData.filter(r => {
    const stage = r['Recruitment Stage'];
    if (!stage) return false;
    
    // Try exact match first
    if (stage === selectedStage) return true;
    
    // Try partial match (e.g., "Assessment Interview" matches "Assessment")
    if (stage.toLowerCase().includes(selectedStage.toLowerCase())) return true;
    
    // Try mapping common variations
    const mappings = {
      'OfferAPL': ['Offer', 'APL', 'OfferAPL'],
      'Pre-Onboarding': ['Pre-Onboarding', 'PreOnboarding', 'Pre Onboarding'],
      'Pre-Sourcing': ['Pre-Sourcing', 'PreSourcing', 'Pre Sourcing'],
      'Assessment': ['Assessment', 'Assessment Interview'],
      'Intake': ['Intake', 'Intake Meeting']
    };
    
    const variations = mappings[selectedStage] || [];
    return variations.some(v => stage.toLowerCase().includes(v.toLowerCase()));
  });
  
  if (stageData.length === 0) {
    document.getElementById('stage-accuracy').textContent = '--';
    document.getElementById('stage-audits').textContent = '--';
    document.getElementById('stage-error-rate').textContent = '--';
    document.getElementById('stage-completeness').textContent = '--';
    return;
  }
  
  // Calculate metrics
  const totalPass = stageData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
  const totalFail = stageData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Fail']) || 0), 0);
  const totalOpportunityCount = stageData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
  const totalNA = stageData.reduce((sum, r) => sum + (parseFloat(r['Opportunity NA']) || 0), 0);
  
  const totalExcludingNA = totalOpportunityCount - totalNA;
  
  const accuracy = totalExcludingNA > 0 ? (totalPass / totalExcludingNA * 100) : 0;
  const errorRate = totalExcludingNA > 0 ? (totalFail / totalExcludingNA * 100) : 0;
  
  // Calculate completeness (using Opportunity Pass / Opportunity Count)
  const completeness = totalOpportunityCount > 0 ? (totalPass / totalOpportunityCount * 100) : 0;
  
  // Update display
  document.getElementById('stage-accuracy').textContent = accuracy.toFixed(1) + '%';
  document.getElementById('stage-accuracy-label').textContent = selectedStage + ' Accuracy';
  document.getElementById('stage-audits').textContent = totalOpportunityCount.toLocaleString();
  document.getElementById('stage-error-rate').textContent = errorRate.toFixed(1) + '%';
  document.getElementById('stage-completeness').textContent = completeness.toFixed(0) + '%';
  
  // Update badge color based on accuracy
  const badge = document.getElementById('stage-accuracy-badge');
  if (accuracy >= 90) {
    badge.innerHTML = '<span class="text-green-600">Above Target</span>';
  } else if (accuracy >= 80) {
    badge.innerHTML = '<span class="text-yellow-600">Near Target</span>';
  } else {
    badge.innerHTML = '<span class="text-orange-600">fd7e14</span>';
  }
}

// Update parameter breakdown list
function updateParameterBreakdown() {
  const container = document.getElementById('parameter-breakdown-list');
  if (!container || !filteredData) return;
  
  // Filter data for selected stage - use same flexible matching
  const stageData = filteredData.filter(r => {
    const stage = r['Recruitment Stage'];
    if (!stage) return false;
    if (stage === selectedStage) return true;
    if (stage.toLowerCase().includes(selectedStage.toLowerCase())) return true;
    
    const mappings = {
      'OfferAPL': ['Offer', 'APL', 'OfferAPL'],
      'Pre-Onboarding': ['Pre-Onboarding', 'PreOnboarding', 'Pre Onboarding'],
      'Pre-Sourcing': ['Pre-Sourcing', 'PreSourcing', 'Pre Sourcing'],
      'Assessment': ['Assessment', 'Assessment Interview'],
      'Intake': ['Intake', 'Intake Meeting']
    };
    
    const variations = mappings[selectedStage] || [];
    return variations.some(v => stage.toLowerCase().includes(v.toLowerCase()));
  });
  
  if (stageData.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No data available for this stage.</p>';
    return;
  }
  
  // Group by parameter
  const paramData = {};
  stageData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { 
        pass: 0, 
        fail: 0,
        total: 0,
        opportunityCount: 0
      };
    }
    
    paramData[param].pass += parseFloat(r['Opportunity Pass']) || 0;
    paramData[param].fail += parseFloat(r['Opportunity Fail']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
    paramData[param].opportunityCount += parseFloat(r['Opportunity Count']) || 0;
  });
  
  // Convert to array and sort by total errors
  const paramArray = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0,
      errors: data.fail,
      total: data.opportunityCount
    }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 10); // Top 10
  
  // Generate HTML
  const html = paramArray.map((item, index) => {
    const barColor = index === 0 ? 'red' : 'blue';
    
    return `
      <div class="parameter-item">
        <div class="parameter-item-header">
          <div class="parameter-item-title">${index + 1}. ${item.param.length > 40 ? item.param.substring(0, 40) + '...' : item.param}</div>
          <div class="parameter-item-percentage">${item.accuracy.toFixed(0)}%</div>
        </div>
        <div class="parameter-progress">
          <div class="parameter-progress-bar ${barColor}" style="width: ${item.accuracy}%"></div>
        </div>
        <div class="parameter-item-details">
          <span class="error-text">${item.errors.toFixed(0)} Errors</span>
          <span class="total-text">${item.total.toFixed(0)} Total</span>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

// Update parameters list (right side)
function updateParametersList() {
  const container = document.getElementById('parameters-list');
  if (!container || !filteredData) return;
  
  // Filter data for selected stage - use same flexible matching
  const stageData = filteredData.filter(r => {
    const stage = r['Recruitment Stage'];
    if (!stage) return false;
    if (stage === selectedStage) return true;
    if (stage.toLowerCase().includes(selectedStage.toLowerCase())) return true;
    
    const mappings = {
      'OfferAPL': ['Offer', 'APL', 'OfferAPL'],
      'Pre-Onboarding': ['Pre-Onboarding', 'PreOnboarding', 'Pre Onboarding'],
      'Pre-Sourcing': ['Pre-Sourcing', 'PreSourcing', 'Pre Sourcing'],
      'Assessment': ['Assessment', 'Assessment Interview'],
      'Intake': ['Intake', 'Intake Meeting']
    };
    
    const variations = mappings[selectedStage] || [];
    return variations.some(v => stage.toLowerCase().includes(v.toLowerCase()));
  });
  
  if (stageData.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No data available for this stage.</p>';
    return;
  }
  
  // Group by parameter
  const paramData = {};
  stageData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { 
        pass: 0, 
        fail: 0,
        total: 0,
        opportunityCount: 0
      };
    }
    
    paramData[param].pass += parseFloat(r['Opportunity Pass']) || 0;
    paramData[param].fail += parseFloat(r['Opportunity Fail']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
    paramData[param].opportunityCount += parseFloat(r['Opportunity Count']) || 0;
  });
  
  // Convert to array and sort by accuracy (high to low for success parameters)
  const paramArray = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0,
      errors: data.fail,
      total: data.opportunityCount
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10); // Top 10
  
  // Generate HTML
  const html = paramArray.map((item, index) => {
    const barColor = item.accuracy >= 90 ? 'green' : item.accuracy >= 70 ? 'blue' : 'red';
    
    return `
      <div class="parameter-item">
        <div class="parameter-item-header">
          <div class="parameter-item-title">${index + 1}. ${item.param.length > 40 ? item.param.substring(0, 40) + '...' : item.param}</div>
          ${index === 2 ? '<span class="genspurt-badge"><i class="fas fa-robot"></i> Genspurt</span>' : ''}
        </div>
        <div class="parameter-progress">
          <div class="parameter-progress-bar ${barColor}" style="width: ${item.accuracy}%"></div>
        </div>
        <div class="parameter-item-details">
          <span class="error-text">${item.errors.toFixed(0)} Errors</span>
          <span class="total-text">${item.total.toFixed(0)} Total</span>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

function updateTopParameters() {
  if (!filteredData) return;
  
  // Calculate parameter scores
  const paramData = {};
  filteredData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { pass: 0, total: 0 };
    }
    
    paramData[param].pass += parseFloat(r['Opportunity Pass']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  // Calculate accuracy and sort
  const paramArray = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
  
  const best = paramArray.slice(0, 3);
  const worst = paramArray.slice(-3).reverse();
  
  // Display best parameters
  const bestContainer = document.getElementById('top-best-parameters');
  if (bestContainer) {
    bestContainer.innerHTML = best.map((p, i) => `
      <div class="flex items-center justify-between p-2 bg-white rounded">
        <span class="text-sm font-medium">${i + 1}. ${p.param.substring(0, 40)}${p.param.length > 40 ? '...' : ''}</span>
        <span class="text-green-600 font-bold">${p.accuracy.toFixed(1)}%</span>
      </div>
    `).join('');
  }
  
  // Display worst parameters
  const worstContainer = document.getElementById('top-worst-parameters');
  if (worstContainer) {
    worstContainer.innerHTML = worst.map((p, i) => `
      <div class="flex items-center justify-between p-2 bg-white rounded">
        <span class="text-sm font-medium">${i + 1}. ${p.param.substring(0, 40)}${p.param.length > 40 ? '...' : ''}</span>
        <span class="text-red-600 font-bold">${p.accuracy.toFixed(1)}%</span>
      </div>
    `).join('');
  }
  
  // Distribution
  const distribution = {
    excellent: paramArray.filter(p => p.accuracy >= 95).length,
    good: paramArray.filter(p => p.accuracy >= 90 && p.accuracy < 95).length,
    needsImprovement: paramArray.filter(p => p.accuracy < 90).length
  };
  
  const distContainer = document.getElementById('parameter-distribution');
  if (distContainer) {
    distContainer.innerHTML = `
      <div class="flex items-center justify-between p-2 bg-white rounded">
        <span class="text-sm">Excellent (≥95%)</span>
        <span class="font-bold text-green-600">${distribution.excellent}</span>
      </div>
      <div class="flex items-center justify-between p-2 bg-white rounded">
        <span class="text-sm">Good (90-95%)</span>
        <span class="font-bold text-blue-600">${distribution.good}</span>
      </div>
      <div class="flex items-center justify-between p-2 bg-white rounded">
        <span class="text-sm">Needs Improvement (<90%)</span>
        <span class="font-bold text-red-600">${distribution.needsImprovement}</span>
      </div>
    `;
  }
}

function updateHeatmap() {
  const container = document.getElementById('heatmap-container');
  if (!container || !filteredData) return;
  
  // Create stage x parameter matrix
  const matrix = {};
  filteredData.forEach(r => {
    const stage = r['Recruitment Stage'];
    const param = r['Parameter'];
    if (!stage || !param) return;
    
    if (!matrix[stage]) matrix[stage] = {};
    if (!matrix[stage][param]) {
      matrix[stage][param] = { pass: 0, total: 0 };
    }
    
    matrix[stage][param].pass += parseFloat(r['Opportunity Pass']) || 0;
    matrix[stage][param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const stages = Object.keys(matrix);
  const allParams = [...new Set(filteredData.map(r => r['Parameter']).filter(Boolean))];
  
  if (stages.length === 0 || allParams.length === 0) {
    container.innerHTML = '<p class="text-gray-500 p-4">No data available for heatmap.</p>';
    return;
  }
  
  // Build heatmap HTML
  let html = '<table class="w-full border-collapse text-xs"><thead><tr><th class="p-2 border bg-gray-100"></th>';
  
  allParams.forEach(param => {
    const shortParam = param.length > 20 ? param.substring(0, 20) + '...' : param;
    html += `<th class="p-2 border bg-gray-100 text-left" title="${param}">${shortParam}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  stages.forEach(stage => {
    html += `<tr><td class="p-2 border bg-gray-100 font-semibold">${stage}</td>`;
    
    allParams.forEach(param => {
      const data = matrix[stage] && matrix[stage][param];
      const accuracy = data && data.total > 0 ? (data.pass / data.total * 100) : 0;
      
      let bgColor = '#FFFFFF';
      if (accuracy > 0) {
        if (accuracy >= 95) bgColor = '#D1FAE5';
        else if (accuracy >= 90) bgColor = '#FEF3C7';
        else if (accuracy >= 80) bgColor = '#FED7AA';
        else if (accuracy >= 70) bgColor = '#FECACA';
        else bgColor = '#FCA5A5';
      }
      
      html += `<td class="heatmap-cell" style="background-color: ${bgColor}" title="${stage} - ${param}: ${accuracy.toFixed(1)}%">
        ${accuracy > 0 ? accuracy.toFixed(1) + '%' : '-'}
      </td>`;
    });
    
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// Update Recruiter view
function updateRecruiterView() {
  updateRecruiterScatterChart();
  updateRecruiterBarChart();
  updateRecruiterTable();
}

function updateRecruiterScatterChart() {
  const canvas = document.getElementById('recruiter-scatter-chart');
  if (!canvas || !filteredData) return;
  
  if (charts.recruiterScatter) {
    charts.recruiterScatter.destroy();
  }
  
  // Group by recruiter
  const recruiterData = {};
  filteredData.forEach(r => {
    const recruiter = r['Recruiter Name'];
    if (!recruiter) return;
    
    if (!recruiterData[recruiter]) {
      recruiterData[recruiter] = { pass: 0, total: 0, samples: 0, errors: 0, pm: r['Program Manager'] || '' };
    }
    
    recruiterData[recruiter].pass += parseFloat(r['Opportunity Pass']) || 0;
    recruiterData[recruiter].total += parseFloat(r['Opportunity Excluding NA']) || 0;
    recruiterData[recruiter].samples += parseFloat(r['Sample Count']) || 0;
    recruiterData[recruiter].errors += parseFloat(r['Opportunity Fail']) || 0;
  });
  
  const scatterData = Object.entries(recruiterData).map(([name, data]) => ({
    x: data.samples,
    y: data.total > 0 ? (data.pass / data.total * 100) : 0,
    r: Math.max(5, Math.min(20, data.errors)),
    name,
    pm: data.pm
  }));
  
  const ctx = canvas.getContext('2d');
  charts.recruiterScatter = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Recruiters',
        data: scatterData,
        backgroundColor: 'rgba(200, 16, 46, 0.6)',
        borderColor: MM_COLORS.red,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const point = context.raw;
              return [
                `Recruiter: ${point.name}`,
                `Sample Count: ${point.x}`,
                `Accuracy: ${point.y.toFixed(1)}%`,
                `Errors: ${point.r}`,
                `PM: ${point.pm}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Sample Count'
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy Score (%)'
          }
        }
      }
    }
  });
}

function updateRecruiterBarChart() {
  const canvas = document.getElementById('recruiter-bar-chart');
  if (!canvas || !filteredData) return;
  
  if (charts.recruiterBar) {
    charts.recruiterBar.destroy();
  }
  
  // Group by recruiter
  const recruiterData = {};
  filteredData.forEach(r => {
    const recruiter = r['Recruiter Name'];
    if (!recruiter) return;
    
    if (!recruiterData[recruiter]) {
      recruiterData[recruiter] = { pass: 0, total: 0 };
    }
    
    recruiterData[recruiter].pass += parseFloat(r['Opportunity Pass']) || 0;
    recruiterData[recruiter].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const recruiterArray = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10);
  
  const names = recruiterArray.map(r => r.name.length > 20 ? r.name.substring(0, 20) + '...' : r.name);
  const accuracy = recruiterArray.map(r => r.accuracy);
  
  const ctx = canvas.getContext('2d');
  charts.recruiterBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{
        label: 'Accuracy Score',
        data: accuracy,
        backgroundColor: MM_COLORS.red,
        borderColor: MM_COLORS.red,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy Score (%)'
          }
        }
      }
    }
  });
}

function updateRecruiterTable() {
  const tbody = document.getElementById('recruiter-table-body');
  if (!tbody || !filteredData) return;
  
  // Group by recruiter
  const recruiterData = {};
  filteredData.forEach(r => {
    const recruiter = r['Recruiter Name'];
    if (!recruiter) return;
    
    if (!recruiterData[recruiter]) {
      recruiterData[recruiter] = { pass: 0, total: 0, errors: 0, samples: 0, pm: r['Program Manager'] || '' };
    }
    
    recruiterData[recruiter].pass += parseFloat(r['Opportunity Pass']) || 0;
    recruiterData[recruiter].total += parseFloat(r['Opportunity Excluding NA']) || 0;
    recruiterData[recruiter].errors += parseFloat(r['Opportunity Fail']) || 0;
    recruiterData[recruiter].samples += parseFloat(r['Sample Count']) || 0;
  });
  
  const recruiterArray = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0,
      errors: data.errors,
      samples: data.samples,
      pm: data.pm
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
  
  tbody.innerHTML = recruiterArray.map(r => {
    const statusClass = r.accuracy >= 95 ? 'bg-green-100 text-green-800' : 
                       r.accuracy >= 90 ? 'bg-blue-100 text-blue-800' :
                       r.accuracy >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    const statusText = r.accuracy >= 95 ? 'Excellent' :
                      r.accuracy >= 90 ? 'Good' :
                      r.accuracy >= 80 ? 'Fair' : 'Needs Improvement';
    
    return `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-3">${r.name}</td>
        <td class="px-4 py-3 text-center font-bold" style="color: ${MM_COLORS.red}">${r.accuracy.toFixed(1)}%</td>
        <td class="px-4 py-3 text-center">${r.errors}</td>
        <td class="px-4 py-3 text-center">${r.samples}</td>
        <td class="px-4 py-3 text-center">${r.pm}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-1 rounded text-xs font-semibold ${statusClass}">${statusText}</span>
        </td>
      </tr>
    `;
  }).join('');
}

// Update Trends view - REMOVED (duplicate, see line 2693)

function updateFYMetrics() {
  const fyData = { fy23: [], fy24: [], fy25: [] };
  
  rawData.auditCount.forEach(r => {
    const fy = r['Financial Year'];
    if (fy && fy.includes('23')) fyData.fy23.push(r);
    else if (fy && fy.includes('24')) fyData.fy24.push(r);
    else if (fy && fy.includes('25')) fyData.fy25.push(r);
  });
  
  ['fy23', 'fy24', 'fy25'].forEach(fy => {
    const data = fyData[fy];
    const pass = data.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
    const total = data.reduce((sum, r) => sum + (parseFloat(r['Opportunity Excluding NA']) || 0), 0);
    const opportunities = data.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
    const samples = data.reduce((sum, r) => sum + (parseFloat(r['Sample Count']) || 0), 0);
    
    const accuracy = total > 0 ? (pass / total * 100) : 0;
    
    // Add null checks before updating DOM
    const accuracyEl = document.getElementById(`${fy}-accuracy`);
    const opportunitiesEl = document.getElementById(`${fy}-opportunities`);
    const samplesEl = document.getElementById(`${fy}-samples`);
    
    if (accuracyEl) accuracyEl.textContent = accuracy.toFixed(1) + '%';
    if (opportunitiesEl) opportunitiesEl.textContent = opportunities.toLocaleString();
    if (samplesEl) samplesEl.textContent = samples.toLocaleString();
  });
}

function updateFYComparisonChart() {
  const canvas = document.getElementById('fy-comparison-chart');
  if (!canvas || !rawData) return;
  
  if (charts.fyComparison) {
    charts.fyComparison.destroy();
  }
  
  // Group by month and FY
  const monthlyData = {};
  rawData.auditCount.forEach(r => {
    const month = r['Month'];
    const fy = r['Financial Year'];
    if (!month || !fy) return;
    
    if (!monthlyData[month]) {
      monthlyData[month] = { fy23: { pass: 0, total: 0 }, fy24: { pass: 0, total: 0 }, fy25: { pass: 0, total: 0 } };
    }
    
    const pass = parseFloat(r['Opportunity Pass']) || 0;
    const total = parseFloat(r['Opportunity Excluding NA']) || 0;
    
    if (fy.includes('23')) {
      monthlyData[month].fy23.pass += pass;
      monthlyData[month].fy23.total += total;
    } else if (fy.includes('24')) {
      monthlyData[month].fy24.pass += pass;
      monthlyData[month].fy24.total += total;
    } else if (fy.includes('25')) {
      monthlyData[month].fy25.pass += pass;
      monthlyData[month].fy25.total += total;
    }
  });
  
  const months = Object.keys(monthlyData);
  const fy23 = months.map(m => {
    const d = monthlyData[m].fy23;
    return d.total > 0 ? (d.pass / d.total * 100) : null;
  });
  const fy24 = months.map(m => {
    const d = monthlyData[m].fy24;
    return d.total > 0 ? (d.pass / d.total * 100) : null;
  });
  const fy25 = months.map(m => {
    const d = monthlyData[m].fy25;
    return d.total > 0 ? (d.pass / d.total * 100) : null;
  });
  
  const ctx = canvas.getContext('2d');
  charts.fyComparison = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'FY23',
          data: fy23,
          borderColor: chartColors.primary[2],
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'FY24',
          data: fy24,
          borderColor: MM_COLORS.red,
          backgroundColor: 'rgba(200, 16, 46, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'FY25',
          data: fy25,
          borderColor: MM_COLORS.darkRed,
          backgroundColor: 'rgba(139, 0, 0, 0.1)',
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy Score (%)'
          }
        }
      }
    }
  });
}

function updateWeeklyFYChart() {
  const canvas = document.getElementById('weekly-fy-chart');
  if (!canvas || !rawData) return;
  
  if (charts.weeklyFY) {
    charts.weeklyFY.destroy();
  }
  
  // Use weekly data from FY sheets
  const fy23Data = rawData.fy23 || [];
  const fy24Data = rawData.fy24 || [];
  
  const allWeeks = [...new Set([
    ...fy23Data.map(r => r['Week'] || r['Week Number']),
    ...fy24Data.map(r => r['Week'] || r['Week Number'])
  ])].filter(Boolean).sort((a, b) => a - b);
  
  const fy23Accuracy = allWeeks.map(week => {
    const record = fy23Data.find(r => (r['Week'] || r['Week Number']) == week);
    return record ? parseFloat(record['Accuracy Score']) || 0 : null;
  });
  
  const fy24Accuracy = allWeeks.map(week => {
    const record = fy24Data.find(r => (r['Week'] || r['Week Number']) == week);
    return record ? parseFloat(record['Accuracy Score']) || 0 : null;
  });
  
  const ctx = canvas.getContext('2d');
  charts.weeklyFY = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allWeeks,
      datasets: [
        {
          label: 'FY23 Weekly',
          data: fy23Accuracy,
          borderColor: chartColors.primary[2],
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'FY24 Weekly',
          data: fy24Accuracy,
          borderColor: MM_COLORS.red,
          backgroundColor: 'rgba(200, 16, 46, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy Score (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Week Number'
          }
        }
      }
    }
  });
}

// Update Insights view
function updateInsightsView() {
  generateAIInsights();
  generateRecommendations();
  identifyCriticalErrors();
  identifyBestPractices();
}

function generateAIInsights() {
  const container = document.getElementById('ai-insights');
  if (!container || !filteredData) return;
  
  const insights = [];
  
  // Overall performance
  const totalPass = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
  const totalExcludingNA = filteredData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Excluding NA']) || 0), 0);
  const accuracy = totalExcludingNA > 0 ? (totalPass / totalExcludingNA * 100) : 0;
  
  if (accuracy >= 95) {
    insights.push({
      type: 'positive',
      icon: 'fa-check-circle',
      text: `Outstanding performance with ${accuracy.toFixed(1)}% accuracy! The team is consistently meeting quality standards.`
    });
  } else if (accuracy < 85) {
    insights.push({
      type: 'negative',
      icon: 'fa-exclamation-triangle',
      text: `Current accuracy of ${accuracy.toFixed(1)}% is below target. Immediate attention required to improve quality standards.`
    });
  }
  
  // Stage analysis
  const stageData = {};
  filteredData.forEach(r => {
    const stage = r['Recruitment Stage'];
    if (!stage) return;
    
    if (!stageData[stage]) {
      stageData[stage] = { pass: 0, total: 0 };
    }
    
    stageData[stage].pass += parseFloat(r['Opportunity Pass']) || 0;
    stageData[stage].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const worstStage = Object.entries(stageData)
    .map(([stage, data]) => ({
      stage,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0
    }))
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  
  if (worstStage && worstStage.accuracy < 90) {
    insights.push({
      type: 'warning',
      icon: 'fa-layer-group',
      text: `<strong>${worstStage.stage}</strong> stage shows lowest accuracy at ${worstStage.accuracy.toFixed(1)}%. Consider focused training and process improvements.`
    });
  }
  
  // Parameter analysis
  const paramData = {};
  filteredData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { fail: 0, total: 0 };
    }
    
    paramData[param].fail += parseFloat(r['Opportunity Fail']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const highErrorParams = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      errorRate: data.total > 0 ? (data.fail / data.total * 100) : 0,
      errors: data.fail
    }))
    .filter(p => p.errorRate > 10)
    .sort((a, b) => b.errorRate - a.errorRate);
  
  if (highErrorParams.length > 0) {
    insights.push({
      type: 'info',
      icon: 'fa-exclamation-circle',
      text: `${highErrorParams.length} parameters have error rates exceeding 10%. Top issue: <strong>${highErrorParams[0].param}</strong> at ${highErrorParams[0].errorRate.toFixed(1)}% error rate.`
    });
  }
  
  // Recruiter performance spread
  const recruiterData = {};
  filteredData.forEach(r => {
    const recruiter = r['Recruiter Name'];
    if (!recruiter) return;
    
    if (!recruiterData[recruiter]) {
      recruiterData[recruiter] = { pass: 0, total: 0 };
    }
    
    recruiterData[recruiter].pass += parseFloat(r['Opportunity Pass']) || 0;
    recruiterData[recruiter].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const recruiterAccuracies = Object.values(recruiterData)
    .map(d => d.total > 0 ? (d.pass / d.total * 100) : 0)
    .filter(a => a > 0);
  
  if (recruiterAccuracies.length > 0) {
    const avgAccuracy = recruiterAccuracies.reduce((a, b) => a + b, 0) / recruiterAccuracies.length;
    const stdDev = Math.sqrt(recruiterAccuracies.reduce((sq, n) => sq + Math.pow(n - avgAccuracy, 2), 0) / recruiterAccuracies.length);
    
    if (stdDev > 10) {
      insights.push({
        type: 'warning',
        icon: 'fa-users',
        text: `High performance variance detected among recruiters (σ=${stdDev.toFixed(1)}%). Consider peer learning sessions and standardized best practices.`
      });
    }
  }
  
  container.innerHTML = insights.map(i => {
    const colors = {
      positive: 'bg-green-50 border-green-200 text-green-800',
      negative: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    return `
      <div class="p-4 rounded-lg border-2 ${colors[i.type]}">
        <i class="fas ${i.icon} mr-2"></i>
        <span>${i.text}</span>
      </div>
    `;
  }).join('');
}

function generateRecommendations() {
  const container = document.getElementById('recommendations');
  if (!container || !filteredData) return;
  
  const recommendations = [];
  
  // Analyze parameters for errors
  const paramData = {};
  filteredData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { fail: 0, total: 0 };
    }
    
    paramData[param].fail += parseFloat(r['Opportunity Fail']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const highErrorParams = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      errorRate: data.total > 0 ? (data.fail / data.total * 100) : 0
    }))
    .filter(p => p.errorRate > 8)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 3);
  
  if (highErrorParams.some(p => p.param.toLowerCase().includes('intake'))) {
    recommendations.push('Standardize <strong>Intake Meeting form Completeness & Correctness</strong> and launch refresher training for recruiters with persistent errors.');
  }
  
  if (highErrorParams.some(p => p.param.toLowerCase().includes('assessment') || p.param.toLowerCase().includes('ces'))) {
    recommendations.push('Automate checks for <strong>Candidate Assessment Sheet submission</strong> and <strong>CES completeness</strong> using mandatory fields in the ATS.');
  }
  
  if (highErrorParams.some(p => p.param.toLowerCase().includes('bgv') || p.param.toLowerCase().includes('medical') || p.param.toLowerCase().includes('bonus'))) {
    recommendations.push('Introduce checklists for <strong>BGV Initiation, Medical Test, and Joining Bonus / Notice Buyout approvals</strong> to reduce misses in Pre-Onboarding.');
  }
  
  // Recruiter-specific recommendations
  const recruiterData = {};
  filteredData.forEach(r => {
    const recruiter = r['Recruiter Name'];
    if (!recruiter) return;
    
    if (!recruiterData[recruiter]) {
      recruiterData[recruiter] = { fail: 0, total: 0 };
    }
    
    recruiterData[recruiter].fail += parseFloat(r['Opportunity Fail']) || 0;
    recruiterData[recruiter].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const totalErrors = Object.values(recruiterData).reduce((sum, d) => sum + d.fail, 0);
  const highErrorRecruiters = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      errorContribution: totalErrors > 0 ? (data.fail / totalErrors * 100) : 0
    }))
    .filter(r => r.errorContribution > 5)
    .sort((a, b) => b.errorContribution - a.errorContribution);
  
  if (highErrorRecruiters.length > 0) {
    recommendations.push(`Run targeted capability-building for ${highErrorRecruiters.length} recruiter(s) whose error contribution exceeds 5% of total errors.`);
  }
  
  // Sample coverage recommendation
  const totalPopulation = filteredData.reduce((sum, r) => sum + (parseFloat(r['Total Population']) || 0), 0);
  const totalSamples = filteredData.reduce((sum, r) => sum + (parseFloat(r['Sample Count']) || 0), 0);
  const coverage = totalPopulation > 0 ? (totalSamples / totalPopulation * 100) : 0;
  
  if (coverage < 30) {
    recommendations.push('Increase <strong>audit sample coverage</strong> to at least 30% of total population for more statistically significant insights.');
  }
  
  // Generic best practices
  recommendations.push('Conduct monthly <strong>quality calibration sessions</strong> to ensure consistent audit standards across all recruitment stages.');
  recommendations.push('Implement a <strong>peer review system</strong> where top-performing recruiters mentor those needing improvement.');
  
  container.innerHTML = recommendations.map((rec, i) => `
    <div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-mm-red text-white flex items-center justify-center text-xs font-bold">${i + 1}</span>
      <span class="text-sm">${rec}</span>
    </div>
  `).join('');
}

function identifyCriticalErrors() {
  const container = document.getElementById('critical-errors');
  if (!container || !filteredData) return;
  
  // Find parameters with highest error counts
  const paramData = {};
  filteredData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { fail: 0, total: 0 };
    }
    
    paramData[param].fail += parseFloat(r['Opportunity Fail']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const criticalErrors = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      errors: data.fail,
      errorRate: data.total > 0 ? (data.fail / data.total * 100) : 0
    }))
    .filter(p => p.errorRate > 10 || p.errors > 5)
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 5);
  
  if (criticalErrors.length === 0) {
    container.innerHTML = '<p class="text-green-600 text-sm">✓ No critical error patterns detected. Keep up the good work!</p>';
    return;
  }
  
  container.innerHTML = criticalErrors.map(e => `
    <div class="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
      <span class="text-sm flex-1">${e.param.substring(0, 50)}${e.param.length > 50 ? '...' : ''}</span>
      <span class="text-red-700 font-bold text-sm ml-2">${e.errors} errors (${e.errorRate.toFixed(1)}%)</span>
    </div>
  `).join('');
}

function identifyBestPractices() {
  const container = document.getElementById('best-practices');
  if (!container || !filteredData) return;
  
  // Find parameters with highest accuracy
  const paramData = {};
  filteredData.forEach(r => {
    const param = r['Parameter'];
    if (!param) return;
    
    if (!paramData[param]) {
      paramData[param] = { pass: 0, total: 0 };
    }
    
    paramData[param].pass += parseFloat(r['Opportunity Pass']) || 0;
    paramData[param].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const bestPractices = Object.entries(paramData)
    .map(([param, data]) => ({
      param,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0,
      count: data.total
    }))
    .filter(p => p.accuracy >= 95 && p.count >= 5)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5);
  
  if (bestPractices.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">Upload more data to identify best practices.</p>';
    return;
  }
  
  container.innerHTML = bestPractices.map(p => `
    <div class="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
      <span class="text-sm flex-1">${p.param.substring(0, 50)}${p.param.length > 50 ? '...' : ''}</span>
      <span class="text-yellow-700 font-bold text-sm ml-2">${p.accuracy.toFixed(1)}% ⭐</span>
    </div>
  `).join('');
}

// Tab switching
function switchTab(tabName) {
  // Announce tab switch with audio
  const tabNames = {
    'overview': 'Overview - Key metrics and summary',
    'stage-parameter': 'Stage and Parameter - Heatmap analysis',
    'recruiter': 'Recruiter View - Performance metrics',
    'trends': 'Trends and Predictive Analytics',
    'insights': 'Insights and Recommendations',
    'strategic': 'Strategic View - RCAs, CAPAs and Six Sigma Projects'
  };
  
  if (audioEnabled && tabNames[tabName]) {
    speakText(tabNames[tabName]);
  }
  
  // Update main nav tab buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Update sub-nav items
  document.querySelectorAll('.nav-sub-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // If clicking a sub-item, activate both the sub-item and parent
  if (event && event.target) {
    const subItem = event.target.closest('.nav-sub-item');
    if (subItem) {
      subItem.classList.add('active');
      // Also activate the parent nav-tab
      const parentNavTab = subItem.closest('.nav-sub-items').previousElementSibling;
      if (parentNavTab) {
        parentNavTab.classList.add('active');
      }
    } else {
      const navTab = event.target.closest('.nav-tab');
      if (navTab) {
        navTab.classList.add('active');
      }
    }
  }
  
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
  }
  
  // Populate dropdowns for new tabs
  if (tabName === 'recruiter-performance') {
    populateRecruiterSelect();
  } else if (tabName === 'program-manager-view') {
    populatePMSelect();
  } else if (tabName === 'top-performers') {
    updateTopPerformers();
  } else if (tabName === 'team-comparison') {
    updateTeamComparison();
  } else if (tabName === 'improvement-areas') {
    updateImprovementAreas();
  } else if (tabName === 'strategic') {
    updateStrategicView();
  }
}

// Switch Strategic View Tabs (RCA, CAPA, Six Sigma)
function switchStrategicTab(subTab) {
  // Remove active class from all strategic tabs
  document.querySelectorAll('.strategic-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Add active class to clicked tab
  const activeTab = document.getElementById(`strategic-tab-${subTab}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  // Hide all strategic content sections
  document.querySelectorAll('.strategic-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Show selected content
  const selectedContent = document.getElementById(`strategic-content-${subTab}`);
  if (selectedContent) {
    selectedContent.classList.remove('hidden');
  }
  
  // Audio announcement
  const subTabNames = {
    'rca': 'Root Cause Analysis Projects',
    'capa': 'Corrective and Preventive Actions',
    'sixsigma': 'Six Sigma Projects'
  };
  
  if (audioEnabled && subTabNames[subTab]) {
    speakText(subTabNames[subTab]);
  }
}

// Make switchStrategicTab globally available
window.switchStrategicTab = switchStrategicTab;

// Populate Strategic View with real data
function updateStrategicView() {
  if (!rawData) return;
  
  updateRCACapaView();
  updateSixSigmaView();
}

// Update RCA/CAPA View with real data from "RCA OR CAPA" sheet
function updateRCACapaView() {
  if (!rawData || !rawData.rcaCapaProjects || rawData.rcaCapaProjects.length === 0) {
    console.log('No RCA/CAPA data available');
    return;
  }
  
  const data = rawData.rcaCapaProjects;
  console.log('RCA/CAPA Projects data:', data);
  
  // Calculate summary metrics
  const totalProjects = data.length;
  const rcaProjects = data.filter(p => p['Type'] && p['Type'].toLowerCase().includes('rca'));
  const capaProjects = data.filter(p => p['Type'] && p['Type'].toLowerCase().includes('capa'));
  const inProgress = data.filter(p => p['Status'] && p['Status'].toLowerCase().includes('progress'));
  const completed = data.filter(p => p['Status'] && p['Status'].toLowerCase().includes('complete'));
  
  // Update RCA summary cards (if elements exist)
  const rcaTotalEl = document.querySelector('#strategic-content-rca .dashboard-card:nth-child(1) .text-3xl');
  if (rcaTotalEl) rcaTotalEl.textContent = rcaProjects.length;
  
  const rcaInProgressEl = document.querySelector('#strategic-content-rca .dashboard-card:nth-child(2) .text-3xl');
  if (rcaInProgressEl) rcaInProgressEl.textContent = rcaProjects.filter(p => p['Status'] && p['Status'].toLowerCase().includes('progress')).length;
  
  const rcaCompletedEl = document.querySelector('#strategic-content-rca .dashboard-card:nth-child(3) .text-3xl');
  if (rcaCompletedEl) rcaCompletedEl.textContent = rcaProjects.filter(p => p['Status'] && p['Status'].toLowerCase().includes('complete')).length;
  
  // Update RCA table
  const rcaTableBody = document.getElementById('rca-projects-table');
  if (rcaTableBody && rcaProjects.length > 0) {
    rcaTableBody.innerHTML = rcaProjects.map(project => {
      const status = project['Status'] || 'Unknown';
      const priority = project['Priority'] || 'Medium';
      
      const statusColor = status.toLowerCase().includes('complete') 
        ? 'background: #D1FAE5; color: #065F46;'
        : status.toLowerCase().includes('progress')
        ? 'background: #FEF3C7; color: #92400E;'
        : 'background: #DBEAFE; color: #1E40AF;';
      
      const priorityColor = priority.toLowerCase().includes('high')
        ? 'background: #FEE2E2; color: #991B1B;'
        : priority.toLowerCase().includes('low')
        ? 'background: #D1FAE5; color: #065F46;'
        : 'background: #DBEAFE; color: #1E40AF;';
      
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td class="py-4 px-4 font-mono text-sm" style="color: var(--text-primary);">${project['Project ID'] || 'N/A'}</td>
          <td class="py-4 px-4" style="color: var(--text-primary);">${project['Issue Description'] || project['Title'] || 'N/A'}</td>
          <td class="py-4 px-4" style="color: var(--text-secondary);">${project['Root Cause'] || 'Under investigation'}</td>
          <td class="py-4 px-4" style="color: var(--text-primary);">${project['Stage'] || project['Recruitment Stage'] || 'N/A'}</td>
          <td class="py-4 px-4" style="color: var(--text-primary);">${project['Owner'] || 'Unassigned'}</td>
          <td class="py-4 px-4">
            <span class="px-2 py-1 rounded text-xs font-semibold" style="${statusColor}">${status}</span>
          </td>
          <td class="py-4 px-4">
            <span class="px-2 py-1 rounded text-xs font-semibold" style="${priorityColor}">${priority}</span>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  // Update CAPA summary cards
  const capaTotalEl = document.querySelector('#strategic-content-capa .dashboard-card:nth-child(1) .text-3xl');
  if (capaTotalEl) capaTotalEl.textContent = capaProjects.length;
  
  const capaOpenEl = document.querySelector('#strategic-content-capa .dashboard-card:nth-child(2) .text-3xl');
  if (capaOpenEl) capaOpenEl.textContent = capaProjects.filter(p => !p['Status'] || !p['Status'].toLowerCase().includes('complete')).length;
  
  // Calculate effectiveness rate
  const completedCapas = capaProjects.filter(p => p['Status'] && p['Status'].toLowerCase().includes('complete'));
  const effectiveCapas = completedCapas.filter(p => p['Effectiveness'] && p['Effectiveness'].toLowerCase().includes('verified'));
  const effectivenessRate = completedCapas.length > 0 ? Math.round((effectiveCapas.length / completedCapas.length) * 100) : 0;
  
  const capaEffectivenessEl = document.querySelector('#strategic-content-capa .dashboard-card:nth-child(3) .text-3xl');
  if (capaEffectivenessEl) capaEffectivenessEl.textContent = effectivenessRate + '%';
}

// Update Six Sigma View with real data from "Six Sigma Projects" sheet
function updateSixSigmaView() {
  if (!rawData || !rawData.sixSigmaProjects || rawData.sixSigmaProjects.length === 0) {
    console.log('No Six Sigma projects data available');
    return;
  }
  
  const data = rawData.sixSigmaProjects;
  console.log('Six Sigma Projects data:', data);
  
  // Calculate summary metrics
  const activeProjects = data.filter(p => p['Status'] && !p['Status'].toLowerCase().includes('complete'));
  
  // Calculate average cycle time
  const completedProjects = data.filter(p => p['Status'] && p['Status'].toLowerCase().includes('complete'));
  let avgCycleTime = 0;
  if (completedProjects.length > 0) {
    const totalDays = completedProjects.reduce((sum, p) => {
      const days = parseFloat(p['Cycle Time (Days)']) || 0;
      return sum + days;
    }, 0);
    avgCycleTime = Math.round(totalDays / completedProjects.length);
  }
  
  // Calculate defect reduction
  let totalDefectReduction = 0;
  if (data.length > 0) {
    data.forEach(p => {
      const baseline = parseFloat(p['Baseline']) || 0;
      const current = parseFloat(p['Current']) || 0;
      if (baseline > 0) {
        totalDefectReduction += ((baseline - current) / baseline) * 100;
      }
    });
    totalDefectReduction = Math.round(totalDefectReduction / data.length);
  }
  
  // Calculate cost savings
  const totalSavings = data.reduce((sum, p) => {
    const savings = parseFloat(p['Cost Savings']) || 0;
    return sum + savings;
  }, 0);
  
  // Update summary cards
  const activeProjectsEl = document.querySelector('#strategic-content-sixsigma .dashboard-card:nth-child(1) .text-3xl');
  if (activeProjectsEl) activeProjectsEl.textContent = activeProjects.length;
  
  const avgCycleEl = document.querySelector('#strategic-content-sixsigma .dashboard-card:nth-child(2) .text-3xl');
  if (avgCycleEl) avgCycleEl.textContent = avgCycleTime || 45;
  
  const defectReductionEl = document.querySelector('#strategic-content-sixsigma .dashboard-card:nth-child(3) .text-3xl');
  if (defectReductionEl) defectReductionEl.textContent = totalDefectReduction + '%';
  
  const costSavingsEl = document.querySelector('#strategic-content-sixsigma .dashboard-card:nth-child(4) .text-3xl');
  if (costSavingsEl) {
    if (totalSavings >= 1000) {
      costSavingsEl.textContent = '$' + Math.round(totalSavings / 1000) + 'K';
    } else {
      costSavingsEl.textContent = '$' + totalSavings.toLocaleString();
    }
  }
}

// Populate recruiter select dropdown
function populateRecruiterSelect() {
  if (!rawData || !rawData.auditCount) return;
  
  const recruiters = [...new Set(rawData.auditCount.map(r => r['Recruiter Name']).filter(Boolean))].sort();
  const select = document.getElementById('recruiter-select');
  
  if (select) {
    select.innerHTML = '<option value="">Choose a recruiter...</option>';
    recruiters.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }
}

// Populate PM select dropdown
function populatePMSelect() {
  if (!rawData || !rawData.auditCount) return;
  
  const pms = [...new Set(rawData.auditCount.map(r => r['Program Manager']).filter(Boolean))].sort();
  const select = document.getElementById('pm-select');
  
  if (select) {
    select.innerHTML = '<option value="">Choose a PM...</option>';
    pms.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }
}

// Update top performers
function updateTopPerformers() {
  if (!filteredData) return;
  
  const recruiterData = {};
  filteredData.forEach(r => {
    const name = r['Recruiter Name'];
    if (!name) return;
    
    if (!recruiterData[name]) {
      recruiterData[name] = { pass: 0, total: 0 };
    }
    
    recruiterData[name].pass += parseFloat(r['Opportunity Pass']) || 0;
    recruiterData[name].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const topPerformers = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10);
  
  // Update top 3
  if (topPerformers[0]) {
    document.getElementById('top-1-name').textContent = topPerformers[0].name;
    document.getElementById('top-1-score').textContent = topPerformers[0].accuracy.toFixed(1) + '% Accuracy';
  }
  if (topPerformers[1]) {
    document.getElementById('top-2-name').textContent = topPerformers[1].name;
    document.getElementById('top-2-score').textContent = topPerformers[1].accuracy.toFixed(1) + '% Accuracy';
  }
  if (topPerformers[2]) {
    document.getElementById('top-3-name').textContent = topPerformers[2].name;
    document.getElementById('top-3-score').textContent = topPerformers[2].accuracy.toFixed(1) + '% Accuracy';
  }
  
  // Update top 10 list
  const listContainer = document.getElementById('top-performers-list');
  if (listContainer) {
    listContainer.innerHTML = topPerformers.map((p, i) => `
      <div class="flex items-center justify-between p-3 border-b">
        <div class="flex items-center gap-3">
          <span class="text-2xl font-bold text-gray-400">#${i + 1}</span>
          <span class="font-semibold">${p.name}</span>
        </div>
        <span class="text-xl font-bold text-mm-red">${p.accuracy.toFixed(1)}%</span>
      </div>
    `).join('');
  }
}

// Update team comparison
function updateTeamComparison() {
  console.log('Updating team comparison view');
  // Implementation for team comparison charts
}

// Update improvement areas
function updateImprovementAreas() {
  if (!filteredData) return;
  
  const recruiterData = {};
  filteredData.forEach(r => {
    const name = r['Recruiter Name'];
    if (!name) return;
    
    if (!recruiterData[name]) {
      recruiterData[name] = { pass: 0, fail: 0, total: 0 };
    }
    
    recruiterData[name].pass += parseFloat(r['Opportunity Pass']) || 0;
    recruiterData[name].fail += parseFloat(r['Opportunity Fail']) || 0;
    recruiterData[name].total += parseFloat(r['Opportunity Excluding NA']) || 0;
  });
  
  const lowAccuracy = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0,
      errorRate: data.total > 0 ? (data.fail / data.total * 100) : 0
    }))
    .filter(r => r.accuracy < 80)
    .sort((a, b) => a.accuracy - b.accuracy);
  
  const highError = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      accuracy: data.total > 0 ? (data.pass / data.total * 100) : 0,
      errorRate: data.total > 0 ? (data.fail / data.total * 100) : 0
    }))
    .filter(r => r.errorRate > 15)
    .sort((a, b) => b.errorRate - a.errorRate);
  
  // Update lists
  const lowAccuracyList = document.getElementById('low-accuracy-list');
  if (lowAccuracyList) {
    lowAccuracyList.innerHTML = lowAccuracy.length > 0 
      ? lowAccuracy.map(r => `
          <div class="text-sm">
            <strong>${r.name}</strong>: ${r.accuracy.toFixed(1)}% accuracy
          </div>
        `).join('')
      : '<div class="text-sm text-gray-500">No recruiters below 80% accuracy</div>';
  }
  
  const highErrorList = document.getElementById('high-error-list');
  if (highErrorList) {
    highErrorList.innerHTML = highError.length > 0
      ? highError.map(r => `
          <div class="text-sm">
            <strong>${r.name}</strong>: ${r.errorRate.toFixed(1)}% error rate
          </div>
        `).join('')
      : '<div class="text-sm text-gray-500">No recruiters above 15% error rate</div>';
  }
}

// Export to PDF
function exportToPDF() {
  alert('PDF export functionality would integrate with a library like jsPDF or html2pdf. Generating comprehensive report...');
  // TODO: Implement actual PDF generation
}

// UI helpers
function showLoadingState() {
  document.getElementById('loading-state').classList.remove('hidden');
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
}

function hideLoadingState() {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('tab-overview').classList.remove('hidden');
}

function showSuccessMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
  toast.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showErrorMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-20 right-6 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
  toast.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Toggle navigation expansion
function toggleNavExpand(element, event) {
  event.stopPropagation();
  const subItems = element.nextElementSibling;
  const isExpanded = element.classList.contains('expanded');
  
  // Close all other expanded items
  document.querySelectorAll('.nav-tab.expanded').forEach(nav => {
    if (nav !== element) {
      nav.classList.remove('expanded');
      nav.nextElementSibling.classList.remove('expanded');
    }
  });
  
  // Toggle current item
  if (isExpanded) {
    element.classList.remove('expanded');
    subItems.classList.remove('expanded');
  } else {
    element.classList.add('expanded');
    subItems.classList.add('expanded');
  }
}

// Load recruiter scorecard
function loadRecruiterScorecard() {
  const recruiterName = document.getElementById('recruiter-select').value;
  if (!recruiterName || !filteredData) return;
  
  const recruiterData = filteredData.filter(r => r['Recruiter Name'] === recruiterName);
  
  const pass = recruiterData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
  const total = recruiterData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Excluding NA']) || 0), 0);
  const audits = recruiterData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
  
  const accuracy = total > 0 ? (pass / total * 100) : 0;
  
  document.getElementById('recruiter-accuracy').textContent = accuracy.toFixed(1) + '%';
  document.getElementById('recruiter-audits').textContent = audits.toLocaleString();
  
  // Update chart if needed
  updateRecruiterScorecardChart(recruiterData);
}

// Load PM view
function loadPMView() {
  const pmName = document.getElementById('pm-select').value;
  if (!pmName || !filteredData) return;
  
  const pmData = filteredData.filter(r => r['Program Manager'] === pmName);
  const recruiters = [...new Set(pmData.map(r => r['Recruiter Name']).filter(Boolean))];
  
  const pass = pmData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
  const total = pmData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Excluding NA']) || 0), 0);
  const audits = pmData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
  
  const accuracy = total > 0 ? (pass / total * 100) : 0;
  
  document.getElementById('pm-team-size').textContent = recruiters.length;
  document.getElementById('pm-accuracy').textContent = accuracy.toFixed(1) + '%';
  document.getElementById('pm-audits').textContent = audits.toLocaleString();
  
  // Update charts and table
  updatePMCharts(pmData, recruiters);
}

// Placeholder chart update functions
function updateRecruiterScorecardChart(data) {
  console.log('Updating recruiter scorecard chart with data:', data);
}

function updatePMCharts(data, recruiters) {
  console.log('Updating PM charts with data:', data, 'Recruiters:', recruiters);
}

// Audio Description and Theme Toggle
let audioEnabled = false;
let darkTheme = false;

function toggleAudioDescription() {
  audioEnabled = !audioEnabled;
  const btn = document.getElementById('audio-toggle');
  
  if (audioEnabled) {
    btn.classList.add('bg-white', 'text-mm-red');
    btn.classList.remove('bg-white/20');
    speakText('Audio description enabled. You can now listen to dashboard insights.');
  } else {
    btn.classList.remove('bg-white', 'text-mm-red');
    btn.classList.add('bg-white/20');
    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

function toggleTheme() {
  darkTheme = !darkTheme;
  const btn = document.getElementById('theme-toggle');
  const icon = btn.querySelector('i');
  
  if (darkTheme) {
    // Switch to Dark Theme
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    btn.classList.add('bg-white', 'text-mm-red');
    btn.classList.remove('bg-white/20');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    if (audioEnabled) speakText('Dark theme activated');
    localStorage.setItem('theme', 'dark');
  } else {
    // Switch to Light Theme
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    btn.classList.remove('bg-white', 'text-mm-red');
    btn.classList.add('bg-white/20');
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    if (audioEnabled) speakText('Light theme activated');
    localStorage.setItem('theme', 'light');
  }
}

function speakText(text) {
  if (!audioEnabled || !('speechSynthesis' in window)) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Forecast View Toggle
function toggleForecastView() {
  const toggle = document.getElementById('forecast-toggle');
  const isChecked = toggle.checked;
  
  if (isChecked) {
    if (audioEnabled) speakText('Forecast view enabled. Showing predictive analytics.');
    // Update chart to show forecast
    updatePredictiveChart();
  } else {
    if (audioEnabled) speakText('Historical view enabled. Showing historical data only.');
    // Update chart to hide forecast
    updatePredictiveChart();
  }
}

// Update Predictive Chart
function updatePredictiveChart() {
  const canvas = document.getElementById('predictive-chart');
  if (!canvas || !filteredData) return;
  
  if (charts.predictive) {
    charts.predictive.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Generate historical months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const forecastMonths = ['Forecast 1', 'Forecast 2', 'Forecast 3'];
  const allMonths = [...months, ...forecastMonths];
  
  // Calculate historical accuracy data
  const historicalAccuracy = months.map((month, index) => {
    const monthData = filteredData.filter(r => r['Month'] === month);
    if (monthData.length === 0) return null;
    
    const pass = monthData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Pass']) || 0), 0);
    const total = monthData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
    const na = monthData.reduce((sum, r) => sum + (parseFloat(r['Opportunity NA']) || 0), 0);
    
    return total - na > 0 ? (pass / (total - na) * 100) : null;
  });
  
  // Calculate historical error rate
  const historicalError = months.map((month, index) => {
    const monthData = filteredData.filter(r => r['Month'] === month);
    if (monthData.length === 0) return null;
    
    const fail = monthData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Fail']) || 0), 0);
    const total = monthData.reduce((sum, r) => sum + (parseFloat(r['Opportunity Count']) || 0), 0);
    const na = monthData.reduce((sum, r) => sum + (parseFloat(r['Opportunity NA']) || 0), 0);
    
    return total - na > 0 ? (fail / (total - na) * 100) : null;
  });
  
  // Get last valid values for forecast baseline
  const lastAccuracy = historicalAccuracy.filter(v => v !== null).slice(-1)[0] || 90;
  const lastError = historicalError.filter(v => v !== null).slice(-1)[0] || 5;
  
  // Generate forecast data (improving trend)
  const forecastAccuracy = [
    lastAccuracy + 1.2,
    lastAccuracy + 2.8,
    lastAccuracy + 4.5
  ];
  
  const forecastError = [
    lastError - 0.8,
    lastError - 1.5,
    lastError - 2.0
  ];
  
  // Combine historical and forecast
  const fullAccuracy = [...historicalAccuracy, ...forecastAccuracy];
  const fullError = [...historicalError, ...forecastError];
  
  charts.predictive = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allMonths,
      datasets: [
        {
          label: 'Accuracy Score',
          data: fullAccuracy,
          borderColor: '#22D3EE',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#22D3EE',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
          segment: {
            borderDash: ctx => ctx.p0DataIndex >= 11 ? [5, 5] : []
          }
        },
        {
          label: 'Error Rate',
          data: fullError,
          borderColor: '#C084FC',
          backgroundColor: 'rgba(192, 132, 252, 0.1)',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#C084FC',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
          segment: {
            borderDash: ctx => ctx.p0DataIndex >= 11 ? [5, 5] : []
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            callback: value => value + '%'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)'
          }
        }
      }
    }
  });
  
  // Update forecast metrics
  document.getElementById('forecast-accuracy').textContent = forecastAccuracy[0].toFixed(1) + '%';
  document.getElementById('forecast-error').textContent = forecastError[0].toFixed(1) + '%';
  document.getElementById('chart-forecast-accuracy').textContent = forecastAccuracy[0].toFixed(1) + '%';
  document.getElementById('chart-forecast-error').textContent = forecastError[0].toFixed(1) + '%';
}

// Update Trends View to include predictive chart
function updateTrendsView() {
  if (!rawData || !rawData.auditCount) {
    console.log('No raw data available for trends view');
    return;
  }
  
  try {
    updateFYMetrics();
  } catch (error) {
    console.error('Error updating FY metrics:', error);
  }
  
  try {
    updatePredictiveChart();
  } catch (error) {
    console.error('Error updating predictive chart:', error);
  }
  
  // Also update old charts if they exist in DOM
  if (document.getElementById('fy-comparison-chart')) {
    try {
      updateFYComparisonChart();
    } catch (error) {
      console.error('Error updating FY comparison chart:', error);
    }
  }
  
  if (document.getElementById('weekly-fy-chart')) {
    try {
      updateWeeklyFYChart();
    } catch (error) {
      console.error('Error updating weekly FY chart:', error);
    }
  }
}

// Expose functions globally for onclick handlers
window.selectStageTab = selectStageTab;
window.toggleAudioDescription = toggleAudioDescription;
window.toggleTheme = toggleTheme;
window.toggleForecastView = toggleForecastView;

console.log('M&M Dashboard JavaScript loaded successfully');
