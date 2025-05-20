import { Component } from '@angular/core';


interface Post {
  id: number;
  title: any;
  content: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'rolda';
  storedPosts: Post[] = [];

  onPostAdded(post: Post): void {
    this.storedPosts.push(post);
  }
}