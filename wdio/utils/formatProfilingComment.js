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
 * Format multiple profiling files as a combined GitHub comment
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
    
    // Multiple files - create a summary
    let comment = '## 📊 AppProfiling Metrics Summary :chart_with_upwards_trend:\n\n';
    comment += `**Total Sessions:** ${files.length}\n\n`;
    
    // Show the most recent session in detail
    comment += '### 🆕 Latest Session Details\n\n';
    comment += formatProfilingComment(files[0].path).replace('## 📊 AppProfiling Metrics :chart_with_upwards_trend:\n\n', '');
    
    // Show summary of all sessions
    comment += '\n### 📋 All Sessions Summary\n\n';
    comment += '| Session ID | Device | Date | Issues |\n';
    comment += '|------------|--------|------|--------|\n';
    
    files.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        const { metadata, data: profilingData, currentSession } = data;
        const appData = profilingData['io.metamask.qa'];
        const issueCount = appData?.detected_issues?.length || 0;
        const date = new Date(metadata.created_at).toLocaleDateString();
        
        comment += `| \`${currentSession.sessionId.substring(0, 8)}...\` | ${metadata.device} | ${date} | ${issueCount} issue${issueCount !== 1 ? 's' : ''} |\n`;
      } catch (error) {
        console.warn(`Error processing file ${file.path}:`, error.message);
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