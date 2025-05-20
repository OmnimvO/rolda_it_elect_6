import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';


@Injectable({ providedIn: 'root' })
export class AuthService {


  private token: string | null = null;
  private isAuthenticated = false;
  private authStatusListener = new Subject<boolean>();
  private tokenTimer: any;
  private userId: string | null = null;


  constructor(private http: HttpClient, private router: Router) {}


  getToken() {
    return this.token;
  }


  getIsAuth() {
    return this.isAuthenticated;
  }


  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  getUserId() {
  return this.userId;
}


  createUser(email: string, password: string) {
    const authData: AuthData = { email, password };
    this.http.post('http://localhost:3000/api/user/signup', authData)
      .subscribe({
        next: response => {
          console.log('Signup successful:', response);
        },
        error: err => {
          console.error('Signup error:', err);
        }
      });
  }


 loginUser(email: string, password: string) {
  const authData: AuthData = { email, password };
  this.http
    .post<{ token: string; expiresIn: number; userId: string }>(
      'http://localhost:3000/api/user/login',
      authData
    )
    .subscribe({
      next: response => {
        const token = response.token;
        if (token) {
          this.token = token;
          this.userId = response.userId;  
          const expiresInDuration = response.expiresIn;
          this.setAuthTimer(expiresInDuration);
          this.isAuthenticated = true;
          this.authStatusListener.next(true);
          const now = new Date();
          const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
          this.saveAuthData(token, expirationDate, this.userId); 
          this.router.navigate(['/']);
        }
      },
      error: err => {
        console.error('Login error:', err);
        this.authStatusListener.next(false);
      }
    });
}


  autoAuthUser() {
  const authInformation = this.getAuthData();
  if (!authInformation) {
    return;
  }

  const now = new Date();
  const expiresInDuration = authInformation.expirationDate.getTime() - now.getTime();

  if (expiresInDuration > 0) {
    this.token = authInformation.token;
    this.userId = authInformation.userId; 
    this.isAuthenticated = true;
    this.setAuthTimer(expiresInDuration / 1000);
    this.authStatusListener.next(true);
  } else {
    this.logout();
  }
}


  logout() {
  this.token = null;
  this.userId = null;   
  this.isAuthenticated = false;
  this.authStatusListener.next(false);
  clearTimeout(this.tokenTimer);
  this.clearAuthData();
  this.router.navigate(['/']);
}

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }


  private saveAuthData(token: string, expirationDate: Date, userId: string | null) {
  localStorage.setItem('token', token);
  localStorage.setItem('expiration', expirationDate.toISOString());
  if (userId) {
    localStorage.setItem('userId', userId);
  }
}

  private clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('expiration');
  localStorage.removeItem('userId');
}


  private getAuthData() {
  const token = localStorage.getItem('token');
  const expirationDate = localStorage.getItem('expiration');
  const userId = localStorage.getItem('userId');  

  if (!token || !expirationDate) {
    return null;
  }

  return {
    token: token,
    expirationDate: new Date(expirationDate),
    userId: userId  
  };
}

}



