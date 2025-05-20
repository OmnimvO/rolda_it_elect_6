import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Post } from "./post.model";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class PostsService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{ posts: Post[], postCount: number }>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts(pagesize?: number, currentpage?: number) {
    const queryParams = `?pagesize=${pagesize}&currentpage=${currentpage}`;
    this.http.get<{ message: string; posts: any, maxPosts: number }>("http://localhost:3000/api/posts" + queryParams)
      .pipe(
        map((postData) => {
          return {
            posts: postData.posts.map((post: any) => {
              return {
                title: post.title,
                content: post.content,
                id: post._id,
                imagePath: post.imagePath,
                creator: post.creator
              };
            }),
            maxPosts: postData.maxPosts
          };
        })
      )
      .subscribe((transformedPostsData) => {
        console.log(transformedPostsData); 
        this.posts = transformedPostsData.posts;
        this.postsUpdated.next({
          posts: [...this.posts],
          postCount: transformedPostsData.maxPosts
        });
      });
  }

  getPostUpdatedListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
  return this.http.get<{ 
    _id: string; 
    title: string; 
    content: string; 
    imagePath: string; 
    creator: string  
  }>(
    "http://localhost:3000/api/posts/" + id
  );
}

  addPost(title: string, content: string, image: File) {
    const postData = new FormData();
    postData.append("title", title);
    postData.append("content", content);
    postData.append("image", image);

    this.http.post<{ message: string; post: Post }>("http://localhost:3000/api/posts", postData).subscribe((response) => {
      const newPost: Post = {
        id: response.post.id,
        title: title,
        content: content,
        imagePath: response.post.imagePath,
        creator: response.post.creator 
      };
      this.posts.push(newPost);
      this.postsUpdated.next({
        posts: [...this.posts],
        postCount: this.posts.length
      });
      this.router.navigate(["/"]);
    });
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let postData: FormData | Post;

    if (typeof image === "object") {
      postData = new FormData();
      postData.append("id", id);
      postData.append("title", title);
      postData.append("content", content);
      postData.append("image", image, image.name);
    } else {
    postData = {
    id: id,
    title: title,
    content: content,
    imagePath: image,
    creator: null  
  };
}

    this.http.put<{ message: string; imagePath: string }>(
      "http://localhost:3000/api/posts/" + id,
      postData
    ).subscribe((response) => {
      const updatedPosts = [...this.posts];
      const index = updatedPosts.findIndex((p) => p.id === id);

      updatedPosts[index] = {
        id,
        title,
        content,
        imagePath: response.imagePath || (typeof image === "string" ? image : ""),
      };

      this.posts = updatedPosts;
      this.postsUpdated.next({
        posts: [...this.posts],
        postCount: this.posts.length
      });
      this.router.navigate(["/"]);
    });
  }

  deletePost(postId: string) {
    return this.http.delete("http://localhost:3000/api/posts/" + postId);
  }
}
