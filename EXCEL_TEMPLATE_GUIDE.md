# Excel Template Guide for M&M Recruitment Audit Dashboard

## 📋 Overview

This guide explains the required Excel file format for uploading data to the M&M Recruitment Process Audit Dashboard.

## 📁 Required Sheets

Your Excel file MUST contain the following sheets with exact names:

### 1. Audit Count (Main Data Sheet)

**Required Columns:**

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Client | Text | Client name | M&M |
| Financial Year | Text | FY identifier | FY23, FY24, FY25 |
| Month | Text | Month name | Apr, May, Jun, etc. |
| Month Number | Number | Month number (1-12) | 4 (for April) |
| Week | Text | Week identifier | Week 1, Week 2, etc. |
| Recruitment Stage | Text | Stage name | Pre-Sourcing, Intake, Screening, etc. |
| Parameter | Text | Parameter being audited | Intake Meeting form Completeness |
| Recruiter Name | Text | Full name of recruiter | John Doe |
| Program Manager | Text | PM identifier | PM1, PM2, PM3 |
| Req ID | Text | Requisition ID | REQ1001 |
| Total Population | Number | Total population count | 50 |
| Opportunity Count | Number | Total opportunities | 40 |
| Opportunity Pass | Number | Passed opportunities | 35 |
| Opportunity Fail | Number | Failed opportunities | 5 |
| Opportunity NA | Number | Not applicable count | 3 |
| Accuracy Score | Number (%) | Calculated accuracy | 87.50 |
| Error | Number (%) | Error rate | 12.50 |
| Sample Count | Number | Sample size audited | 30 |

**Valid Recruitment Stages:**
- Pre-Sourcing
- Intake
- Screening
- Assessment Interview
- OfferAPL
- Pre-Onboarding

**Common Parameters:**
- Intake Meeting form Completeness Correctness
- Candidate assessment sheet submission
- Completeness Correctness of CES
- Documents Check - Resume
- Documents Check - ID Proof
- Documents Check - Educational Certificates
- Documents Check - Previous Employment
- Offer Letter Accuracy
- Pre-Offer Documents check
- BGV Initiation
- Medical Test
- Joining Bonus / Notice Buyout
- Candidate Joining Date Correctness
- Onboarding Checklist

### 2. FY23 (Financial Year 23 Weekly Data)

**Required Columns:**

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Week | Number | Week number (1-52) | 1, 2, 3... |
| Total Opportunities | Number | Total opportunities in week | 120 |
| Accuracy Score | Number (%) | Weekly accuracy | 85.50 |
| Sample Size | Number | Sample count for week | 75 |

### 3. FY24 (Financial Year 24 Weekly Data)

**Required Columns:** Same as FY23 sheet

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Week | Number | Week number (1-52) | 1, 2, 3... |
| Total Opportunities | Number | Total opportunities in week | 150 |
| Accuracy Score | Number (%) | Weekly accuracy | 88.20 |
| Sample Size | Number | Sample count for week | 90 |

### 4. Recruiter Wise Data

**Required Columns:**

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Recruiter Name | Text | Full name of recruiter | Jane Smith |
| Accuracy Score | Number (%) | Overall accuracy | 90.50 |
| Error Count | Number | Total errors | 15 |
| Sample Count | Number | Total samples audited | 200 |
| Program Manager | Text | PM identifier | PM1 |

### 5. Sheet3 or Parameter Errors (Error Analysis)

**Required Columns:**

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Parameter | Text | Parameter name | BGV Initiation |
| Total Errors | Number | Total error count | 25 |
| Error Rate | Number (%) | Error percentage | 15.50 |
| [Recruiter Names] | Number | Errors per recruiter | 5 |

**Note:** Additional columns can contain individual recruiter error counts.

## 📊 Sample Data Structure

### Audit Count Example:

```
Client | Financial Year | Month | Recruitment Stage | Parameter | Recruiter Name | Total Population | Opportunity Count | Opportunity Pass | Opportunity Fail | Opportunity NA | Accuracy Score | Error | Sample Count
M&M | FY24 | Apr | Intake | Intake Meeting form | John Doe | 50 | 45 | 40 | 5 | 3 | 88.89 | 11.11 | 35
M&M | FY24 | Apr | Screening | Resume Check | Jane Smith | 60 | 55 | 52 | 3 | 2 | 94.55 | 5.45 | 40
M&M | FY24 | May | Assessment Interview | CES Completeness | Mike Johnson | 40 | 38 | 35 | 3 | 2 | 92.11 | 7.89 | 30
```

### FY23 Example:

```
Week | Total Opportunities | Accuracy Score | Sample Size
1 | 120 | 85.5 | 75
2 | 135 | 87.2 | 85
3 | 128 | 86.8 | 80
```

### Recruiter Wise Data Example:

```
Recruiter Name | Accuracy Score | Error Count | Sample Count | Program Manager
John Doe | 88.5 | 25 | 150 | PM1
Jane Smith | 92.3 | 15 | 180 | PM2
Mike Johnson | 85.7 | 30 | 120 | PM1
```

## ✅ Validation Rules

### Data Quality Requirements:

1. **No Empty Critical Columns**
   - Client, Financial Year, Month, Recruitment Stage, Parameter, Recruiter Name cannot be empty

2. **Numeric Validations**
   - All count fields must be >= 0
   - Accuracy Score and Error Rate should be between 0-100
   - Opportunity Count = Opportunity Pass + Opportunity Fail + Opportunity NA

3. **Consistency Checks**
   - Accuracy Score = (Opportunity Pass / (Opportunity Count - Opportunity NA)) × 100
   - Error Rate = (Opportunity Fail / (Opportunity Count - Opportunity NA)) × 100
   - Sample Count should not exceed Total Population

4. **Date/Period Validations**
   - Financial Year: FY23, FY24, or FY25
   - Month: Apr-Mar (financial year format)
   - Month Number: 1-12 (where Apr=1, May=2... Mar=12)
   - Week: 1-52

## 🚨 Common Errors and Solutions

### Error: "Missing required sheets"
**Solution:** Ensure your Excel file contains all required sheet names exactly:
- Audit Count
- FY23
- Recruiter Wise Data
- Sheet3 (or Parameter Errors)

### Error: "Invalid column names"
**Solution:** Check column names match exactly (case-sensitive):
- Use "Opportunity Pass" not "Opportunities Pass"
- Use "Accuracy Score" not "Accuracy %"

### Error: "Data validation failed"
**Solution:** 
- Check all numeric columns contain numbers, not text
- Ensure no negative values in count fields
- Verify percentages are between 0-100

### Error: "Calculation mismatch"
**Solution:**
- Recalculate Accuracy Score: = Pass / (Count - NA) × 100
- Recalculate Error Rate: = Fail / (Count - NA) × 100

## 📝 Best Practices

### Data Entry Guidelines:

1. **Consistent Naming**
   - Use same spelling for recruiter names throughout (avoid "John" vs "John Doe")
   - Standardize parameter names (avoid variations)
   - Use consistent client identifier (always "M&M")

2. **Date Management**
   - Follow financial year calendar (Apr-Mar)
   - Number weeks sequentially within FY
   - Use 3-letter month abbreviations (Apr, May, Jun)

3. **Data Completeness**
   - Fill all required fields
   - Use 0 instead of blank for zero values
   - Mark truly not-applicable items as NA count

4. **Regular Updates**
   - Update weekly data sheets (FY23, FY24) regularly
   - Keep recruiter-wise data synchronized
   - Refresh error analysis monthly

## 🔧 Excel Formula Examples

### Calculate Accuracy Score:
```excel
=IF((C2-E2)>0, (D2/(C2-E2))*100, 0)
```
Where:
- C2 = Opportunity Count
- D2 = Opportunity Pass
- E2 = Opportunity NA

### Calculate Error Rate:
```excel
=IF((C2-F2)>0, (E2/(C2-F2))*100, 0)
```
Where:
- C2 = Opportunity Count
- E2 = Opportunity Fail
- F2 = Opportunity NA

### Calculate Sample Coverage:
```excel
=(G2/B2)*100
```
Where:
- G2 = Sample Count
- B2 = Total Population

## 📤 Upload Process

1. **Prepare File**
   - Save as .xlsx format (Excel 2007+)
   - Verify all sheets present
   - Check data quality

2. **Upload to Dashboard**
   - Click "Upload Excel" button
   - Select your prepared file
   - Wait for validation

3. **Validation Feedback**
   - Green success message = data loaded
   - Red error banner = validation failed
   - Review error message for details

4. **Verify Data**
   - Check key metrics populated
   - Test filters
   - Review charts for accuracy

## 💾 Template Download

A sample Excel template is available with pre-formatted sheets and sample data. Contact your administrator for the template file.

## 🆘 Support

For assistance with Excel file preparation:
- Contact: Dashboard Admin Team
- Email: support@example.com
- Documentation: See main README.md

---

**Last Updated:** December 26, 2024
