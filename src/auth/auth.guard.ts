import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if the user's session has a token.
    if (!request.session?.token) {
      throw new UnauthorizedException();
    }

    return true;
    // TODO: Handle when user can't get a token as they're unauthorized, prevent infinite loop.
  }
}
