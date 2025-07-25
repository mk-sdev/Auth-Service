import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRequest } from '../utils/interfaces';

export const Platform = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): 'web' | 'mobile' => {
    const request: UserRequest = ctx.switchToHttp().getRequest();

    // Analyze the custom header
    const isMobileHeader = request.headers['x-app-platform'] === 'mobile';

    if (isMobileHeader) return 'mobile';

    // user-agent analysis
    // const userAgent = request.headers['user-agent']?.toLowerCase() || '';
    // if (userAgent.includes('okhttp') || userAgent.includes('reactnative')) {
    //   return 'mobile';
    // }

    return 'web';
  },
);
