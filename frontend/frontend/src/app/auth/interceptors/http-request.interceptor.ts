import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('Intercepting Request:', {
      url: request.url,
      method: request.method,
      body: request.body,
      headers: request.headers
    });

    const authToken = this.authService.getToken();
    console.log('Auth Token from AuthService:', authToken);

    let modifiedRequest = request;
    if (authToken && request.url.includes('/api/')) {
      modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
      console.log('Request after attempting to add token:', {
        url: modifiedRequest.url,
        headers: modifiedRequest.headers,
        authorizationHeader: modifiedRequest.headers.get('Authorization')
      });
    }

    return next.handle(modifiedRequest).pipe(
      finalize(() => {
        console.log('Request completed (from interceptor):', modifiedRequest.url);
      })
    );
  }
}
