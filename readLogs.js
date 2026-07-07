const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\bde0afc2-5ea2-4e6f-83e6-7a19175d1601\\.system_generated\\logs\\transcript.jsonl';

const read = async () => {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('ConsoleLogs') || line.includes('consoleLogs') || line.includes('console_logs')) {
      console.log('Found matching line:');
      console.log(line.substring(0, 1000) + '...');
    }
  }
};

read();
