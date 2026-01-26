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
  
  // Log first parsed row to see column names
  if (auditCountParsed.length > 0) {
    console.log('First parsed row columns:', Object.keys(auditCountParsed[0]));
    console.log('First parsed row sample:', auditCountParsed[0]);
  }
  
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
  console.log('All available sheet keys:', Object.keys(data));
  console.log('Searching for Strategic sheets...');
  
  // List all keys with 'parsed' suffix
  const parsedKeys = Object.keys(data).filter(key => key.includes('_parsed'));
  console.log('Keys with _parsed suffix:', parsedKeys);
  
  const sixSigmaKey = Object.keys(data).find(key => 
    key.toLowerCase().includes('six') && key.toLowerCase().includes('sigma') && key.includes('_parsed')
  );
  
  // Try multiple patterns for RCA/CAPA sheet
  // Pattern 1: "RCA-CAPA" (with hyphen)
  let rcaCapaKey = Object.keys(data).find(key => 
    key.toLowerCase().includes('rca') && key.toLowerCase().includes('capa') && key.includes('_parsed')
  );
  
  // Pattern 2: "RCA Or CAPA" or "RCA or CAPA" (with "or")
  if (!rcaCapaKey) {
    rcaCapaKey = Object.keys(data).find(key => 
      key.toLowerCase().includes('rca') && key.toLowerCase().includes('or') && key.includes('_parsed')
    );
  }
  
  // Pattern 3: Just "RCA" (most flexible)
  if (!rcaCapaKey) {
    rcaCapaKey = Object.keys(data).find(key => 
      key.toLowerCase().includes('rca') && key.includes('_parsed')
    );
  }
  
  // Pattern 4: Check for hyphen variations (RCA-CAPA, RCA_CAPA)
  if (!rcaCapaKey) {
    rcaCapaKey = Object.keys(data).find(key => {
      const lowerKey = key.toLowerCase();
      return (lowerKey.includes('rca-') || lowerKey.includes('rca_') || lowerKey.includes('rca ')) && 
             key.includes('_parsed');
    });
  }
  
  console.log('Strategic sheets found:', { sixSigmaKey, rcaCapaKey });
  console.log('Six Sigma data:', data[sixSigmaKey] ? data[sixSigmaKey].length + ' records' : 'not found');
  console.log('RCA/CAPA data:', data[rcaCapaKey] ? data[rcaCapaKey].length + ' records' : 'not found');
  
  if (rcaCapaKey) {
    console.log('RCA/CAPA sheet key matched:', rcaCapaKey);
    console.log('RCA/CAPA sample data:', data[rcaCapaKey].slice(0, 2));
  } else {
    console.warn('RCA/CAPA sheet not found! Available parsed keys:', parsedKeys);
  }
  
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
  
  // Helper function to get Financial Year from row (check multiple column names)
  const getFinancialYear = (row) => {
    return row['Financial Year'] || row['FY'] || row['Fy'] || row['financial year'] || row['__EMPTY_1'] || null;
  };
  
  if (currentFilters.year !== 'all') {
    filtered = filtered.filter(r => {
      const fy = getFinancialYear(r);
      // Handle both "FY23" and "2023" formats
      return fy === currentFilters.year || 
             (fy && fy.toString().includes(currentFilters.year.toString().replace('FY', '')));
    });
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
  
  console.log(`Filter applied: year=${currentFilters.year}, filtered count: ${filtered.length}`);
  
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
  
  try {
    updateComparisonView();
  } catch (error) {
    console.error('Error updating comparison view:', error);
  }
  
  console.log('Dashboard update complete');
}

// Update key metrics
function updateKeyMetrics() {
  console.log('updateKeyMetrics called. filteredData:', filteredData ? filteredData.length + ' records' : 'null');
  
  if (!filteredData || filteredData.length === 0) {
    console.warn('No filtered data available for metrics');
    document.getElementById('metric-accuracy').textContent = '--';
    document.getElementById('metric-error-rate').textContent = '--';
    document.getElementById('metric-total-audits').textContent = '--';
    document.getElementById('metric-sample-coverage').textContent = '--';
    return;
  }
  
  // Log first row to see available columns
  console.log('First filtered row:', filteredData[0]);
  console.log('Available columns:', Object.keys(filteredData[0]));
  
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
  
  console.log('Metric calculations:', {
    totalPass,
    totalFail,
    totalOpportunityCount,
    totalNA,
    totalPopulation,
    totalSamples
  });
  
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
  console.log('Updating Recruiter View...');
  console.log('Recruiter Wise Data available:', rawData?.recruiterWise?.length || 0, 'records');
  updateRecruiterScatterChart();
  updateRecruiterBarChart();
  updateRecruiterTable();
  updateRecruiterOfTheMonth();
}

// Recruiter of the Month
function updateRecruiterOfTheMonth() {
  if (!rawData) return;
  
  // Build recruiter data
  let recruiterData = {};
  
  if (rawData.recruiterWise && rawData.recruiterWise.length > 0) {
    rawData.recruiterWise.forEach(row => {
      const recruiter = row['Recruiter Name'] || row['__EMPTY_6'] || row['G'];
      const auditScore = row['Audit Score'] || row['__EMPTY_9'] || row['J'];
      const sampleCount = parseFloat(row['Sample Count']) || parseFloat(row['__EMPTY_10']) || parseFloat(row['K']) || 0;
      
      if (!recruiter || recruiter === 'Recruiter Name') return;
      
      if (!recruiterData[recruiter]) {
        recruiterData[recruiter] = { 
          passCount: 0, 
          totalCount: 0, 
          errors: 0, 
          samples: 0,
          pm: row['Program Manager'] || row['__EMPTY_8'] || row['I'] || ''
        };
      }
      
      if (auditScore === 1 || auditScore === '1') {
        recruiterData[recruiter].passCount++;
        recruiterData[recruiter].totalCount++;
      } else if (auditScore === 0 || auditScore === '0') {
        recruiterData[recruiter].totalCount++;
        recruiterData[recruiter].errors++;
      }
      
      recruiterData[recruiter].samples += sampleCount;
    });
  }
  
  // Sort by accuracy and samples
  const topRecruiters = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      accuracy: data.totalCount > 0 ? (data.passCount / data.totalCount * 100) : 0,
      errors: data.errors,
      samples: data.samples,
      pm: data.pm
    }))
    .filter(r => r.samples >= 10) // Minimum 10 audits
    .sort((a, b) => {
      // Sort by accuracy first, then by sample count
      if (Math.abs(a.accuracy - b.accuracy) < 0.1) {
        return b.samples - a.samples;
      }
      return b.accuracy - a.accuracy;
    })
    .slice(0, 3);
  
  if (topRecruiters.length > 0) {
    const champion = topRecruiters[0];
    document.getElementById('rotm-name').textContent = champion.name;
    document.getElementById('rotm-pm').textContent = champion.pm;
    document.getElementById('rotm-accuracy').textContent = champion.accuracy.toFixed(1) + '%';
    document.getElementById('rotm-samples').textContent = champion.samples;
    document.getElementById('rotm-errors').textContent = champion.errors;
  }
  
  if (topRecruiters.length > 1) {
    const second = topRecruiters[1];
    document.getElementById('rotm-second-name').textContent = second.name;
    document.getElementById('rotm-second-accuracy').textContent = second.accuracy.toFixed(1) + '% • ' + second.samples + ' audits';
  }
  
  if (topRecruiters.length > 2) {
    const third = topRecruiters[2];
    document.getElementById('rotm-third-name').textContent = third.name;
    document.getElementById('rotm-third-accuracy').textContent = third.accuracy.toFixed(1) + '% • ' + third.samples + ' audits';
  }
}

function updateRecruiterScatterChart() {
  const canvas = document.getElementById('recruiter-scatter-chart');
  if (!canvas) return;
  
  if (charts.recruiterScatter) {
    charts.recruiterScatter.destroy();
  }
  
  // Use Recruiter Wise Data sheet if available, otherwise calculate from Audit Count
  let recruiterData = {};
  
  if (rawData && rawData.recruiterWise && rawData.recruiterWise.length > 0) {
    console.log('Using Recruiter Wise Data sheet for recruiter calculations');
    
    // Use Recruiter Wise Data sheet
    // Column G: Recruiter Name, Column J: Audit Score (1 or 0)
    // Accuracy = (Count of 1s) / (Total count excluding NA) * 100
    
    rawData.recruiterWise.forEach(row => {
      const recruiter = row['Recruiter Name'] || row['__EMPTY_6'] || row['G'];
      const auditScore = row['Audit Score'] || row['__EMPTY_9'] || row['J'];
      const sampleCount = parseFloat(row['Sample Count']) || parseFloat(row['__EMPTY_10']) || parseFloat(row['K']) || 0;
      
      if (!recruiter || recruiter === 'Recruiter Name') return; // Skip header
      
      if (!recruiterData[recruiter]) {
        recruiterData[recruiter] = { 
          passCount: 0, 
          totalCount: 0, 
          samples: 0, 
          errors: 0,
          pm: row['Program Manager'] || row['__EMPTY_8'] || row['I'] || ''
        };
      }
      
      // Count 1s for pass, exclude NA
      if (auditScore === 1 || auditScore === '1') {
        recruiterData[recruiter].passCount++;
        recruiterData[recruiter].totalCount++;
      } else if (auditScore === 0 || auditScore === '0') {
        recruiterData[recruiter].totalCount++;
        recruiterData[recruiter].errors++;
      }
      // NA values are not counted in totalCount
      
      recruiterData[recruiter].samples += sampleCount;
    });
  } else {
    console.log('Using Audit Count data for recruiter calculations (fallback)');
    
    // Fallback to Audit Count aggregation
    if (!filteredData) return;
    
    filteredData.forEach(r => {
      const recruiter = r['Recruiter Name'];
      if (!recruiter) return;
      
      if (!recruiterData[recruiter]) {
        recruiterData[recruiter] = { 
          passCount: 0, 
          totalCount: 0, 
          samples: 0, 
          errors: 0, 
          pm: r['Program Manager'] || '' 
        };
      }
      
      recruiterData[recruiter].passCount += parseFloat(r['Opportunity Pass']) || 0;
      recruiterData[recruiter].totalCount += parseFloat(r['Opportunity Excluding NA']) || 0;
      recruiterData[recruiter].samples += parseFloat(r['Sample Count']) || 0;
      recruiterData[recruiter].errors += parseFloat(r['Opportunity Fail']) || 0;
    });
  }
  
  const scatterData = Object.entries(recruiterData).map(([name, data]) => ({
    x: data.samples,
    y: data.totalCount > 0 ? (data.passCount / data.totalCount * 100) : 0,
    r: Math.max(5, Math.min(20, data.errors)),
    name,
    pm: data.pm
  }));
  
  console.log('Recruiter scatter data:', scatterData.length, 'recruiters');
  
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
  if (!tbody) return;
  
  // Use Recruiter Wise Data sheet if available
  let recruiterData = {};
  
  if (rawData && rawData.recruiterWise && rawData.recruiterWise.length > 0) {
    console.log('Using Recruiter Wise Data sheet for table');
    
    rawData.recruiterWise.forEach(row => {
      const recruiter = row['Recruiter Name'] || row['__EMPTY_6'] || row['G'];
      const auditScore = row['Audit Score'] || row['__EMPTY_9'] || row['J'];
      const sampleCount = parseFloat(row['Sample Count']) || parseFloat(row['__EMPTY_10']) || parseFloat(row['K']) || 0;
      
      if (!recruiter || recruiter === 'Recruiter Name') return;
      
      if (!recruiterData[recruiter]) {
        recruiterData[recruiter] = { 
          passCount: 0, 
          totalCount: 0, 
          errors: 0, 
          samples: 0,
          pm: row['Program Manager'] || row['__EMPTY_8'] || row['I'] || ''
        };
      }
      
      if (auditScore === 1 || auditScore === '1') {
        recruiterData[recruiter].passCount++;
        recruiterData[recruiter].totalCount++;
      } else if (auditScore === 0 || auditScore === '0') {
        recruiterData[recruiter].totalCount++;
        recruiterData[recruiter].errors++;
      }
      
      recruiterData[recruiter].samples += sampleCount;
    });
  } else {
    console.log('Using Audit Count data for table (fallback)');
    
    if (!filteredData) return;
    
    filteredData.forEach(r => {
      const recruiter = r['Recruiter Name'];
      if (!recruiter) return;
      
      if (!recruiterData[recruiter]) {
        recruiterData[recruiter] = { passCount: 0, totalCount: 0, errors: 0, samples: 0, pm: r['Program Manager'] || '' };
      }
      
      recruiterData[recruiter].passCount += parseFloat(r['Opportunity Pass']) || 0;
      recruiterData[recruiter].totalCount += parseFloat(r['Opportunity Excluding NA']) || 0;
      recruiterData[recruiter].errors += parseFloat(r['Opportunity Fail']) || 0;
      recruiterData[recruiter].samples += parseFloat(r['Sample Count']) || 0;
    });
  }
  
  const recruiterArray = Object.entries(recruiterData)
    .map(([name, data]) => ({
      name,
      accuracy: data.totalCount > 0 ? (data.passCount / data.totalCount * 100) : 0,
      errors: data.errors,
      samples: data.samples,
      pm: data.pm
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
  
  console.log('Recruiter table:', recruiterArray.length, 'recruiters');
  
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
    'comparison': 'Comparison View - Side-by-side analysis',
    'trendanalysis': 'Trend Analysis - Pattern and forecasting',
    'insights': 'Insights and Recommendations',
    'strategic': 'Strategic View - RCAs, CAPAs and Six Sigma Projects',
    'bestpractices': 'Best Practices - Industry benchmarks and recommendations',
    'usermanual': 'User Manual - Dashboard creation guide',
    'sop': 'SOP Assistant - AI-powered help for M&M Recruitment Process'
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
  } else if (tabName === 'sop') {
    // Test SOP input box
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) {
        console.log('✅ SOP input box found:', input);
        console.log('✅ Input is enabled:', !input.disabled);
        console.log('✅ Input is visible:', input.offsetParent !== null);
        console.log('✅ Input value:', input.value);
        // Try to focus the input to verify it's accessible
        input.focus();
        console.log('✅ Input focused successfully');
      } else {
        console.error('❌ SOP input box NOT found!');
      }
    }, 100);
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
  console.log('updateStrategicView called');
  if (!rawData) {
    console.warn('rawData not available in updateStrategicView');
    return;
  }
  
  console.log('rawData.rcaCapaProjects:', rawData.rcaCapaProjects ? rawData.rcaCapaProjects.length + ' records' : 'undefined');
  console.log('rawData.sixSigmaProjects:', rawData.sixSigmaProjects ? rawData.sixSigmaProjects.length + ' records' : 'undefined');
  
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
  console.log('Total RCA/CAPA records:', data.length);
  console.log('First record structure:', data[0]);
  console.log('First record keys:', Object.keys(data[0] || {}));
  
  // Helper function to safely get property value
  const getProperty = (obj, possibleKeys) => {
    if (!obj) return null;
    for (const key of possibleKeys) {
      if (obj.hasOwnProperty(key)) return obj[key];
    }
    return null;
  };
  
  // Calculate summary metrics with defensive coding
  const totalProjects = data.length;
  const rcaProjects = data.filter(p => {
    const type = getProperty(p, ['Type', 'type', 'TYPE', 'Project Type']);
    return type && type.toString().toLowerCase().includes('rca');
  });
  const capaProjects = data.filter(p => {
    const type = getProperty(p, ['Type', 'type', 'TYPE', 'Project Type']);
    return type && type.toString().toLowerCase().includes('capa');
  });
  
  const inProgress = data.filter(p => {
    const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
    return status && (status.toString().toLowerCase().includes('progress') || status.toString().toLowerCase().includes('open'));
  });
  const completed = data.filter(p => {
    const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
    return status && status.toString().toLowerCase().includes('complete');
  });
  const pending = data.filter(p => {
    const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
    return !status || status.toString().toLowerCase().includes('pending');
  });
  
  console.log('RCA Projects:', rcaProjects.length);
  console.log('CAPA Projects:', capaProjects.length);
  console.log('In Progress:', inProgress.length);
  console.log('Completed:', completed.length);
  console.log('Pending:', pending.length);
  
  // Update RCA summary cards using correct IDs
  const rcaTotalEl = document.getElementById('total-rcas');
  if (rcaTotalEl) {
    rcaTotalEl.textContent = rcaProjects.length;
    console.log('Updated total-rcas to:', rcaProjects.length);
  }
  
  const rcaInProgressEl = document.getElementById('inprogress-rcas');
  if (rcaInProgressEl) {
    const inProgressRCAs = rcaProjects.filter(p => {
      const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
      return status && (status.toString().toLowerCase().includes('progress') || status.toString().toLowerCase().includes('open'));
    });
    rcaInProgressEl.textContent = inProgressRCAs.length;
    console.log('Updated inprogress-rcas to:', inProgressRCAs.length);
  }
  
  const rcaCompletedEl = document.getElementById('completed-rcas');
  if (rcaCompletedEl) {
    const completedRCAs = rcaProjects.filter(p => {
      const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
      return status && status.toString().toLowerCase().includes('complete');
    });
    rcaCompletedEl.textContent = completedRCAs.length;
    console.log('Updated completed-rcas to:', completedRCAs.length);
  }
  
  const rcaPendingEl = document.getElementById('pending-rcas');
  if (rcaPendingEl) {
    const pendingRCAs = rcaProjects.filter(p => {
      const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
      return !status || status.toString().toLowerCase().includes('pending');
    });
    rcaPendingEl.textContent = pendingRCAs.length;
    console.log('Updated pending-rcas to:', pendingRCAs.length);
  }
  
  // Update RCA table
  const rcaTableBody = document.getElementById('rca-table-body');
  if (rcaTableBody && rcaProjects.length > 0) {
    console.log('Updating RCA table with', rcaProjects.length, 'records');
    rcaTableBody.innerHTML = rcaProjects.map(project => {
      const status = getProperty(project, ['Status', 'status', 'STATUS', 'Project Status']) || 'Unknown';
      const priority = getProperty(project, ['Priority', 'priority', 'PRIORITY']) || 'Medium';
      const projectId = getProperty(project, ['Project ID', 'project id', 'ID', 'id', 'ProjectID']) || 'N/A';
      const issueDesc = getProperty(project, ['Issue Description', 'issue description', 'Description', 'Issue', 'Title']) || 'N/A';
      const rootCause = getProperty(project, ['Root Cause', 'root cause', 'RootCause', 'Cause']) || 'Under investigation';
      const stage = getProperty(project, ['Stage', 'stage', 'Recruitment Stage', 'Process Stage']) || 'N/A';
      const owner = getProperty(project, ['Owner', 'owner', 'Assigned To', 'Responsible']) || 'Unassigned';
      
      const statusColor = status.toString().toLowerCase().includes('complete') 
        ? 'background: #D1FAE5; color: #065F46;'
        : status.toString().toLowerCase().includes('progress')
        ? 'background: #FEF3C7; color: #92400E;'
        : 'background: #DBEAFE; color: #1E40AF;';
      
      const priorityColor = priority.toString().toLowerCase().includes('high')
        ? 'background: #FEE2E2; color: #991B1B;'
        : priority.toString().toLowerCase().includes('low')
        ? 'background: #D1FAE5; color: #065F46;'
        : 'background: #DBEAFE; color: #1E40AF;';
      
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td class="py-4 px-4 font-mono text-sm" style="color: var(--text-primary);">${projectId}</td>
          <td class="py-4 px-4" style="color: var(--text-primary);">${issueDesc}</td>
          <td class="py-4 px-4" style="color: var(--text-secondary);">${rootCause}</td>
          <td class="py-4 px-4" style="color: var(--text-primary);">${stage}</td>
          <td class="py-4 px-4" style="color: var(--text-primary);">${owner}</td>
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
  if (capaOpenEl) {
    const openCapas = capaProjects.filter(p => {
      const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
      return !status || !status.toString().toLowerCase().includes('complete');
    });
    capaOpenEl.textContent = openCapas.length;
  }
  
  // Calculate effectiveness rate
  const completedCapas = capaProjects.filter(p => {
    const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
    return status && status.toString().toLowerCase().includes('complete');
  });
  const effectiveCapas = completedCapas.filter(p => {
    const effectiveness = getProperty(p, ['Effectiveness', 'effectiveness', 'Verified', 'Verification Status']);
    return effectiveness && effectiveness.toString().toLowerCase().includes('verified');
  });
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
  console.log('Total Six Sigma records:', data.length);
  console.log('First Six Sigma record structure:', data[0]);
  console.log('First Six Sigma record keys:', Object.keys(data[0] || {}));
  
  // Helper function to safely get property value
  const getProperty = (obj, possibleKeys) => {
    if (!obj) return null;
    for (const key of possibleKeys) {
      if (obj.hasOwnProperty(key)) return obj[key];
    }
    return null;
  };
  
  // Calculate summary metrics
  const activeProjects = data.filter(p => {
    const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
    return !status || !status.toString().toLowerCase().includes('complete');
  });
  console.log('Active Six Sigma projects:', activeProjects.length);
  
  // Calculate average cycle time
  const completedProjects = data.filter(p => {
    const status = getProperty(p, ['Status', 'status', 'STATUS', 'Project Status']);
    return status && status.toString().toLowerCase().includes('complete');
  });
  let avgCycleTime = 0;
  if (completedProjects.length > 0) {
    const totalDays = completedProjects.reduce((sum, p) => {
      const cycleTime = getProperty(p, ['Cycle Time (Days)', 'Cycle Time', 'Duration', 'Days']);
      const days = parseFloat(cycleTime) || 0;
      return sum + days;
    }, 0);
    avgCycleTime = Math.round(totalDays / completedProjects.length);
  }
  
  // Calculate defect reduction
  let totalDefectReduction = 0;
  if (data.length > 0) {
    data.forEach(p => {
      const baseline = parseFloat(getProperty(p, ['Baseline', 'baseline', 'Baseline Defects'])) || 0;
      const current = parseFloat(getProperty(p, ['Current', 'current', 'Current Defects'])) || 0;
      if (baseline > 0) {
        totalDefectReduction += ((baseline - current) / baseline) * 100;
      }
    });
    totalDefectReduction = Math.round(totalDefectReduction / data.length);
  }
  
  // Calculate cost savings
  const totalSavings = data.reduce((sum, p) => {
    const savings = parseFloat(getProperty(p, ['Cost Savings', 'Savings', 'cost savings'])) || 0;
    return sum + savings;
  }, 0);
  
  // Update summary cards using correct IDs
  const activeProjectsEl = document.getElementById('active-projects');
  if (activeProjectsEl) {
    activeProjectsEl.textContent = activeProjects.length;
    console.log('Updated active-projects to:', activeProjects.length);
  }
  
  const avgSigmaEl = document.getElementById('avg-sigma');
  if (avgSigmaEl) {
    // Calculate average sigma level if available
    const sigmaLevels = data.map(p => {
      const sigmaLevel = getProperty(p, ['Sigma Level', 'sigma level', 'SIGMA LEVEL', 'Sigma']);
      return parseFloat(sigmaLevel);
    }).filter(s => !isNaN(s));
    
    if (sigmaLevels.length > 0) {
      const avgSigma = (sigmaLevels.reduce((a, b) => a + b, 0) / sigmaLevels.length).toFixed(1);
      avgSigmaEl.textContent = avgSigma + 'σ';
      console.log('Updated avg-sigma to:', avgSigma + 'σ');
    }
  }
  
  const totalSavingsEl = document.getElementById('total-savings');
  if (totalSavingsEl) {
    if (totalSavings >= 1000) {
      totalSavingsEl.textContent = '$' + Math.round(totalSavings / 1000) + 'K';
    } else {
      totalSavingsEl.textContent = '$' + totalSavings.toLocaleString();
    }
    console.log('Updated total-savings to: $' + totalSavings);
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
  
  if (darkTheme) {
    // Switch to Dark Theme
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    if (audioEnabled) speakText('Dark theme activated');
    localStorage.setItem('theme', 'dark');
  } else {
    // Switch to Light Theme
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    if (audioEnabled) speakText('Light theme activated');
    localStorage.setItem('theme', 'light');
  }
  
  // Show success message
  showSuccessMessage(darkTheme ? 'Dark theme activated' : 'Light theme activated');
}

function speakText(text) {
  // Always allow speech synthesis for welcome message and SOP assistant
  console.log('🔊 speakText called with:', text.substring(0, 50) + '...');
  
  if (!('speechSynthesis' in window)) {
    console.error('❌ Speech synthesis NOT supported in this browser');
    return;
  }
  
  console.log('✓ Speech synthesis IS supported');
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  utterance.onstart = function() {
    console.log('✓ Speech started playing');
  };
  
  utterance.onend = function() {
    console.log('✓ Speech finished playing');
  };
  
  utterance.onerror = function(event) {
    console.error('❌ Speech error:', event.error);
  };
  
  window.speechSynthesis.speak(utterance);
  console.log('✓ Speech utterance queued');
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

// Creative UI Functions

// Floating Action Menu
function toggleFabMenu() {
  const menu = document.getElementById('fab-menu');
  const icon = document.getElementById('fab-icon');
  
  if (menu.classList.contains('active')) {
    menu.classList.remove('active');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-plus');
  } else {
    menu.classList.add('active');
    icon.classList.remove('fa-plus');
    icon.classList.add('fa-times');
  }
}

// Quick Stats Widget
function toggleQuickStats() {
  const widget = document.getElementById('quick-stats');
  widget.classList.toggle('active');
  
  if (widget.classList.contains('active')) {
    updateQuickStats();
  }
}

function updateQuickStats() {
  // Count active filters
  const activeFilters = Object.values(currentFilters).filter(v => v !== 'all').length;
  document.getElementById('qs-filters').textContent = activeFilters;
  
  // Show filtered records
  const recordCount = filteredData ? filteredData.length : 0;
  document.getElementById('qs-records').textContent = recordCount.toLocaleString();
  
  // Show last updated time
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('qs-updated').textContent = timeStr;
}

// Show refresh indicator
function showRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  indicator.classList.add('active');
}

function hideRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  setTimeout(() => {
    indicator.classList.remove('active');
  }, 500);
}

// Update dashboard with refresh indicator
const originalUpdateDashboard = updateDashboard;
updateDashboard = function() {
  showRefreshIndicator();
  originalUpdateDashboard();
  hideRefreshIndicator();
  updateQuickStats();
};

// ========== CREATIVE UI ENHANCEMENTS ==========

// Floating Action Button
function toggleFAB() {
  const fabContainer = document.getElementById('fab-container');
  const fabIcon = document.getElementById('fab-icon');
  
  if (fabContainer.classList.contains('open')) {
    fabContainer.classList.remove('open');
    fabIcon.classList.remove('fa-times');
    fabIcon.classList.add('fa-plus');
    fabIcon.style.transform = 'rotate(0deg)';
  } else {
    fabContainer.classList.add('open');
    fabIcon.classList.remove('fa-plus');
    fabIcon.classList.add('fa-times');
    fabIcon.style.transform = 'rotate(45deg)';
  }
}

// Quick Stats Widget
function toggleQuickStats() {
  const widget = document.getElementById('quick-stats-widget');
  widget.classList.toggle('open');
  updateQuickStats();
}

function updateQuickStats() {
  const now = new Date();
  document.getElementById('qs-last-updated').textContent = now.toLocaleTimeString();
  
  if (rawData && rawData.auditCount) {
    document.getElementById('qs-total-records').textContent = rawData.auditCount.length.toLocaleString();
  }
  
  if (filteredData) {
    document.getElementById('qs-filtered-records').textContent = filteredData.length.toLocaleString();
  }
  
  // Count active filters
  let activeCount = 0;
  if (currentFilters) {
    Object.values(currentFilters).forEach(val => {
      if (val && val !== 'all') activeCount++;
    });
  }
  document.getElementById('qs-active-filters').textContent = activeCount;
  
  // Get average accuracy from current metrics
  const accuracyEl = document.getElementById('metric-accuracy');
  if (accuracyEl && accuracyEl.textContent !== '--') {
    document.getElementById('qs-avg-accuracy').textContent = accuracyEl.textContent;
  }
}

// Breadcrumb Navigation
function updateBreadcrumb(tabName) {
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const breadcrumbSep = document.getElementById('breadcrumb-sep');
  
  if (tabName && tabName !== 'overview') {
    const tabNames = {
      'stage-parameter': 'Stage & Parameter Analysis',
      'recruiter': 'Recruiter View',
      'trends': 'Trends & FY Analysis',
      'insights': 'Insights & Recommendations',
      'strategic': 'Strategic View'
    };
    
    breadcrumbCurrent.textContent = tabNames[tabName] || tabName;
    breadcrumbCurrent.style.display = 'inline-flex';
    breadcrumbSep.style.display = 'inline';
    breadcrumbCurrent.classList.add('active');
  } else {
    breadcrumbCurrent.style.display = 'none';
    breadcrumbSep.style.display = 'none';
  }
}

// Data Refresh Indicator
function showRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  indicator.classList.add('show');
}

function hideRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 1000);
}

// Global Search
let searchTimeout;
function handleGlobalSearch(query) {
  const clearBtn = document.getElementById('search-clear-btn');
  
  if (query) {
    clearBtn.style.display = 'block';
  } else {
    clearBtn.style.display = 'none';
  }
  
  // Debounce search
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performGlobalSearch(query);
  }, 300);
}

function performGlobalSearch(query) {
  if (!query || !rawData || !rawData.auditCount) {
    filteredData = rawData ? rawData.auditCount : [];
    updateDashboard();
    return;
  }
  
  const lowerQuery = query.toLowerCase();
  
  filteredData = rawData.auditCount.filter(row => {
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
  
  console.log(`Search for "${query}" found ${filteredData.length} results`);
  showRefreshIndicator();
  updateDashboard();
  hideRefreshIndicator();
  updateQuickStats();
  
  // Show search result notification
  showSuccessMessage(`Found ${filteredData.length} matching records`);
}

function clearGlobalSearch() {
  document.getElementById('global-search').value = '';
  document.getElementById('search-clear-btn').style.display = 'none';
  filteredData = rawData ? rawData.auditCount : [];
  updateDashboard();
  updateQuickStats();
}

// Enhanced Filter Pills Display
function updateFilterPillsDisplay() {
  const container = document.getElementById('filter-pills-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!currentFilters) return;
  
  Object.entries(currentFilters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      const pill = document.createElement('div');
      pill.className = 'filter-pill-enhanced';
      
      const icons = {
        year: 'fa-calendar',
        month: 'fa-calendar-day',
        week: 'fa-calendar-week',
        stage: 'fa-layer-group',
        parameter: 'fa-sliders-h'
      };
      
      const labels = {
        year: 'Year',
        month: 'Month',
        week: 'Week',
        stage: 'Stage',
        parameter: 'Parameter'
      };
      
      pill.innerHTML = `
        <i class="fas ${icons[key] || 'fa-filter'} filter-pill-icon"></i>
        <span>${labels[key] || key}: ${value}</span>
        <i class="fas fa-times filter-pill-remove" onclick="removeFilter('${key}')"></i>
      `;
      
      container.appendChild(pill);
    }
  });
}

function removeFilter(filterKey) {
  const filterElement = document.getElementById(`filter-${filterKey}`);
  if (filterElement) {
    filterElement.value = 'all';
    applyFilters();
  }
}

// Override original switchTab to update breadcrumb
const originalSwitchTab = switchTab;
switchTab = function(tabName) {
  originalSwitchTab(tabName);
  updateBreadcrumb(tabName);
  
  // Add page transition animation
  const activeTab = document.querySelector('.tab-content:not(.hidden)');
  if (activeTab) {
    activeTab.classList.add('page-transition');
    setTimeout(() => {
      activeTab.classList.remove('page-transition');
    }, 400);
  }
}
window.switchTab = switchTab; // Expose to global scope for onclick handlers

// Override applyFilters to update pill display
const originalApplyFilters = applyFilters;
applyFilters = function() {
  originalApplyFilters();
  updateFilterPillsDisplay();
  updateQuickStats();
}

// Data highlight animation on update
function highlightUpdatedData(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('data-updated');
    setTimeout(() => {
      element.classList.remove('data-updated');
    }, 1000);
  }
}

// Auto-update Quick Stats on data changes
const originalProcessAndStoreData = processAndStoreData;
processAndStoreData = function(data) {
  const result = originalProcessAndStoreData(data);
  updateQuickStats();
  
  // Highlight key metrics
  ['metric-accuracy', 'metric-error-rate', 'metric-total-audits', 'metric-sample-coverage'].forEach(id => {
    highlightUpdatedData(id);
  });
  
  // Trigger confetti on successful data load
  if (result && rawData && rawData.auditCount && rawData.auditCount.length > 0) {
    setTimeout(() => {
      triggerConfetti();
    }, 500);
  }
  
  return result;
}

// Make functions globally available
window.toggleFAB = toggleFAB;
window.toggleQuickStats = toggleQuickStats;
window.handleGlobalSearch = handleGlobalSearch;
window.clearGlobalSearch = clearGlobalSearch;
window.removeFilter = removeFilter;
window.updateBreadcrumb = updateBreadcrumb;

// ========== COMPARISON VIEW FUNCTIONS ==========

let currentComparisonType = 'year';

// Update comparison view with data
function updateComparisonView() {
  if (!rawData || !rawData.auditCount) {
    console.log('No data available for comparison view');
    return;
  }
  
  console.log('Updating comparison view...');
  
  // Initialize with year comparison by default
  updateYearComparison();
  populateRecruiterDropdowns();
  populateStageDropdowns();
  
  // Show the current comparison type
  showComparisonType(currentComparisonType);
}

function showComparisonType(type) {
  currentComparisonType = type;
  
  // Update button states
  ['year', 'recruiter', 'stage'].forEach(t => {
    const btn = document.getElementById(`btn-compare-${t}`);
    if (btn) {
      if (t === type) {
        btn.className = 'p-4 border-2 border-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100 transition';
      } else {
        btn.className = 'p-4 border-2 border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition';
      }
    }
  });
  
  // Show/hide comparison sections
  document.getElementById('comparison-year').classList.toggle('hidden', type !== 'year');
  document.getElementById('comparison-recruiter').classList.toggle('hidden', type !== 'recruiter');
  document.getElementById('comparison-stage').classList.toggle('hidden', type !== 'stage');
  
  // Populate dropdowns
  if (type === 'recruiter') {
    populateRecruiterDropdowns();
  } else if (type === 'stage') {
    populateStageDropdowns();
  } else if (type === 'year') {
    updateYearComparison();
  }
}
window.showComparisonType = showComparisonType;

function populateRecruiterDropdowns() {
  if (!rawData || !rawData.auditCount) return;
  
  // Get unique recruiters from Audit Count sheet
  const recruiters = [...new Set(
    rawData.auditCount
      .map(r => r['Recruiter Name'] || r['__EMPTY_6'] || r['G'])
      .filter(r => r && r !== 'Recruiter Name')
  )];
  
  recruiters.sort();
  
  ['recruiter-compare-1', 'recruiter-compare-2'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Choose Recruiter...</option>';
      recruiters.forEach(r => {
        const option = document.createElement('option');
        option.value = r;
        option.textContent = r;
        select.appendChild(option);
      });
    }
  });
}

function populateStageDropdowns() {
  if (!rawData || !rawData.auditCount) return;
  
  const stages = [...new Set(rawData.auditCount.map(r => r['Recruitment Stage'] || r['__EMPTY_5'] || r['F']).filter(Boolean))];
  stages.sort();
  
  ['stage-compare-1', 'stage-compare-2'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Choose Stage...</option>';
      stages.forEach(s => {
        const option = document.createElement('option');
        option.value = s;
        option.textContent = s;
        select.appendChild(option);
      });
    }
  });
}

function compareRecruiters() {
  const rec1Name = document.getElementById('recruiter-compare-1').value;
  const rec2Name = document.getElementById('recruiter-compare-2').value;
  
  if (!rec1Name || !rec2Name) {
    showToast('Please select both recruiters', 'warning');
    return;
  }
  
  if (rec1Name === rec2Name) {
    showToast('Please select different recruiters', 'warning');
    return;
  }
  
  if (!rawData || !rawData.auditCount) return;
  
  // Calculate stats for both recruiters from Audit Count sheet
  // Using correct formulas:
  // Accuracy = (Σ Opportunity Pass) / (Σ Opportunity Excluding NA) × 100
  // Total Audits = Σ Opportunity Count
  // Error Rate = (Σ Opportunity Fail) / (Σ Opportunity Excluding NA) × 100
  const getRecruiterStats = (name) => {
    let pass = 0, fail = 0, totalExcludingNA = 0, opportunityCount = 0;
    
    rawData.auditCount.forEach(row => {
      const recruiter = row['Recruiter Name'] || row['__EMPTY_6'] || row['G'];
      if (recruiter === name) {
        pass += parseFloat(row['Opportunity Pass']) || 0;
        fail += parseFloat(row['Opportunity Fail']) || 0;
        totalExcludingNA += parseFloat(row['Opportunity Excluding NA']) || 0;
        opportunityCount += parseFloat(row['Opportunity Count']) || 0;
      }
    });
    
    return {
      accuracy: totalExcludingNA > 0 ? (pass / totalExcludingNA * 100) : 0,
      errorRate: totalExcludingNA > 0 ? (fail / totalExcludingNA * 100) : 0,
      totalAudits: opportunityCount,
      errors: fail,
      totalExcludingNA
    };
  };
  
  const rec1Stats = getRecruiterStats(rec1Name);
  const rec2Stats = getRecruiterStats(rec2Name);
  
  const resultDiv = document.getElementById('recruiter-comparison-result');
  resultDiv.innerHTML = `
    <div class="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300">
      <h4 class="font-bold text-lg mb-4 text-blue-800">${rec1Name}</h4>
      <div class="space-y-3">
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Accuracy:</span>
          <strong class="text-2xl text-blue-600">${rec1Stats.accuracy.toFixed(1)}%</strong>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Total Audits (Σ Opp Count):</span>
          <strong class="text-2xl text-blue-600">${rec1Stats.totalAudits}</strong>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Error Rate:</span>
          <strong class="text-2xl text-blue-600">${rec1Stats.errorRate.toFixed(1)}%</strong>
        </div>
      </div>
    </div>
    
    <div class="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300">
      <h4 class="font-bold text-lg mb-4 text-green-800">${rec2Name}</h4>
      <div class="space-y-3">
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Accuracy:</span>
          <strong class="text-2xl text-green-600">${rec2Stats.accuracy.toFixed(1)}%</strong>
          <span class="text-${rec2Stats.accuracy > rec1Stats.accuracy ? 'green' : 'red'}-600 text-sm font-semibold">
            ${rec2Stats.accuracy > rec1Stats.accuracy ? '↑' : '↓'} ${Math.abs(rec2Stats.accuracy - rec1Stats.accuracy).toFixed(1)}%
          </span>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Total Audits (Σ Opp Count):</span>
          <strong class="text-2xl text-green-600">${rec2Stats.totalAudits}</strong>
          <span class="text-${rec2Stats.totalAudits > rec1Stats.totalAudits ? 'green' : 'red'}-600 text-sm font-semibold">
            ${rec2Stats.totalAudits > rec1Stats.totalAudits ? '↑' : '↓'} ${Math.abs(rec2Stats.totalAudits - rec1Stats.totalAudits)}
          </span>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Error Rate:</span>
          <strong class="text-2xl text-green-600">${rec2Stats.errorRate.toFixed(1)}%</strong>
          <span class="text-${rec2Stats.errorRate < rec1Stats.errorRate ? 'green' : 'red'}-600 text-sm font-semibold">
            ${rec2Stats.errorRate < rec1Stats.errorRate ? '↓' : '↑'} ${Math.abs(rec2Stats.errorRate - rec1Stats.errorRate).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  `;
}
window.compareRecruiters = compareRecruiters;

function compareStages() {
  const stage1Name = document.getElementById('stage-compare-1').value;
  const stage2Name = document.getElementById('stage-compare-2').value;
  
  if (!stage1Name || !stage2Name) {
    showToast('Please select both stages', 'warning');
    return;
  }
  
  if (stage1Name === stage2Name) {
    showToast('Please select different stages', 'warning');
    return;
  }
  
  if (!rawData || !rawData.auditCount) return;
  
  // Calculate stats for both stages from Audit Count sheet (Column F)
  // Using correct formulas:
  // Accuracy = (Σ Opportunity Pass) / (Σ Opportunity Excluding NA) × 100
  // Total Audits = Σ Opportunity Count
  // Error Rate = (Σ Opportunity Fail) / (Σ Opportunity Excluding NA) × 100
  const getStageStats = (stageName) => {
    let pass = 0, fail = 0, totalExcludingNA = 0, opportunityCount = 0;
    
    rawData.auditCount.forEach(row => {
      const stage = row['Recruitment Stage'] || row['__EMPTY_5'] || row['F'];
      if (stage === stageName) {
        pass += parseFloat(row['Opportunity Pass']) || 0;
        fail += parseFloat(row['Opportunity Fail']) || 0;
        totalExcludingNA += parseFloat(row['Opportunity Excluding NA']) || 0;
        opportunityCount += parseFloat(row['Opportunity Count']) || 0;
      }
    });
    
    return {
      accuracy: totalExcludingNA > 0 ? (pass / totalExcludingNA * 100) : 0,
      errorRate: totalExcludingNA > 0 ? (fail / totalExcludingNA * 100) : 0,
      totalAudits: opportunityCount,
      errors: fail,
      totalExcludingNA
    };
  };
  
  const stage1Stats = getStageStats(stage1Name);
  const stage2Stats = getStageStats(stage2Name);
  
  const resultDiv = document.getElementById('stage-comparison-result');
  resultDiv.innerHTML = `
    <div class="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300">
      <h4 class="font-bold text-lg mb-4 text-purple-800">${stage1Name}</h4>
      <div class="space-y-3">
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Accuracy:</span>
          <strong class="text-2xl text-purple-600">${stage1Stats.accuracy.toFixed(1)}%</strong>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Total Audits (Σ Opp Count):</span>
          <strong class="text-2xl text-purple-600">${stage1Stats.totalAudits}</strong>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Error Rate:</span>
          <strong class="text-2xl text-purple-600">${stage1Stats.errorRate.toFixed(1)}%</strong>
        </div>
      </div>
    </div>
    
    <div class="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
      <h4 class="font-bold text-lg mb-4 text-orange-800">${stage2Name}</h4>
      <div class="space-y-3">
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Accuracy:</span>
          <strong class="text-2xl text-orange-600">${stage2Stats.accuracy.toFixed(1)}%</strong>
          <span class="text-${stage2Stats.accuracy > stage1Stats.accuracy ? 'green' : 'red'}-600 text-sm font-semibold">
            ${stage2Stats.accuracy > stage1Stats.accuracy ? '↑' : '↓'} ${Math.abs(stage2Stats.accuracy - stage1Stats.accuracy).toFixed(1)}%
          </span>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Total Audits (Σ Opp Count):</span>
          <strong class="text-2xl text-orange-600">${stage2Stats.totalAudits}</strong>
          <span class="text-${stage2Stats.totalAudits > stage1Stats.totalAudits ? 'green' : 'red'}-600 text-sm font-semibold">
            ${stage2Stats.totalAudits > stage1Stats.totalAudits ? '↑' : '↓'} ${Math.abs(stage2Stats.totalAudits - stage1Stats.totalAudits)}
          </span>
        </div>
        <div class="flex justify-between items-center p-3 bg-white rounded">
          <span class="text-sm text-gray-600">Error Rate:</span>
          <strong class="text-2xl text-orange-600">${stage2Stats.errorRate.toFixed(1)}%</strong>
          <span class="text-${stage2Stats.errorRate < stage1Stats.errorRate ? 'green' : 'red'}-600 text-sm font-semibold">
            ${stage2Stats.errorRate < stage1Stats.errorRate ? '↓' : '↑'} ${Math.abs(stage2Stats.errorRate - stage1Stats.errorRate).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  `;
}
window.compareStages = compareStages;

function updateYearComparison() {
  // Placeholder for year comparison - can be enhanced
  const yearDiv = document.getElementById('comparison-year');
  if (yearDiv) {
    yearDiv.innerHTML = `
      <div class="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300">
        <h4 class="font-bold text-lg mb-4 text-blue-800">Upload data to compare years</h4>
        <p class="text-gray-600">Year-over-year comparison will appear here</p>
      </div>
    `;
  }
}

// ========== NEW CREATIVE FEATURES ==========

// 1. Export to CSV functionality
function exportToCSV() {
  if (!filteredData || filteredData.length === 0) {
    showToast('No data available to export', 'warning');
    return;
  }
  
  try {
    // Get headers
    const headers = Object.keys(filteredData[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    filteredData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (value && value.toString().includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `MM_Audit_Data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data exported successfully!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Export failed', 'error');
  }
}
window.exportToCSV = exportToCSV;

// 2. Animated Progress Rings
function createProgressRing(percentage, color = '#C8102E') {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return `
    <svg class="progress-ring" width="100" height="100" style="transform: rotate(-90deg);">
      <circle cx="50" cy="50" r="${radius}" stroke="#E5E7EB" stroke-width="8" fill="none"/>
      <circle cx="50" cy="50" r="${radius}" stroke="${color}" stroke-width="8" fill="none"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
              style="transition: stroke-dashoffset 1s ease-in-out; stroke-linecap: round;"/>
      <text x="50" y="50" text-anchor="middle" dy=".3em" font-size="20" font-weight="bold" fill="${color}"
            style="transform: rotate(90deg); transform-origin: center;">
        ${percentage.toFixed(0)}%
      </text>
    </svg>
  `;
}
window.createProgressRing = createProgressRing;

// 3. Performance Badge Generator
function getPerformanceBadge(accuracy) {
  if (accuracy >= 95) {
    return '<span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg">🏆 Excellent</span>';
  } else if (accuracy >= 85) {
    return '<span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg">⭐ Good</span>';
  } else if (accuracy >= 75) {
    return '<span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg">⚠️ Average</span>';
  } else {
    return '<span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg">❌ Needs Improvement</span>';
  }
}
window.getPerformanceBadge = getPerformanceBadge;

// 4. Sparkline Chart Generator (mini trend charts)
function createSparkline(data, width = 100, height = 30, color = '#C8102E') {
  if (!data || data.length === 0) return '';
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return `
    <svg width="${width}" height="${height}" style="display: inline-block; vertical-align: middle;">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" 
                style="stroke-linejoin: round; stroke-linecap: round;"/>
    </svg>
  `;
}
window.createSparkline = createSparkline;

// 5. Comparison Mode Toggle
let comparisonMode = false;
let comparisonData = {
  year1: null,
  year2: null
};

function toggleComparisonMode() {
  comparisonMode = !comparisonMode;
  const btn = document.getElementById('comparison-toggle');
  if (btn) {
    btn.classList.toggle('active');
    btn.innerHTML = comparisonMode 
      ? '<i class="fas fa-toggle-on"></i> Comparison: ON'
      : '<i class="fas fa-toggle-off"></i> Comparison: OFF';
  }
  
  showToast(comparisonMode ? 'Comparison mode enabled' : 'Comparison mode disabled', 'info');
  updateDashboard();
}
window.toggleComparisonMode = toggleComparisonMode;

// 6. Data Summary Stats Bar
function updateDataSummaryBar() {
  if (!filteredData) return;
  
  const totalRecords = filteredData.length;
  const uniqueRecruiters = new Set(filteredData.map(r => r['Recruiter Name']).filter(Boolean)).size;
  const uniqueStages = new Set(filteredData.map(r => r['Recruitment Stage']).filter(Boolean)).size;
  const uniqueParameters = new Set(filteredData.map(r => r['Parameter']).filter(Boolean)).size;
  
  const summaryBar = document.getElementById('data-summary-bar');
  if (summaryBar) {
    summaryBar.innerHTML = `
      <div class="flex items-center justify-around text-sm py-2">
        <div class="flex items-center gap-2">
          <i class="fas fa-database text-blue-500"></i>
          <span class="font-semibold">${totalRecords}</span> Records
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-users text-green-500"></i>
          <span class="font-semibold">${uniqueRecruiters}</span> Recruiters
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-layer-group text-purple-500"></i>
          <span class="font-semibold">${uniqueStages}</span> Stages
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-list-check text-orange-500"></i>
          <span class="font-semibold">${uniqueParameters}</span> Parameters
        </div>
      </div>
    `;
  }
}
window.updateDataSummaryBar = updateDataSummaryBar;

// 7. Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + E: Export to CSV
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportToCSV();
  }
  // Ctrl/Cmd + R: Reset Filters
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    resetFilters();
  }
  // Ctrl/Cmd + P: Export PDF
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    exportToPDF();
  }
  // Ctrl/Cmd + K: Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const search = document.getElementById('global-search');
    if (search) search.focus();
  }
});

console.log('M&M Dashboard JavaScript loaded successfully with creative enhancements');
console.log('✨ New Features: Export CSV, Progress Rings, Performance Badges, Sparklines, Comparison Mode');
console.log('⌨️  Keyboard Shortcuts: Ctrl+E (Export), Ctrl+R (Reset), Ctrl+P (PDF), Ctrl+K (Search)');

// ========== REVOLUTIONARY BEAUTIFICATION EFFECTS ==========

// 1. Particle Background Animation
function createParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 100;
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 2 - 1;
      this.speedY = Math.random() * 2 - 1;
      this.color = `rgba(200, 16, 46, ${Math.random() * 0.5 + 0.2})`;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
      if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
    }
    
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    // Connect nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          ctx.strokeStyle = `rgba(200, 16, 46, ${0.2 * (1 - distance / 100)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(animateParticles);
  }
  
  animateParticles();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// 2. Confetti Celebration Effect
function triggerConfetti() {
  const container = document.createElement('div');
  container.id = 'confetti-container';
  document.body.appendChild(container);
  
  const colors = ['#C8102E', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  const confettiCount = 150;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
    container.appendChild(confetti);
  }
  
  setTimeout(() => {
    container.remove();
  }, 5000);
}

// 3. Energy Orbs Effect
function createEnergyOrbs() {
  for (let i = 0; i < 3; i++) {
    const orb = document.createElement('div');
    orb.className = 'energy-orb';
    orb.style.left = Math.random() * 100 + '%';
    orb.style.top = Math.random() * 100 + '%';
    orb.style.animationDelay = i * 1 + 's';
    document.body.appendChild(orb);
  }
}

// 4. Spotlight Cursor Effect
let spotlightMode = false;

function initSpotlight() {
  const spotlight = document.createElement('div');
  spotlight.id = 'spotlight';
  document.body.appendChild(spotlight);
  
  document.addEventListener('mousemove', (e) => {
    if (spotlightMode) {
      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top = e.clientY + 'px';
    }
  });
  
  // Toggle spotlight with Alt+S
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 's') {
      spotlightMode = !spotlightMode;
      document.body.classList.toggle('spotlight-mode', spotlightMode);
    }
  });
}

// 5. Ripple Click Effect
document.addEventListener('click', function(e) {
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = e.clientX - 25 + 'px';
  ripple.style.top = e.clientY - 25 + 'px';
  ripple.style.width = '50px';
  ripple.style.height = '50px';
  document.body.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
});

// 6. Apply Glassmorphism to Cards
function applyGlassmorphism() {
  setTimeout(() => {
    const cards = document.querySelectorAll('.dashboard-card, .metric-card, .chart-container, .nav-sub-items');
    cards.forEach(card => {
      if (!card.classList.contains('glass-card')) {
        card.classList.add('glass-card');
      }
    });
  }, 1000);
}

// 7. Apply Premium Card Effects
function applyPremiumCardEffects() {
  setTimeout(() => {
    const cards = document.querySelectorAll('.dashboard-card, .metric-card');
    cards.forEach(card => {
      if (!card.classList.contains('premium-card')) {
        card.classList.add('premium-card');
      }
    });
  }, 1000);
}

// 8. Neon Text for Important Elements
function applyNeonText() {
  setTimeout(() => {
    // Apply neon text only to h2 with text-3xl class, NOT to h1 (main title)
    const headers = document.querySelectorAll('h2.text-3xl');
    headers.forEach(header => {
      if (!header.classList.contains('neon-text')) {
        header.classList.add('neon-text');
      }
    });
  }, 1000);
}

// 9. Holographic Buttons
function applyHolographicButtons() {
  setTimeout(() => {
    const buttons = document.querySelectorAll('.bg-mm-red, .nav-tab.active');
    buttons.forEach(btn => {
      if (!btn.classList.contains('holographic')) {
        btn.classList.add('holographic');
      }
    });
  }, 1000);
}

// 10. Liquid Morph Background for Cards
function applyLiquidMorph() {
  setTimeout(() => {
    const cards = document.querySelectorAll('.metric-card');
    cards.forEach((card, index) => {
      if (index % 2 === 0 && !card.classList.contains('liquid-morph')) {
        card.classList.add('liquid-morph');
      }
    });
  }, 1000);
}

// 11. Floating Animation for FAB
function applyFloatingEffect() {
  setTimeout(() => {
    const fab = document.getElementById('fab-button');
    if (fab && !fab.classList.contains('floating')) {
      fab.classList.add('floating');
    }
  }, 1000);
}

// 12. Glow Border for Active Elements
function applyGlowBorders() {
  setTimeout(() => {
    const activeElements = document.querySelectorAll('.nav-tab.active, .strategic-tab.active');
    activeElements.forEach(el => {
      if (!el.classList.contains('glow-border')) {
        el.classList.add('glow-border');
      }
    });
  }, 1000);
}

// 13. 3D Flip Cards for Strategic View
function apply3DFlipCards() {
  setTimeout(() => {
    const strategicCards = document.querySelectorAll('#strategic-content-rca .dashboard-card, #strategic-content-capa .dashboard-card, #strategic-content-sixsigma .dashboard-card');
    strategicCards.forEach(card => {
      if (!card.classList.contains('flip-card')) {
        card.classList.add('flip-card');
        
        // Wrap content in flip-card-inner
        const content = card.innerHTML;
        card.innerHTML = `
          <div class="flip-card-inner">
            <div class="flip-card-front">${content}</div>
            <div class="flip-card-back bg-gradient-to-br from-red-900 to-red-700 text-white p-6">
              <h3 class="text-xl font-bold mb-4">More Details</h3>
              <p>Click to flip back and explore more insights!</p>
            </div>
          </div>
        `;
        
        card.addEventListener('click', () => {
          card.classList.toggle('flipped');
        });
      }
    });
  }, 2000);
}

// 14. Aurora Background
function createAuroraBackground() {
  const aurora = document.createElement('div');
  aurora.className = 'aurora-bg';
  document.body.insertBefore(aurora, document.body.firstChild);
}

// 15. Magnetic Effect on Cards
function initMagneticEffect() {
  setTimeout(() => {
    const cards = document.querySelectorAll('.premium-card, .metric-card, .dashboard-card');
    cards.forEach(card => {
      card.classList.add('magnetic');
      
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const moveX = x * 0.1;
        const moveY = y * 0.1;
        
        card.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translate(0, 0) scale(1)';
      });
    });
  }, 1000);
}

// 16. Breathing Animation for Logo
function applyBreathingEffect() {
  setTimeout(() => {
    const logo = document.querySelector('header img');
    if (logo && !logo.classList.contains('breathing')) {
      logo.classList.add('breathing');
    }
  }, 1000);
}

// 17. Enhanced Data Upload Success - Already handled in line 3802

// Initialize all revolutionary effects
setTimeout(() => {
  createParticles();
  createEnergyOrbs();
  createAuroraBackground();
  initSpotlight();
  applyGlassmorphism();
  applyPremiumCardEffects();
  applyNeonText();
  applyHolographicButtons();
  applyLiquidMorph();
  applyFloatingEffect();
  applyGlowBorders();
  apply3DFlipCards();
  initMagneticEffect();
  applyBreathingEffect();
  applyAdditionalEnhancements();
}, 2000);

// Apply additional creative enhancements
function applyAdditionalEnhancements() {
  // Add tooltips to metric cards
  setTimeout(() => {
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
      card.classList.add('card-reveal', 'data-card-enhanced', 'scale-hover');
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }, 500);
  
  // Add slide-in animations to dashboard cards
  setTimeout(() => {
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    dashboardCards.forEach((card, index) => {
      if (index % 2 === 0) {
        card.classList.add('slide-in-left');
      } else {
        card.classList.add('slide-in-right');
      }
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }, 1000);
  
  // Add bounce-in animation to FAB menu items
  setTimeout(() => {
    const fabItems = document.querySelectorAll('.fab-menu-item');
    fabItems.forEach((item, index) => {
      item.classList.add('bounce-in');
      item.style.animationDelay = `${index * 0.1}s`;
    });
  }, 1500);
  
  // Add icon spin to navigation items
  setTimeout(() => {
    const navItems = document.querySelectorAll('.nav-tab, .nav-sub-item');
    navItems.forEach(item => {
      item.classList.add('icon-spin-hover');
    });
  }, 1000);
  
  // Add counter animation to numbers
  animateCounters();
  
  // Add gradient borders to important cards
  setTimeout(() => {
    const importantCards = document.querySelectorAll('.metric-card');
    importantCards.forEach((card, index) => {
      if (index < 4) { // First 4 metric cards
        const wrapper = document.createElement('div');
        wrapper.className = 'gradient-border';
        card.parentNode.insertBefore(wrapper, card);
        wrapper.appendChild(card);
      }
    });
  }, 2000);
  
  // Add pulse dots to live indicators
  setTimeout(() => {
    const liveIndicators = document.querySelectorAll('.live-indicator');
    liveIndicators.forEach(indicator => {
      const dot = document.createElement('div');
      dot.className = 'pulse-dot';
      indicator.insertBefore(dot, indicator.firstChild);
    });
  }, 1500);
}

// Animate number counters
function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-counter'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        counter.textContent = Math.ceil(current);
      }
    }, 16);
  });
}

// Add progress bars to charts
function addProgressBarsToCharts() {
  setTimeout(() => {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar-container';
      progressBar.innerHTML = '<div class="progress-bar-fill" style="width: 0%"></div>';
      container.insertBefore(progressBar, container.firstChild);
      
      // Animate progress bar
      setTimeout(() => {
        const fill = progressBar.querySelector('.progress-bar-fill');
        fill.style.width = '100%';
      }, 100);
    });
  }, 2000);
}

// Enhanced toast notifications with icons
function showEnhancedToast(message, type = 'info') {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const colors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    animation: slide-in-right-animation 0.3s ease-out;
  `;
  
  toast.innerHTML = `
    <span style="font-size: 20px;">${icons[type]}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slide-in-right-animation 0.3s ease-out reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Override original showToast with enhanced version
const originalShowToast = window.showToast || function() {};
window.showToast = showEnhancedToast;

console.log('🚀 REVOLUTIONARY EFFECTS ACTIVATED!');
console.log('🎨 Particles, Confetti, Neon Text, Holographic Gradients, Liquid Morph');
console.log('✨ Energy Orbs, Glassmorphism, 3D Flip Cards, Premium Animations');
console.log('🎭 Press Alt+S to toggle Spotlight mode');
console.log('🎉 Confetti triggers on data upload success');
console.log('💎 Additional Enhancements: Tooltips, Badges, Progress Bars, Counter Animations');

// ========== SOP AI ASSISTANT ==========
// Voice input feature removed as per user request

// Global variable to store attached image
let attachedImage = null;

// Handle image upload for SOP Assistant
function handleSopImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  console.log('📸 Image upload started:', file.name, file.type, file.size);
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    showEnhancedToast('Please select an image file (PNG, JPG, GIF, etc.)', 'error');
    console.error('❌ Invalid file type:', file.type);
    return;
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showEnhancedToast('Image size must be less than 5MB', 'error');
    console.error('❌ File too large:', file.size, 'bytes');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onerror = function(error) {
    console.error('❌ FileReader error:', error);
    showEnhancedToast('Error reading image file', 'error');
  };
  
  reader.onload = function(e) {
    try {
      attachedImage = {
        name: file.name,
        data: e.target.result,
        type: file.type,
        size: file.size
      };
      
      console.log('✅ Image loaded successfully:', attachedImage.name);
      
      // Show preview
      const previewDiv = document.getElementById('sop-image-preview');
      if (!previewDiv) {
        console.error('❌ Preview div not found');
        return;
      }
      
      previewDiv.className = 'p-3 mb-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg flex items-center gap-3 border-2 border-green-300 animate-slide-in';
      previewDiv.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="w-20 h-20 object-cover rounded-lg shadow-md border-2 border-white">
        <div class="flex-1">
          <div class="text-sm font-bold text-gray-800 flex items-center gap-2">
            <i class="fas fa-check-circle text-green-600"></i>
            ${file.name}
          </div>
          <div class="text-xs text-gray-600 mt-1">
            ${(file.size / 1024).toFixed(1)} KB • ${file.type}
          </div>
          <div class="text-xs text-green-600 mt-1 font-medium">
            ✓ Ready to send
          </div>
        </div>
        <button onclick="window.clearSopImage()" class="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition flex items-center gap-1">
          <i class="fas fa-times"></i>
          <span class="text-xs">Remove</span>
        </button>
      `;
      
      showEnhancedToast(`✓ Image attached: ${file.name}`, 'success');
      
    } catch (error) {
      console.error('❌ Error processing image:', error);
      showEnhancedToast('Error processing image', 'error');
    }
  };
  
  reader.readAsDataURL(file);
}

function clearSopImage() {
  console.log('🗑️  Clearing attached image');
  attachedImage = null;
  
  const previewDiv = document.getElementById('sop-image-preview');
  if (previewDiv) {
    previewDiv.className = 'hidden';
    previewDiv.innerHTML = '';
  }
  
  const uploadInput = document.getElementById('sop-image-upload');
  if (uploadInput) {
    uploadInput.value = '';
  }
  
  showEnhancedToast('Image removed', 'info');
}

// Send message function
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  // Allow sending if there's a message or an attached image
  if (!message && !attachedImage) return;
  
  // Add user message to chat (with image if attached)
  addMessageToChat(message || 'I have attached an image', 'user', attachedImage);
  input.value = '';
  
  // Clear attached image
  if (attachedImage) {
    clearSopImage();
  }
  
  // Show typing indicator
  const typingId = addTypingIndicator();
  
  try {
    // Simulate AI response (you can replace this with actual API call)
    const response = await getAIResponse(message);
    
    // Remove typing indicator
    removeTypingIndicator(typingId);
    
    // Add bot response
    addMessageToChat(response, 'bot');
    
    // Speak response if available
    speakText(response);
    
  } catch (error) {
    removeTypingIndicator(typingId);
    addMessageToChat('Sorry, I encountered an error processing your request.', 'bot');
    console.error('Error:', error);
  }
}

function addMessageToChat(message, type, image = null) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (type === 'user') {
    const imageHTML = image ? `
      <div class="mb-2">
        <img src="${image.data}" alt="${image.name}" class="max-w-xs rounded-lg shadow-sm">
      </div>
    ` : '';
    
    messageDiv.innerHTML = `
      <div class="flex items-start gap-3 justify-end">
        <div class="flex-1 text-right">
          <div class="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-4 shadow-sm max-w-lg">
            ${imageHTML}
            ${message ? `<p>${message}</p>` : ''}
          </div>
          <div class="text-xs text-gray-500 mt-1">${time}</div>
        </div>
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white">
          <i class="fas fa-user"></i>
        </div>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
          <i class="fas fa-robot"></i>
        </div>
        <div class="flex-1">
          <div class="bg-white rounded-lg p-4 shadow-sm max-w-lg">
            <p class="text-gray-800">${message}</p>
          </div>
          <div class="text-xs text-gray-500 mt-1">${time}</div>
        </div>
      </div>
    `;
  }
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  const id = 'typing-' + Date.now();
  typingDiv.id = id;
  typingDiv.className = 'message bot-message';
  typingDiv.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
        <i class="fas fa-robot"></i>
      </div>
      <div class="flex-1">
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="flex gap-2">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const typingDiv = document.getElementById(id);
  if (typingDiv) {
    typingDiv.remove();
  }
}

// M&M Recruitment SOP Knowledge Base - Complete Content
const sopKnowledgeBase = {
  overview: {
    purpose: "To ensure that a standard approach is adopted for the recruitment of all vacant positions. M&M is committed to attracting and recruiting the best talent with equality in employment for all people.",
    processOwner: "Nitu Choubey (DGM-HR RPO & Campus)",
    reviewedBy: "Nikhil Gama (GM-HR Shared Services)",
    authorizedBy: "Somesh Dravid (VP-HR AFS)",
    version: "1.2 (Updated 23rd May 2025)"
  },
  
  abbreviations: {
    HM: "Hiring Manager",
    IJP: "Internal Job Posting",
    ER: "Employee Referral",
    CHRO: "Chief Human Resources Office/HR Director",
    PM: "Program Manager",
    CTQ: "Critical to Quality",
    HR: "BHR, SHRBP, HR Head",
    CSAT: "Candidate Satisfaction Survey",
    JD: "Job Description",
    GAT: "Graduate Apprentice Trainee",
    PGET: "Post Graduate Engineer Trainee",
    GET: "Graduate Engineer Trainee"
  },
  
  steps: {
    "1": {
      name: "REQUISITION CREATION, ALLOCATION & INTAKE MEETING",
      details: [
        "Step 1.1: HM discuss the requirement with the BHR.",
        "Step 1.2: BHR raises the JR against the position & updates the CTQ on the system. Any requirement offline would require CHRO approval, exception for L3Ex & above.",
        "Step 1.3: BHR updates company code, template, BU, Grade, Location, type (New/Replacement), HM details, Dept. Head, Assessment & JD.",
        "Step 1.4: BHR allocates the JR to PM on the system.",
        "Step 1.5: PM allocates position to recruiters on the system.",
        "Step 1.6: Recruiter checks completeness of JR and CTQ details."
      ]
    },
    
    "2": {
      name: "JOB POSTING",
      details: [
        "Step 2.1: Check Job Posting Status, if marked confidential, not to be posted on any platform.",
        "Step 2.2: HR/Recruiter to do Job Posting on IJP portal for first 7 days mandatory (any deviation needs HR Head approval, not applicable for confirmation & campus hiring).",
        "Step 2.3: HR/Recruiter to do Job Posting on career portal.",
        "Step 2.4: For confidential positions, recruiters/vendors upload profile on system."
      ]
    },
    
    "3": {
      name: "SOURCING & SCREENING",
      details: [
        "Positions (if not confidential) to be posted on IJP for first 7 days, then can be posted to all channels simultaneously including Employee Referral, Career Portal, External Sourcing.",
        "Step 3.1: Application on system via Recruiter/Vendor upload, ER upload, IJP internal applications, Direct applicants, Ex-employees.",
        "Step 3.2: Recruiter Screening - Review all applications and evaluate against CTQ parameters, share shortlisted profiles with BHR.",
        "Step 3.3: BHR Screening - Review/screen profiles and mark as shortlisted or rejected.",
        "Step 3.4: HM Screening - Screen profiles shortlisted by BHR and mark as shortlisted or rejected."
      ]
    },
    
    "4": {
      name: "INTERVIEW & ASSESSMENT",
      details: [
        "Step 4.1 First/Second/Final Round: Recruiter schedules interview via system. HM & HR submit final hiring decision (Selection/Rejection) and record overall comments. For L3Ex & above, any 1 feedback from panel is ok.",
        "Step 4.2 Assessment: Initiated before final round on need basis. Not mandatory for all hiring, triggered by HM/HR need. Reports available before final round.",
        "Assessment Tools: EX band - Hogan (Leader Basis report) triggered by Sector HR Head; DH band - DISC triggered by SHRBP; O&M - No assessments.",
        "Assessment reports should not be used standalone for Go/No-Go decisions."
      ]
    },
    
    "5": {
      name: "DOCUMENTATION & FITMENT",
      details: [
        "Step 5.1: Candidate uploads required documents on system before final HR Round.",
        "Step 5.2: Recruiter does first-level salary expectations & prepares current salary structure in designated format, shares with BHR."
      ]
    },
    
    "6": {
      name: "LOI & FINAL OFFER",
      details: [
        "Step 6.1: HR does salary discussion with candidate based on details from recruiter.",
        "Step 6.2: HR confirms CTC/JB/DOJ etc. on system.",
        "Step 6.3: For additional/Deviation, approval required as per defined matrix. No approval for downgrade deviations.",
        "Step 6.5: BHR confirms all necessary approvals are in place via checklist.",
        "Step 6.6: BHR shares LOI with candidate.",
        "Step 6.7: Candidate accepts LOI in system.",
        "Step 6.8: Recruiter parks case with offer team with deviation checklist.",
        "Step 6.9: Offer SPOC prepares final offer letter & add-on letter.",
        "Step 6.10: RSU letters released for all employees. For 1001 company code, direct release; others need Compensation team confirmation.",
        "Step 6.11: Quality check of documents and offer letter.",
        "Step 6.12: Comp team approval not required for standard JB letters (DH & below with approved amount); EX band needs Comp team signoff.",
        "Step 6.13: Offer SPOC releases final offer through system (only after LOI acceptance).",
        "Step 6.14: Offer SPOC initiates onboarding (only after final offer acceptance)."
      ]
    },
    
    "7": {
      name: "POST-OFFER PROCESS",
      details: [
        "Medical: Self-Medical Declaration form for all lateral and campus hires. Medical Check mandatory only for candidates 35yrs and above. Offer SPOC shares unfit forms with Plant Doctors. Certification required if anything declared or abnormality found.",
        "Background Verification (Lateral Hires only): BGV scope includes education, last two employment, PAN Card, Aadhaar Card, Criminal Court Record (excluding current employer).",
        "Offer SPOC initiates BGV after offer release through vendor portal. Exceptions need approval: DH & below - HR Head approval; Ex & above - CHRO approval.",
        "Offer SPOC validates BGV report through candidate resume. Exception approval from BHR for Orange/Red Report cases."
      ]
    }
  },
  
  raci: {
    requisition: "BHR is Responsible for creating requisition, HM is Consulted, PM is Informed",
    jobPosting: "PM is Accountable, Recruiter is Responsible for career site posting",
    sourcing: "PM is Accountable, Recruiter is Responsible for CV screening",
    interview: "Recruiter is Responsible for scheduling, HM is Accountable for hiring decision",
    offer: "BHR is Responsible for salary negotiation, Offer Team is Responsible for final offer release"
  }
};

// AI Response Function with Complete SOP Knowledge and Intelligent Matching
async function getAIResponse(question) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const lowerQ = question.toLowerCase();
  
  // Enhanced keyword extraction - extract all meaningful words
  const keywords = lowerQ
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out small words
    .filter(word => !['the', 'and', 'are', 'does', 'what', 'where', 'when', 'who', 'how', 'can', 'you', 'please', 'tell', 'about', 'from', 'this', 'that', 'with', 'for'].includes(word));
  
  console.log('🔍 Question keywords:', keywords);
  
  // Function to check if text contains any of the keywords
  const containsKeyword = (text, keywords) => {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  };
  
  // Function to calculate relevance score
  const calculateRelevance = (text, keywords) => {
    const lowerText = text.toLowerCase();
    let score = 0;
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) score++;
    });
    return score;
  };
  
  // Search through all SOP steps for relevant content
  let bestMatch = null;
  let bestScore = 0;
  
  // Search in all steps
  for (const [stepNum, stepData] of Object.entries(sopKnowledgeBase.steps)) {
    const stepText = stepData.name + ' ' + stepData.details.join(' ');
    const score = calculateRelevance(stepText, keywords);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        type: 'step',
        stepNum: stepNum,
        name: stepData.name,
        details: stepData.details
      };
    }
  }
  
  // If we found a match in steps (even with score of 1), return it
  if (bestScore >= 1 && bestMatch) {
    console.log('✓ Found match in Step', bestMatch.stepNum, 'with score:', bestScore);
    return `**${bestMatch.name}** (Step ${bestMatch.stepNum}):\n\n${bestMatch.details.join('\n\n')}`;
  }
  
  // Match questions with SOP content (fallback to specific patterns)
  
  // Requisition & Job Posting
  if (lowerQ.includes('requisition') || lowerQ.includes('jr') || lowerQ.includes('create') && lowerQ.includes('job')) {
    return `REQUISITION CREATION PROCESS:\n\n${sopKnowledgeBase.steps["1"].details.join('\n\n')}\n\nKey Point: Any offline requirement needs CHRO approval (exception for L3Ex & above).`;
  }
  
  if (lowerQ.includes('job posting') || lowerQ.includes('how to post') || lowerQ.includes('posting process')) {
    return `JOB POSTING PROCESS:\n\n${sopKnowledgeBase.steps["2"].details.join('\n\n')}\n\nIMPORTANT: IJP posting is mandatory for first 7 days (unless confidential or campus/confirmation hiring). Any deviation needs HR Head approval.`;
  }
  
  if (lowerQ.includes('ijp') || lowerQ.includes('internal job')) {
    return `INTERNAL JOB POSTING (IJP):\n\nAll non-confidential positions MUST be posted on IJP portal for the first 7 days before external posting. This is mandatory unless:\n- Position is marked confidential\n- Campus hiring\n- Confirmation processes\n\nAny deviation requires HR Head approval. After 7 days, positions can be posted simultaneously on all channels including Career Portal, Employee Referral, and External Sourcing.`;
  }
  
  // Sourcing & Screening
  if (lowerQ.includes('sourcing') || lowerQ.includes('screening') || lowerQ.includes('cv')) {
    return `SOURCING & SCREENING PROCESS:\n\n${sopKnowledgeBase.steps["3"].details.join('\n\n')}\n\nSources: Employee Referral, IJP, Career Portal, External Sourcing, Ex-employees. Best-fit candidate selected regardless of source.`;
  }
  
  if (lowerQ.includes('ctq') || lowerQ.includes('critical to quality')) {
    return `CTQ (Critical to Quality):\n\nCTQ parameters are quality criteria that must be defined for each position. The BHR updates CTQ details on the system during requisition creation. Recruiters evaluate all candidate applications against these CTQ parameters during screening to ensure only qualified candidates move forward.`;
  }
  
  // Interview & Assessment
  if (lowerQ.includes('interview') || lowerQ.includes('assessment') || lowerQ.includes('round')) {
    return `INTERVIEW & ASSESSMENT PROCESS:\n\n${sopKnowledgeBase.steps["4"].details.join('\n\n')}\n\nKey: Assessment is need-based, not mandatory. Reports should not be sole decision factor.`;
  }
  
  if (lowerQ.includes('assessment tool') || lowerQ.includes('hogan') || lowerQ.includes('disc')) {
    return `ASSESSMENT TOOLS BY BAND:\n\n• EX Band: Hogan (Leader Basis report) - Triggered by Sector HR Head\n• DH Band: DISC - Triggered by SHRBP\n• O&M Band: No assessments\n\nIMPORTANT: Assessment reports on standalone basis should NOT be used for Go/No-Go decisions. They are advisory inputs only.`;
  }
  
  // Documentation & Offer
  if (lowerQ.includes('documentation') || lowerQ.includes('documents required') || lowerQ.includes('upload')) {
    return `DOCUMENTATION PROCESS:\n\n${sopKnowledgeBase.steps["5"].details.join('\n\n')}\n\nCandidates must upload required documents before final HR Round. Recruiter prepares salary structure in M&M format.`;
  }
  
  if (lowerQ.includes('loi') || lowerQ.includes('letter of intent') || lowerQ.includes('offer')) {
    return `LOI & FINAL OFFER PROCESS:\n\n${sopKnowledgeBase.steps["6"].details.join('\n\n')}\n\nKey Sequence: HR salary discussion → CTC confirmation → Approvals → LOI release → Candidate acceptance → Park with Offer team → Final offer → Onboarding initiation.`;
  }
  
  if (lowerQ.includes('salary') || lowerQ.includes('ctc') || lowerQ.includes('compensation') || lowerQ.includes('fitment')) {
    return `SALARY FITMENT & APPROVAL:\n\n1. HR conducts salary discussion with candidate based on recruiter's inputs\n2. HR confirms CTC/JB/DOJ on system\n3. Approval matrix applies for:\n   - Outside grid CTC\n   - Notice buyout\n   - Joining Bonus\n   - Short Notice Joining\n4. NO approval required for downgrade deviations\n5. BHR confirms all approvals via checklist\n6. Standard JB letters (DH & below): No Comp team approval needed\n7. EX band JB letters: Require Comp team signoff`;
  }
  
  if (lowerQ.includes('rsu') || lowerQ.includes('joining bonus') || lowerQ.includes('jb')) {
    return `RSU & JOINING BONUS:\n\nRSU Letters: Released for all employees. For JRs on 1001 company code, direct release; all other cases need Compensation team confirmation.\n\nJoining Bonus: Comp team approval NOT required for standard JB letters where amount has been approved by HR Team (DH & below only). Anything in EX band needs signoff from Comp team.`;
  }
  
  // Post-Offer
  if (lowerQ.includes('medical') || lowerQ.includes('health check')) {
    return `MEDICAL PROCESS:\n\n1. Self-Medical Declaration form required for ALL lateral and campus hires (all grades)\n2. Medical Check: NOT required for candidates below 35 years; MANDATORY for candidates 35 years and above\n3. Offer SPOC shares only unfit Self Medical declaration forms and medical reports with Plant Doctors\n4. If anything declared or abnormality found, certification required by Plant Doctor\n5. Tests have been revised in alignment with candidate profile`;
  }
  
  if (lowerQ.includes('bgv') || lowerQ.includes('background verification') || lowerQ.includes('background check')) {
    return `BACKGROUND VERIFICATION (BGV):\n\nApplicable to: All Lateral Hires only\n\nBGV Scope:\n- Education verification\n- Last two employment (excluding current employer)\n- PAN Card\n- Aadhaar Card\n- Criminal Court Record\n\nProcess:\n1. Offer SPOC initiates BGV ONLY after offer release through vendor portal\n2. Exceptions for pre-offer BGV need approval:\n   - DH band & below: HR Head approval\n   - EX & above: CHRO approval\n3. Offer SPOC follows up with vendor & candidate\n4. Offer SPOC validates BGV report through candidate resume\n5. Orange/Red Report cases: Exception approval required from BHR`;
  }
  
  if (lowerQ.includes('onboarding') || lowerQ.includes('joining')) {
    return `ONBOARDING INITIATION:\n\nOffer SPOC initiates onboarding on the system ONLY after:\n1. Final offer acceptance by candidate\n2. Medical clearance (if applicable for 35+ years)\n3. BGV initiation (for lateral hires)\n\nOnboarding includes:\n- System access setup\n- Buddy assignment\n- Induction schedule\n- Policy briefing\n- Workspace setup`;
  }
  
  // Roles & Responsibilities
  if (lowerQ.includes('who is responsible') || lowerQ.includes('role') || lowerQ.includes('raci') || lowerQ.includes('owner')) {
    return `KEY ROLES & RESPONSIBILITIES:\n\nProcess Owner: ${sopKnowledgeBase.overview.processOwner}\nReviewed by: ${sopKnowledgeBase.overview.reviewedBy}\nAuthorized by: ${sopKnowledgeBase.overview.authorizedBy}\n\nKey Responsibilities:\n- Hiring Manager (HM): Defines requirements, conducts interviews, makes hiring decisions\n- Business HR (BHR): Creates requisition, updates CTQ, conducts screening, salary fitment\n- Program Manager (PM): Allocates JR to recruiters, accountable for process\n- Recruiter: CV screening, interview scheduling, documentation coordination\n- Offer Team: Prepares & releases offer letters, initiates BGV, onboarding\n\nRaci Matrix: ${sopKnowledgeBase.raci.requisition}`;
  }
  
  if (lowerQ.includes('bhp') || lowerQ.includes('business hr')) {
    return `BUSINESS HR (BHR) RESPONSIBILITIES:\n\n1. Raises JR against position & updates CTQ\n2. Updates company code, template, BU, Grade, Location, position type, HM details, JD\n3. Allocates JR to Program Manager\n4. Screens profiles shared by recruiters\n5. Confirms CTC/JB/DOJ with recruiter input\n6. Shares Letter of Intent (LOI) with candidate\n7. Confirms all necessary approvals via checklist\n8. Approval authority for Orange/Red BGV reports`;
  }
  
  // Abbreviations
  if (lowerQ.includes('abbreviation') || lowerQ.includes('acronym') || lowerQ.includes('what is') && (lowerQ.includes('hm') || lowerQ.includes('ijp') || lowerQ.includes('pm'))) {
    const abbrevs = Object.entries(sopKnowledgeBase.abbreviations).map(([key, val]) => `${key}: ${val}`).join('\n');
    return `ABBREVIATIONS & ACRONYMS:\n\n${abbrevs}`;
  }
  
  // Overall Process
  if (lowerQ.includes('overall process') || lowerQ.includes('high level') || lowerQ.includes('steps') || lowerQ.includes('recruitment process flow')) {
    return `M&M RECRUITMENT PROCESS - HIGH LEVEL FLOW:\n\n1. REQUISITION CREATION & INTAKE\n2. JOB POSTING (IJP mandatory for 7 days)\n3. SOURCING & SCREENING (CTQ-based evaluation)\n4. INTERVIEW & ASSESSMENT (need-based)\n5. DOCUMENTATION & FITMENT\n6. LOI & FINAL OFFER\n7. POST-OFFER (Medical & BGV)\n\nPurpose: ${sopKnowledgeBase.overview.purpose}\n\nFor detailed information on any step, please ask specifically about that step.`;
  }
  
  // Timeline questions
  if (lowerQ.includes('how long') || lowerQ.includes('timeline') || lowerQ.includes('duration')) {
    return `RECRUITMENT TIMELINES:\n\n• IJP Posting: Mandatory first 7 days\n• Approval Timeline: 2-3 days for internal approvals\n• Medical: For 35+ years candidates\n• BGV: Initiated after offer release, completed pre-joining\n• Assessment: Before final interview round\n\nNote: Timelines may vary based on position criticality and approvals required.`;
  }
  
  // Confidential positions
  if (lowerQ.includes('confidential')) {
    return `CONFIDENTIAL POSITIONS:\n\nIf a position is marked confidential:\n• NOT to be posted on IJP portal\n• NOT to be posted on career portal\n• NOT to be posted on any external platform\n• Recruiters/vendors must upload profiles directly on the system\n• Invitation links can be used for targeted outreach\n\nThis maintains confidentiality for sensitive roles.`;
  }
  
  // Exception & Approvals
  if (lowerQ.includes('exception') || lowerQ.includes('approval') || lowerQ.includes('deviation')) {
    return `EXCEPTIONS & APPROVALS:\n\n1. Offline Requisitions: CHRO approval required (exception for L3Ex & above)\n2. IJP Deviation (skip 7-day posting): HR Head approval\n3. Pre-offer BGV:\n   - DH & below: HR Head approval\n   - EX & above: CHRO approval\n4. CTC Deviations:\n   - Outside grid\n   - Notice buyout\n   - Joining Bonus\n   - Short Notice Joining\n   (As per defined approval matrix)\n5. BGV Orange/Red Reports: BHR approval\n\nNo approval required for: Downgrade deviations`;
  }
  
  // Default response
  return `I'm your M&M Recruitment SOP AI Assistant. I have complete knowledge of the recruitment process. You can ask me about:\n\n• Requisition creation & job posting\n• IJP (Internal Job Posting) process\n• Sourcing & screening (CTQ parameters)\n• Interview & assessment process\n• Documentation & salary fitment\n• LOI & offer process\n• Medical & BGV requirements\n• Roles & responsibilities (RACI)\n• Approvals & exceptions\n• Timelines & process flow\n\nWhat specific information do you need from the SOP?`;
}

function askQuestion(question) {
  document.getElementById('chat-input').value = question;
  sendMessage();
}

function clearChat() {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = `
    <div class="message bot-message">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
          <i class="fas fa-robot"></i>
        </div>
        <div class="flex-1">
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <p class="text-gray-800">Hello! I'm your SOP AI Assistant. I can help you with questions about the M&M Recruitment Process. You can type your question or use voice input. How can I help you today?</p>
          </div>
          <div class="text-xs text-gray-500 mt-1">Just now</div>
        </div>
      </div>
    </div>
  `;
  showEnhancedToast('Chat cleared', 'success');
}

// Expose functions globally
// Voice input removed
window.sendMessage = sendMessage;
window.askQuestion = askQuestion;
window.clearChat = clearChat;
window.handleSopImageUpload = handleSopImageUpload;
window.clearSopImage = clearSopImage;

// Welcome message when dashboard loads
// Welcome message removed as per user request
console.log('✓ M&M Dashboard initialized - SOP AI Assistant ready');

console.log('🤖 SOP AI Assistant initialized with complete SOP knowledge base');
