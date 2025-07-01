const fs = require('fs');
const path = require('path');

/**
 * Format AppProfiling data as a GitHub comment
 * @param {string} profilingDataPath - Path to the profiling data JSON file
 * @returns {string} Formatted GitHub comment
 */
function formatProfilingComment(profilingDataPath) {
  try {
    // Read the profiling data
    const profilingData = JSON.parse(fs.readFileSync(profilingDataPath, 'utf8'));
    
    const { metadata, data, currentSession } = profilingData;
    const appData = data['io.metamask.qa'];
    
    if (!appData) {
      throw new Error('No app data found in profiling results');
    }
    
    // Build the GitHub comment
    let comment = '## 📊 AppProfiling Metrics :chart_with_upwards_trend:\n\n';
    
    // Session information
    comment += `**Session ID:** \`${currentSession.sessionId}\`\n`;
    comment += `**BrowserStack Session:** [View Session](https://app-automate.browserstack.com/builds/${currentSession.buildId}/sessions/${currentSession.sessionId})\n\n`;
    
    // Device information
    comment += `**Device:** ${metadata.device} (${metadata.os_version})\n`;
    comment += `**Test Date:** ${new Date(metadata.created_at).toLocaleString()}\n\n`;
    
    // Detected Issues
    if (appData.detected_issues && appData.detected_issues.length > 0) {
      comment += '### ⚠️ Detected Issues\n\n';
      
      appData.detected_issues.forEach((issue, index) => {
        const emoji = issue.type === 'error' ? '🔴' : '🟡';
        comment += `${emoji} **${issue.title}**\n`;
        comment += `   - ${issue.subtitle}\n`;
        comment += `   - Current: ${issue.current} ${issue.unit}\n`;
        comment += `   - Recommended: ${issue.recommended} ${issue.unit}\n`;
        comment += `   - [Learn More](${issue.link})\n\n`;
      });
    } else {
      comment += '### ✅ No Issues Detected\n\n';
    }
    
    // Performance Metrics
    comment += '### 📈 Performance Metrics\n\n';
    
    const metrics = appData.metrics;
    const units = data.units;
    
    // App Size
    comment += `**App Size:** ${metrics.app_size} ${units.app_size}\n\n`;
    
    // CPU Usage
    comment += `**CPU Usage:**\n`;
    comment += `   - Average: ${metrics.cpu.avg}${units.cpu}\n`;
    comment += `   - Maximum: ${metrics.cpu.max}${units.cpu}\n\n`;
    
    // Memory Usage
    comment += `**Memory Usage:**\n`;
    comment += `   - Average: ${metrics.mem.avg} ${units.mem}\n`;
    comment += `   - Maximum: ${metrics.mem.max} ${units.mem}\n\n`;
    
    // Battery Usage
    if (metrics.batt.total_batt_usage_pct !== null) {
      comment += `**Battery Usage:** ${metrics.batt.total_batt_usage_pct}%\n\n`;
    }
    
    // Disk I/O
    comment += `**Disk I/O:**\n`;
    comment += `   - Total Reads: ${metrics.diskio.total_reads} ${units.diskio}\n`;
    comment += `   - Total Writes: ${metrics.diskio.total_writes} ${units.diskio}\n\n`;
    
    // Network I/O
    comment += `**Network I/O:**\n`;
    comment += `   - Total Upload: ${metrics.networkio.total_upload} ${units.networkio}\n`;
    comment += `   - Total Download: ${metrics.networkio.total_download} ${units.networkio}\n\n`;
    
    // UI Rendering
    comment += `**UI Rendering:**\n`;
    comment += `   - Slow Frames: ${metrics.ui_rendering.slow_frames_pct}%\n`;
    comment += `   - Frozen Frames: ${metrics.ui_rendering.frozen_frames_pct}%\n`;
    comment += `   - ANRs: ${metrics.ui_rendering.num_anrs}\n\n`;
    
    // Screen Load Times
    if (metrics.screen_load.activity_load_time && metrics.screen_load.activity_load_time.length > 0) {
      comment += `**Screen Load Times:**\n`;
      metrics.screen_load.activity_load_time.forEach(activity => {
        activity.load_time_data.forEach(loadTime => {
          comment += `   - ${activity.name}: ${loadTime.load_time} ${units.screen_load}\n`;
        });
      });
      comment += '\n';
    }
    
    // Additional Links
    comment += '### 🔗 Detailed Reports\n\n';
    comment += `- [CPU Usage Data](${metrics.cpu.cpu_usage_data})\n`;
    comment += `- [Memory Usage Data](${metrics.mem.mem_usage_data})\n`;
    comment += `- [Battery Usage Data](${metrics.batt.batt_usage_data})\n`;
    comment += `- [Disk Usage Data](${metrics.diskio.disk_usage_data})\n`;
    comment += `- [Network Usage Data](${metrics.networkio.network_usage_data})\n`;
    comment += `- [FPS Data](${metrics.ui_rendering.fps_data})\n`;
    
    return comment;
    
  } catch (error) {
    console.error('Error formatting profiling comment:', error);
    return `## ❌ Error Formatting AppProfiling Data\n\nError: ${error.message}`;
  }
}

/**
 * Find the most recent profiling data file
 * @param {string} reportsDir - Reports directory path
 * @returns {string|null} Path to the most recent profiling file or null
 */
function findLatestProfilingFile(reportsDir = './wdio/reports') {
  try {
    if (!fs.existsSync(reportsDir)) {
      return null;
    }
    
    const files = fs.readdirSync(reportsDir)
      .filter(file => file.startsWith('profiling-data-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(reportsDir, file),
        mtime: fs.statSync(path.join(reportsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    return files.length > 0 ? files[0].path : null;
  } catch (error) {
    console.error('Error finding latest profiling file:', error);
    return null;
  }
}

/**
 * Main function to generate and output the comment
 */
function main() {
  const args = process.argv.slice(2);
  let profilingDataPath;
  
  if (args.length > 0) {
    profilingDataPath = args[0];
  } else {
    profilingDataPath = findLatestProfilingFile();
  }
  
  if (!profilingDataPath) {
    console.error('No profiling data file found. Please specify a path or ensure profiling data exists.');
    process.exit(1);
  }
  
  if (!fs.existsSync(profilingDataPath)) {
    console.error(`Profiling data file not found: ${profilingDataPath}`);
    process.exit(1);
  }
  
  const comment = formatProfilingComment(profilingDataPath);
  console.log(comment);
}

/**
 * Format multiple profiling files as a combined GitHub comment with separate sections
 * @param {string} reportsDir - Reports directory path
 * @returns {string} Formatted GitHub comment for multiple files
 */
function formatMultipleProfilingFiles(reportsDir = './wdio/reports') {
  try {
    const files = fs.readdirSync(reportsDir)
      .filter(file => file.startsWith('profiling-data-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(reportsDir, file),
        mtime: fs.statSync(path.join(reportsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    if (files.length === 0) {
      return '## ❌ No AppProfiling Data Available\n\nNo profiling data was collected during this test run.';
    }
    
    if (files.length === 1) {
      return formatProfilingComment(files[0].path);
    }
    
    // Multiple files - create a comprehensive comment with sections for each session
    let comment = '## 📊 AppProfiling Metrics Summary :chart_with_upwards_trend:\n\n';
    comment += `**Total Sessions:** ${files.length}\n\n`;
    
    // Process each file and create a section for each session
    files.forEach((file, index) => {
      try {
        const data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        const { metadata, data: profilingData, currentSession } = data;
        
        // Debug: Log the structure of the data
        console.log(`Processing file: ${file.name}`);
        console.log('Data keys:', Object.keys(data));
        console.log('Profiling data keys:', Object.keys(profilingData || {}));
        
        const appData = profilingData?.['io.metamask.qa'];
        
        if (!appData) {
          console.log('No app data found, available keys:', Object.keys(profilingData || {}));
          comment += `### ❌ Session ${index + 1}: Error Processing Data\n\n`;
          comment += `**File:** ${file.name}\n`;
          comment += `**Session ID:** ${currentSession?.sessionId || 'unknown'}\n`;
          comment += `**Device:** ${metadata?.device || 'unknown'}\n`;
          comment += `**Error:** No app data found in profiling results\n`;
          comment += `**Available data keys:** ${Object.keys(profilingData || {}).join(', ')}\n\n`;
          comment += '---\n\n';
          return;
        }
        
        console.log('App data keys:', Object.keys(appData));
        console.log('Metrics keys:', Object.keys(appData.metrics || {}));
        
        // Create section header for this session
        comment += `### 📱 Session ${index + 1}: ${metadata.device} (${metadata.os_version})\n\n`;
        
        // Session information
        comment += `**Session ID:** \`${currentSession.sessionId}\`\n`;
        comment += `**BrowserStack Session:** [View Session](https://app-automate.browserstack.com/builds/${currentSession.buildId}/sessions/${currentSession.sessionId})\n`;
        comment += `**Test Date:** ${new Date(metadata.created_at).toLocaleString()}\n\n`;
        
        // Detected Issues
        if (appData.detected_issues && appData.detected_issues.length > 0) {
          comment += '**⚠️ Detected Issues:**\n';
          appData.detected_issues.forEach((issue, issueIndex) => {
            const emoji = issue.type === 'error' ? '🔴' : '🟡';
            comment += `${emoji} **${issue.title}** - ${issue.subtitle} (Current: ${issue.current} ${issue.unit}, Recommended: ${issue.recommended} ${issue.unit})\n`;
          });
          comment += '\n';
        } else {
          comment += '**✅ No Issues Detected**\n\n';
        }
        
        // Performance Metrics
        const metrics = appData.metrics || {};
        const units = data.units || {};
        
        comment += '**📈 Performance Metrics:**\n';
        
        // CPU Usage (if available)
        if (metrics.cpu && metrics.cpu.avg !== undefined && metrics.cpu.max !== undefined) {
          comment += `   • CPU: ${metrics.cpu.avg}${units.cpu || '%'} avg, ${metrics.cpu.max}${units.cpu || '%'} max\n`;
        }
        
        // Memory Usage (if available)
        if (metrics.mem && metrics.mem.avg !== undefined && metrics.mem.max !== undefined) {
          comment += `   • Memory: ${metrics.mem.avg} ${units.mem || 'MB'} avg, ${metrics.mem.max} ${units.mem || 'MB'} max\n`;
        }
        
        // Battery Usage (if available)
        if (metrics.batt && metrics.batt.total_batt_usage_pct !== null && metrics.batt.total_batt_usage_pct !== undefined) {
          comment += `   • Battery: ${metrics.batt.total_batt_usage_pct}%\n`;
        }
        
        // UI Rendering (if available)
        if (metrics.ui_rendering) {
          if (metrics.ui_rendering.slow_frames_pct !== undefined) {
            comment += `   • Slow Frames: ${metrics.ui_rendering.slow_frames_pct}%\n`;
          }
          if (metrics.ui_rendering.frozen_frames_pct !== undefined) {
            comment += `   • Frozen Frames: ${metrics.ui_rendering.frozen_frames_pct}%\n`;
          }
          if (metrics.ui_rendering.num_anrs !== undefined) {
            comment += `   • ANRs: ${metrics.ui_rendering.num_anrs}\n`;
          }
        }
        
        // Disk I/O (if available)
        if (metrics.diskio && metrics.diskio.total_reads !== undefined && metrics.diskio.total_writes !== undefined) {
          comment += `   • Disk I/O: ${metrics.diskio.total_reads} ${units.diskio || 'KB'} reads, ${metrics.diskio.total_writes} ${units.diskio || 'KB'} writes\n`;
        }
        
        // Network I/O (if available)
        if (metrics.networkio && metrics.networkio.total_upload !== undefined && metrics.networkio.total_download !== undefined) {
          comment += `   • Network I/O: ${metrics.networkio.total_upload} ${units.networkio || 'KB'} upload, ${metrics.networkio.total_download} ${units.networkio || 'KB'} download\n`;
        }
        
        comment += '\n';
        
        // Add separator between sessions
        if (index < files.length - 1) {
          comment += '---\n\n';
        }
        
      } catch (error) {
        console.warn(`Error processing file ${file.path}:`, error.message);
        comment += `### ❌ Session ${index + 1}: Error Processing Data\n\n`;
        comment += `**File:** ${file.name}\n`;
        comment += `**Error:** ${error.message}\n\n`;
        if (index < files.length - 1) {
          comment += '---\n\n';
        }
      }
    });
    
    return comment;
    
  } catch (error) {
    console.error('Error formatting multiple profiling files:', error);
    return `## ❌ Error Processing AppProfiling Data\n\nError: ${error.message}`;
  }
}

// Export for use in other modules
module.exports = {
  formatProfilingComment,
  findLatestProfilingFile,
  formatMultipleProfilingFiles
};

// Run if called directly
if (require.main === module) {
  main();
} 