import { createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser, GqlContext } from 'src/types';

export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, context: GqlExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext<GqlContext>().req.user as AuthUser;
    return field ? user?.[field] : user;
  },
);
