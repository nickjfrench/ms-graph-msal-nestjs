import { Injectable } from '@nestjs/common';
import {
  ConfidentialClientApplication,
  Configuration,
  AuthenticationResult,
} from '@azure/msal-node';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as appConfig from 'appConfig.json';

@Injectable()
export class AuthService {
  private msalClient: ConfidentialClientApplication;

  constructor(
    // Setting ConfigService to infer environment variables types. Use infer: true within get method.
    private configService: ConfigService<
      {
        AZURE_CLIENT_ID: string;
        AZURE_TENANT_ID: string;
        AZURE_CLIENT_SECRET: string;
        AZURE_REDIRECT_URI: string;
      },
      true
    >,
  ) {
    const msalConfig: Configuration = {
      auth: {
        // Infer: true will infer the type of the environment variable.
        clientId: this.configService.get<string>('AZURE_CLIENT_ID', {
          infer: true,
        }),
        authority: `https://login.microsoftonline.com/${this.configService.get<string>('AZURE_TENANT_ID')}`,
        clientSecret: this.configService.get<string>('AZURE_CLIENT_SECRET', {
          infer: true,
        }),
      },
    };
    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  async signIn(): Promise<string> {
    const authUrlParameters = {
      scopes: appConfig.AZURE_SCOPES, // TODO: Can this be dynamically read per API?
      redirectUri: this.configService.get<string>('AZURE_REDIRECT_URI', {
        infer: true,
      }),
    };

    return await this.msalClient.getAuthCodeUrl(authUrlParameters);
  }

  async handleRedirect(
    req: Request,
    callbackUrl: string,
  ): Promise<AuthenticationResult> {
    const tokenRequest = {
      code: callbackUrl,
      scopes: appConfig.AZURE_SCOPES,
      redirectUri: this.configService.get<string>('AZURE_REDIRECT_URI', {
        infer: true,
      }),
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);
    req.session.token = response.accessToken;

    // Log user sign in.
    if (response.account)
      console.log(response.account.username + ' sign in successful.');
    else console.log('Unknown User sign in successful.');

    return response;
  }
}
