import { GET } from '@shared';

interface HealthResponse {
  status: string;
  timestamp: string;
}

interface ApiInfoResponse {
  message: string;
  endpoints: Record<string, string>;
  example: string;
}

export class HealthcheckController {
  @GET('/healthcheck')
  healthcheck(): HealthResponse {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  @GET('/')
  root(): ApiInfoResponse {
    return {
      message: 'Timezone Server API',
      endpoints: {
        '/time/{timezone}': 'Get current time in specified timezone',
        '/healthcheck': 'Health check endpoint',
      },
      example: '/time/Etc/UTC',
    };
  }
}
