import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EmailService } from './auth/email.service';

@Resolver()
export class AppResolver {
  constructor(private readonly email: EmailService) {}
  @Query(() => String)
  health(): string {
    return 'ok';
  }

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
