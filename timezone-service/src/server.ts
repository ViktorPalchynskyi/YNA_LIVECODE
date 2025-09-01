import 'module-alias/register'; // Added for runtime alias support
import 'reflect-metadata'; // Added for dependency injection
import * as http from 'http';
import { Router } from '@routing';
import { TimezoneController, HealthcheckController } from '@controllers';
import { sendErrorResponse } from '@shared';

// TODO: Get from environment variables
const PORT: number = 3000;

// Initialize router and register controllers
const router = new Router();

// Create controller instances
const timezoneController = new TimezoneController();
const healthcheckController = new HealthcheckController();

router.registerController(timezoneController);
router.registerController(healthcheckController);

// Create HTTP server with decorator-based routing
const server: http.Server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    // Try to handle request with registered routes
    const handled = await router.handleRequest(req, res);
    
    if (!handled) {
      // Handle 404 for unmatched routes
      sendErrorResponse(
        res, 
        404, 
        'Not found', 
        'Use /time/{timezone} endpoint to get current time in a specific timezone',
        { example: '/time/Etc/UTC' }
      );
    }
  } catch (error) {
    // Global error handler
    console.error('Server error:', error);
    sendErrorResponse(
      res, 
      500, 
      'Internal server error', 
      'An unexpected error occurred'
    );
  }
});

// Start server
server.listen(PORT, (): void => {
  console.log(`🕒 Timezone server running on http://localhost:${PORT}`);
  console.log(`📍 Endpoints available:`);
  console.log(`   GET / - API information`);
  console.log(`   GET /time/{timezone} - Get time in timezone`);
  console.log(`   GET /healthcheck - Health check`);
  console.log(`📝 Example: http://localhost:${PORT}/time/Etc/UTC`);
});

// Handle graceful shutdown
process.on('SIGINT', (): void => {
  console.log('\n🛑 Shutting down server...');
  server.close((): void => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default server;
