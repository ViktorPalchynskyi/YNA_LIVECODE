import 'module-alias/register'; // Added for runtime alias support
import 'reflect-metadata'; // Added for dependency injection
import * as http from 'http';

const SERVER_URL: string = 'http://localhost:3000';

// Interface for HTTP response
interface HttpResponse {
  statusCode: number;
  data: string;
}

// Interface for error response from server
interface ErrorResponse {
  error: string;
  message: string;
  requested_timezone?: string;
  example?: string;
}

// Function to make HTTP request
function makeRequest(path: string): Promise<HttpResponse> {
  return new Promise<HttpResponse>((resolve, reject) => {
    const req: http.ClientRequest = http.get(`${SERVER_URL}${path}`, (res: http.IncomingMessage) => {
      let data: string = '';
      
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          data: data
        });
      });
    });
    
    req.on('error', (error: Error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Demo function
async function runDemo(): Promise<void> {
  console.log('🚀 Starting timezone server demo...\n');
  
  // Valid timezone identifiers to test
  const validTimezones: string[] = [
    'Etc/UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney',
    'America/Los_Angeles',
    'Europe/Paris',
    'Asia/Kolkata',
    'Pacific/Honolulu',
    'Africa/Cairo'
  ];
  
  // Invalid timezone identifiers to test
  const invalidTimezones: string[] = [
    'Invalid/Timezone',
    'NotATimezone',
    'America/FakeCity',
    'Europe/NonExistent',
    'Random/String',
    'UTC+5',
    'GMT-8'
  ];
  
  console.log('✅ Testing VALID timezone identifiers:\n');
  console.log('='.repeat(60));
  
  for (const timezone of validTimezones) {
    try {
      console.log(`\n🌍 Testing: ${timezone}`);
      const response: HttpResponse = await makeRequest(`/time/${encodeURIComponent(timezone)}`);
      
      if (response.statusCode === 200) {
        // With the user's change, the response is now just a string (ISO timestamp)
        const timeString: string = JSON.parse(response.data);
        console.log(`   Status: ${response.statusCode} OK`);
        console.log(`   Time: ${timeString}`);
        console.log(`   Timezone: ${timezone}`);
      } else {
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${response.data}`);
      }
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Error: ${errorMessage}`);
    }
  }
  
  console.log('\n\n❌ Testing INVALID timezone identifiers:\n');
  console.log('='.repeat(60));
  
  for (const timezone of invalidTimezones) {
    try {
      console.log(`\n🚫 Testing: ${timezone}`);
      const response: HttpResponse = await makeRequest(`/time/${encodeURIComponent(timezone)}`);
      
      if (response.statusCode === 400) {
        const data: ErrorResponse = JSON.parse(response.data);
        console.log(`   Status: ${response.statusCode} Bad Request`);
        console.log(`   Error: ${data.error}`);
        console.log(`   Message: ${data.message}`);
      } else {
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${response.data}`);
      }
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Error: ${errorMessage}`);
    }
  }
  
  console.log('\n\n🔍 Testing edge cases:\n');
  console.log('='.repeat(60));
  
  // Test URL encoded timezone
  console.log('\n🧪 Testing URL-encoded timezone: America%2FNew_York');
  try {
    const response: HttpResponse = await makeRequest('/time/America%2FNew_York');
    if (response.statusCode === 200) {
      const timeString: string = JSON.parse(response.data);
      console.log(`   Status: ${response.statusCode} OK`);
      console.log(`   Timezone: America/New_York`);
      console.log(`   Time: ${timeString}`);
    }
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ❌ Error: ${errorMessage}`);
  }
  
  // Test invalid endpoint
  console.log('\n🧪 Testing invalid endpoint: /invalid');
  try {
    const response: HttpResponse = await makeRequest('/invalid');
    console.log(`   Status: ${response.statusCode}`);
    const data: ErrorResponse = JSON.parse(response.data);
    console.log(`   Error: ${data.error}`);
    console.log(`   Message: ${data.message}`);
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ❌ Error: ${errorMessage}`);
  }
  
  console.log('\n✅ Demo completed!\n');
}

// Check if server is running before starting demo
async function checkServer(): Promise<boolean> {
  try {
    await makeRequest('/time/Etc/UTC');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main(): Promise<void> {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning: boolean = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running!');
    console.log('Please start the server first with: npm start');
    console.log('Then run this demo with: npm run demo');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  await runDemo();
}

main().catch(console.error);
