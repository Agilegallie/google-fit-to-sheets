/**
 * Google Sheets API integration
 * Handles reading, writing, and managing sheet data
 */

/**
 * Load all existing sheet data for deduplication
 */
function loadAllSheetData() {
  validateConfig();
  const logger = createLogger('loadAllSheetData');
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetData = {};
  
  try {
    const sheets = ss.getSheets();
    
    for (const sheet of sheets) {
      const sheetName = sheet.getName();
      
      // Skip log sheet
      if (sheetName === CONFIG.LOG_SHEET_NAME) {
        continue;
      }
      
      try {
        const range = sheet.getDataRange();
        const values = range.getValues();
        
        if (values.length > 1) {
          sheetData[sheetName] = values.slice(1).map((row, idx) => ({
            index: idx + 2,
            data: row
          }));
          logger.log(`Loaded ${sheetData[sheetName].length} rows from "${sheetName}"`);
        } else {
          sheetData[sheetName] = [];
        }
        
      } catch (e) {
        logger.warn(`Error loading sheet "${sheetName}": ${e.message}`);
      }
    }
    
    return sheetData;
    
  } catch (error) {
    logger.error('Error in loadAllSheetData: ' + error.message);
    return {};
  }
}

/**
 * Append a row to the specified sheet
 */
function appendRowToSheet(tabName, row) {
  validateConfig();
  const logger = createLogger('appendRowToSheet');
  
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tabName);
    
    if (!sheet) {
      throw new Error(`Sheet "${tabName}" not found`);
    }
    
    sheet.appendRow(row);
    logger.log(`Appended row to "${tabName}"`);
    
    return true;
    
  } catch (error) {
    logger.error(`Error appending row to "${tabName}": ${error.message}`);
    throw error;
  }
}

/**
 * Check if a data point already exists in sheet (deduplication)
 */
function isDuplicateEntry(dataPoint, existingRows) {
  const logger = createLogger('isDuplicateEntry');
  
  for (const row of existingRows) {
    const rowData = row.data;
    
    // Compare timestamps (within 1 second tolerance)
    const rowDate = parseDate(rowData[0]);
    const timeDiff = Math.abs(rowDate.getTime() - dataPoint.date.getTime());
    
    if (timeDiff < 1000) {
      logger.log(`Found duplicate entry for ${dataPoint.date.toISOString()}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Find duplicate row index by timestamp and data
 */
function findDuplicateRow(dataPoint, existingRows) {
  for (const row of existingRows) {
    const rowDate = parseDate(row.data[0]);
    const timeDiff = Math.abs(rowDate.getTime() - dataPoint.date.getTime());
    
    if (timeDiff < 1000) {
      return row.index;
    }
  }
  return null;
}

/**
 * Update existing row in sheet
 */
function updateRowInSheet(tabName, rowIndex, values) {
  validateConfig();
  const logger = createLogger('updateRowInSheet');
  
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tabName);
    
    if (!sheet) {
      throw new Error(`Sheet "${tabName}" not found`);
    }
    
    const range = sheet.getRange(rowIndex, 1, 1, values.length);
    range.setValues([values]);
    logger.log(`Updated row ${rowIndex} in "${tabName}"`);
    
    return true;
    
  } catch (error) {
    logger.error(`Error updating row ${rowIndex} in "${tabName}": ${error.message}`);
    throw error;
  }
}

/**
 * Create or get the log sheet
 */
function getOrCreateLogSheet() {
  validateConfig();
  
  if (!CONFIG.LOG_SHEET_NAME) {
    return null;
  }
  
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Duration (s)', 'Processed', 'Appended', 'Skipped', 'Errors', 'Error Details']);
  }
  
  return sheet;
}

/**
 * Save execution log to sheet
 */
function saveExecutionLog(logData) {
  try {
    const sheet = getOrCreateLogSheet();
    if (!sheet) return;
    
    sheet.appendRow([
      logData.timestamp.toLocaleString(),
      logData.duration.toFixed(2),
      logData.results.processed,
      logData.results.appended,
      logData.results.skipped,
      logData.results.errors.length,
      logData.results.errors.join('; ')
    ]);
    
  } catch (error) {
    console.error('Error saving execution log: ' + error.message);
  }
}
