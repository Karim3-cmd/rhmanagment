import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email: string;
  role: string;
  department: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | CurrentUserData[keyof CurrentUserData] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
