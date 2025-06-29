import {
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { Parser } from 'xml2js';
import { generate } from 'multiple-cucumber-html-reporter';

function generateTestReports() {
  try {
    // Check if JSON directory exists before trying to generate reports
    const jsonDir = './wdio/reports/json';
    if (!existsSync(jsonDir)) {
      console.log(`JSON directory ${jsonDir} does not exist, skipping HTML report generation`);
      return;
    }

    // Check if there are any JSON files in the directory
    const jsonFiles = readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.log(`No JSON files found in ${jsonDir}, skipping HTML report generation`);
      return;
    }

    console.log(`Found ${jsonFiles.length} JSON files, generating HTML report...`);
    
    // Generate the report when all tests are done
    generate({
      jsonDir: jsonDir,
      reportPath: './wdio/reports/html',
      // for more options see https://github.com/wswebcreation/multiple-cucumber-html-reporter#options
    });

    console.log('HTML report generated successfully');
  } catch (error) {
    console.error('Error generating HTML report:', error.message);
    // Don't throw the error to prevent the entire test run from failing
  }

  try {
    // Process JUnit results
    const junitDir = './wdio/reports/junit-results';
    if (!existsSync(junitDir)) {
      console.log(`JUnit directory ${junitDir} does not exist, skipping JUnit processing`);
      return;
    }

    const testSuites = readdirSync(junitDir);
    testSuites.forEach((testSuite) => {
      try {
        const file = readFileSync(
          `${junitDir}/${testSuite}`,
          'utf8',
        );
        const parser = new Parser();

        parser.parseString(file, (err, result) => {
          try {
            const suiteName = result.testsuites.testsuite[0].$.name;
            // Create dir for each test suite
            if (!existsSync(`${junitDir}/${suiteName}`)) {
              mkdirSync(`${junitDir}/${suiteName}`);
              renameSync(
                `${junitDir}/${testSuite}`,
                `${junitDir}/${suiteName}/${suiteName}.xml`,
              );
              // Create test-info.json file for each test suite
              const testInfo = {
                'test-name': suiteName,
              };
              writeFileSync(
                `${junitDir}/${suiteName}/test-info.json`,
                JSON.stringify(testInfo),
              );
            }
          } catch (error) {
            console.warn(`Error processing test suite ${testSuite}:`, error.message);
          }
        });
      } catch (error) {
        console.warn(`Error reading test suite file ${testSuite}:`, error.message);
      }
    });
  } catch (error) {
    console.error('Error processing JUnit results:', error.message);
    // Don't throw the error to prevent the entire test run from failing
  }
}

export default generateTestReports;
