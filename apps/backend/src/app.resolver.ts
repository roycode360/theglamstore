import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EmailService } from './auth/email.service';
import { isPublic } from './auth/decorators';

@Resolver()
export class AppResolver {
  constructor(private readonly email: EmailService) {}
  @Query(() => String)
  health(): string {
    return 'ok';
  }

  @isPublic()
  @Mutation(() => Boolean)
  async sendContactMessage(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('subject', { type: () => String, nullable: true }) subject?: string,
    @Args('message') message?: string,
  ): Promise<boolean> {
    await this.email.sendContactMessage({
      name,
      email,
      subject,
      message: message || '',
    });
    return true;
  }
}
