/**
 * Main entry point for Digital Health Twin sync
 * Orchestrates fetching, mapping, deduplicating, and appending health data
 */

/**
 * Main sync function - call this via Apps Script trigger
 * Runs daily to pull latest health data and append to sheets
 */
function syncHealthData() {
  const startTime = new Date();
  const logger = createLogger('syncHealthData');
  
  try {
    logger.log('=== Starting Health Data Sync ===');
    logger.log('Sync started at: ' + startTime.toISOString());
    
    // 1. Fetch data from Google Fit
    logger.log('Fetching Google Fit data...');
    const fitData = fetchGoogleFitData();
    logger.log('Retrieved ' + Object.keys(fitData).length + ' metric types');
    
    if (Object.keys(fitData).length === 0) {
      logger.warn('No data returned from Google Fit API');
    }
    
    // 2. Get existing data for deduplication
    logger.log('Loading existing sheet data for deduplication...');
    const sheetData = loadAllSheetData();
    
    // 3. Process and append data by tab
    const results = {
      processed: 0,
      appended: 0,
      skipped: 0,
      errors: []
    };
    
    for (const [metricType, dataPoints] of Object.entries(fitData)) {
      try {
        logger.log(`Processing metric: ${metricType} (${dataPoints.length} points)`);
        
        const mapping = getMetricMapping(metricType);
        if (!mapping) {
          logger.warn(`No mapping found for metric: ${metricType}`);
          results.skipped += dataPoints.length;
          continue;
        }
        
        const tabName = mapping.tabName;
        logger.log(`  → Routing to tab: ${tabName}`);
        
        for (const dataPoint of dataPoints) {
          results.processed++;
          
          try {
            // Check for duplicates
            const isDuplicate = isDuplicateEntry(
              dataPoint,
              sheetData[tabName] || []
            );
            
            if (isDuplicate) {
              logger.log(`  ✓ Skipped duplicate: ${JSON.stringify(dataPoint)}`);
              results.skipped++;
              continue;
            }
            
            // Format and validate row
            const row = formatRowForSheet(dataPoint, mapping);
            if (!validateRow(row, mapping)) {
              logger.warn(`  ✗ Invalid row: ${JSON.stringify(row)}`);
              results.errors.push(`Invalid row for ${metricType}`);
              continue;
            }
            
            // Append to sheet
            appendRowToSheet(tabName, row);
            logger.log(`  ✓ Appended: ${JSON.stringify(row)}`);
            results.appended++;
            
          } catch (e) {
            logger.error(`Error processing data point: ${e.message}`);
            results.errors.push(`${metricType}: ${e.message}`);
          }
        }
        
      } catch (e) {
        logger.error(`Error processing metric ${metricType}: ${e.message}`);
        results.errors.push(`Metric ${metricType}: ${e.message}`);
      }
    }
    
    // 4. Log results
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    logger.log('=== Sync Completed ===');
    logger.log(`Duration: ${duration}s`);
    logger.log(`Processed: ${results.processed}`);
    logger.log(`Appended: ${results.appended}`);
    logger.log(`Skipped: ${results.skipped}`);
    logger.log(`Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      logger.error('Error details: ' + results.errors.join('; '));
    }
    
    // Write logs to sheet if configured
    if (CONFIG.LOG_SHEET_NAME) {
      saveExecutionLog({
        timestamp: startTime,
        duration: duration,
        results: results,
        logs: logger.getLogs()
      });
    }
    
    return results;
    
  } catch (error) {
    logger.error('Fatal error in syncHealthData: ' + error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Test connection to Google Fit API
 * Run manually to debug authentication issues
 */
function testGoogleFitConnection() {
  const logger = createLogger('testGoogleFitConnection');
  logger.log('Testing Google Fit API connection...');
  
  try {
    const response = PrivateScriptProperties.getProperty('test');
    logger.log('✓ Google Fit API accessible');
    
    // Try a simple query
    const data = fetchGoogleFitData();
    logger.log('✓ Retrieved ' + Object.keys(data).length + ' metric types');
    
    for (const [type, points] of Object.entries(data)) {
      logger.log(`  ${type}: ${points.length} data points`);
    }
    
    logger.log('✓ Connection test passed');
    return true;
    
  } catch (error) {
    logger.error('✗ Connection test failed: ' + error.message);
    return false;
  }
}

/**
 * Debug function: Show all data from Google Fit
 */
function debugGetFitData() {
  const logger = createLogger('debugGetFitData');
  const data = fetchGoogleFitData();
  
  logger.log('\n=== Google Fit Data Debug ===');
  for (const [metricType, points] of Object.entries(data)) {
    logger.log(`\n${metricType}:`);
    points.forEach((point, idx) => {
      if (idx < 5) {  // Show first 5 of each type
        logger.log(JSON.stringify(point, null, 2));
      }
    });
    if (points.length > 5) {
      logger.log(`... and ${points.length - 5} more`);
    }
  }
}

/**
 * Debug function: Show existing sheet data
 */
function debugGetSheetData() {
  const logger = createLogger('debugGetSheetData');
  const data = loadAllSheetData();
  
  logger.log('\n=== Existing Sheet Data Debug ===');
  for (const [tabName, rows] of Object.entries(data)) {
    logger.log(`\n${tabName}: ${rows.length} rows`);
    rows.slice(-5).forEach((row, idx) => {  // Show last 5 rows
      logger.log(JSON.stringify(row));
    });
  }
}

/**
 * Manual trigger for testing
 * Useful for running sync outside of scheduled triggers
 */
function manualSync() {
  syncHealthData();
}
