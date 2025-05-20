import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from "../auth.service";  


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']    
})
export class SignupComponent {
  loading = false;


  constructor(public authService: AuthService){}  


  onSignup(form: NgForm){  
    if(form.invalid){  
      return;  
    }  
    this.authService.createUser(form.value.email, form.value.password);


    console.log('Form submitted with values:', form.value);


    this.loading = true;


    setTimeout(() => {
      this.loading = false;
      alert('Signup successful!');
    }, 2000);
  }
}



