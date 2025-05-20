import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';  


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loading = false;


  constructor(public authservice: AuthService){}  


  onLogin(form: NgForm) {
    if (form.invalid) {
      return;
    }


    this.authservice.loginUser(form.value.email, form.value.password);  


    console.log('Form submitted with values:', form.value);


    this.loading = true;


    setTimeout(() => {
      this.loading = false;
      alert('Login successful!');
    }, 2000);
  }
}



