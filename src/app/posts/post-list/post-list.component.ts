import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { Post } from "../post.model";
import { PostsService } from "../posts.service";
import { PageEvent } from '@angular/material/paginator';  
import { AuthService } from "src/app/authentication/auth.service";
import { NotificationService } from "src/app/header/notification.service";

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
})
export class PostListComponent implements OnInit, OnDestroy {

  totalposts = 10;
  postperpage = 2;
  currentpage = 1;
  pageSizeOption = [1, 2, 5, 10];
  Loading = false;
  posts: Post[] = [];
  filteredPosts: Post[] = [];

  searchTerm: string = '';

  userIsAuthenticated = false;
  userId: string | null = null;

  private postsSub!: Subscription;
  private authStatusSub!: Subscription;

  reactions = [
    { name: 'like', emoji: '👍' },
    { name: 'love', emoji: '❤️' },
    { name: 'haha', emoji: '😄' },
    { name: 'wow', emoji: '😮' },
    { name: 'sad', emoji: '😢' }
  ];

  postReactions: { [postId: string]: { [reactionName: string]: number } } = {};
  userReactions: { [postId: string]: string | null } = {};
  newComments: { [postId: string]: string | undefined } = {};

  constructor(
    public postsService: PostsService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.Loading = true;
    this.fetchPosts(this.postperpage, this.currentpage);

    this.postsSub = this.postsService.getPostUpdatedListener()
      .subscribe((postData: { posts: Post[], postCount: number }) => {
        this.posts = postData.posts;
        this.totalposts = postData.postCount;

        const savedPostsJSON = localStorage.getItem('posts');
        let savedPosts: Post[] = [];
        if (savedPostsJSON) {
          savedPosts = JSON.parse(savedPostsJSON);
        }

        const savedReactionsJSON = localStorage.getItem('postReactions');
        const savedUserReactionsJSON = localStorage.getItem('userReactions');

        if (savedReactionsJSON) {
          this.postReactions = JSON.parse(savedReactionsJSON);
        }
        if (savedUserReactionsJSON) {
          this.userReactions = JSON.parse(savedUserReactionsJSON);
        }

        this.posts.forEach(post => {
          if (!this.postReactions[post.id]) {
            this.postReactions[post.id] = {};
            this.reactions.forEach(r => {
              this.postReactions[post.id][r.name] = 0;
            });
          }
          if (!(post.id in this.userReactions)) {
            this.userReactions[post.id] = null;
          }

          if (!post.comments) {
            post.comments = [];
          }

          const savedPost = savedPosts.find(p => p.id === post.id);
          if (savedPost && savedPost.comments) {
            post.comments = savedPost.comments;
          }
        });

        if (this.searchTerm.trim()) {
          this.filterPosts();
        } else {
          this.filteredPosts = this.posts.slice();
        }

        this.Loading = false;
      });

    this.userIsAuthenticated = this.authService.getIsAuth();
    this.userId = this.authService.getUserId();

    this.authStatusSub = this.authService.getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      });
  }

  fetchPosts(pagesize?: number, currentpage?: number): void {
    this.Loading = true;
    this.postsService.getPosts(pagesize, currentpage);
  }

  onChangedPage(pageData: PageEvent): void {
    if (this.searchTerm.trim()) {
      this.onSearchTermChanged();
    } else {
      this.Loading = true;
      this.currentpage = pageData.pageIndex + 1;
      this.postperpage = pageData.pageSize;
      this.fetchPosts(this.postperpage, this.currentpage);
    }
  }

  onDelete(postId: string): void {
    this.Loading = true;
    const deletedPost = this.posts.find(p => p.id === postId);
    const deletedTitle = deletedPost?.title ?? 'a post';

    this.postsService.deletePost(postId).subscribe({
      next: () => {
        this.notificationService.addNotification(`🗑️ Post "${deletedTitle}" was deleted.`);

        delete this.postReactions[postId];
        delete this.userReactions[postId];

        localStorage.setItem('postReactions', JSON.stringify(this.postReactions));
        localStorage.setItem('userReactions', JSON.stringify(this.userReactions));

        const savedPostsJSON = localStorage.getItem('posts');
        if (savedPostsJSON) {
          let savedPosts: Post[] = JSON.parse(savedPostsJSON);
          savedPosts = savedPosts.filter(p => p.id !== postId);
          localStorage.setItem('posts', JSON.stringify(savedPosts));
        }

        if (this.searchTerm.trim()) {
          this.fetchPosts();
        } else {
          this.fetchPosts(this.postperpage, this.currentpage);
        }
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        this.Loading = false;
      },
      complete: () => {
        this.Loading = false;
      }
    });
  }

  onSearchTermChanged(): void {
    const term = this.searchTerm.trim();
    if (term) {
      this.fetchPosts();  
    } else {
      this.fetchPosts(this.postperpage, this.currentpage);
    }
  }

  filterPosts(): void {
    const lowerSearch = this.searchTerm.toLowerCase();
    this.filteredPosts = this.posts.filter(post =>
      post.title.toLowerCase().includes(lowerSearch)
    );
  }

  toggleReaction(postId: string, reactionName: string): void {
    const currentReaction = this.userReactions[postId];
    const post = this.filteredPosts.find(p => p.id === postId);
    const postTitle = post ? post.title : 'the post';

    if (currentReaction === reactionName) {
      this.userReactions[postId] = null;
      this.decrementReaction(postId, reactionName);

      this.notificationService.addNotification(
        `You removed your '${reactionName}' reaction from "${postTitle}".`
      );
    } else {
      if (currentReaction) {
        this.decrementReaction(postId, currentReaction);
      }
      this.userReactions[postId] = reactionName;
      this.incrementReaction(postId, reactionName);

      this.notificationService.addNotification(
        `You reacted '${reactionName}' to "${postTitle}".`
      );
    }

    localStorage.setItem('postReactions', JSON.stringify(this.postReactions));
    localStorage.setItem('userReactions', JSON.stringify(this.userReactions));
  }

  // Undo reaction by removing any reaction the user has on the post
  undoReaction(postId: string): void {
    const currentReaction = this.userReactions[postId];
    if (!currentReaction) return;

    const post = this.filteredPosts.find(p => p.id === postId);
    const postTitle = post ? post.title : 'the post';

    this.decrementReaction(postId, currentReaction);
    this.userReactions[postId] = null;

    localStorage.setItem('postReactions', JSON.stringify(this.postReactions));
    localStorage.setItem('userReactions', JSON.stringify(this.userReactions));

    this.notificationService.addNotification(
      `You removed your '${currentReaction}' reaction from "${postTitle}".`
    );
  }

  incrementReaction(postId: string, reactionName: string): void {
    if (!this.postReactions[postId]) {
      this.postReactions[postId] = {};
    }
    if (!this.postReactions[postId][reactionName]) {
      this.postReactions[postId][reactionName] = 0;
    }
    this.postReactions[postId][reactionName]++;
  }

  decrementReaction(postId: string, reactionName: string): void {
    if (this.postReactions[postId]?.[reactionName]) {
      this.postReactions[postId][reactionName]--;
      if (this.postReactions[postId][reactionName] < 0) {
        this.postReactions[postId][reactionName] = 0;
      }
    }
  }

  getReactionCount(postId: string, reactionName: string): number {
    return this.postReactions[postId]?.[reactionName] || 0;
  }

  userReaction(postId: string): string | null {
    return this.userReactions[postId] || null;
  }

  addComment(postId: string): void {
    const commentText = this.newComments[postId]?.trim();
    if (!commentText) return;

    const post = this.filteredPosts.find(p => p.id === postId);
    if (!post) return;

    const currentUser = this.userId || 'Anonymous';

    if (!post.comments) {
      post.comments = [];
    }

    post.comments.push({ user: currentUser, text: commentText });

    localStorage.setItem('posts', JSON.stringify(this.filteredPosts));

    this.newComments[postId] = '';

    this.notificationService.addNotification(
      `You commented on "${post.title}": "${commentText}"`
    );
  }

  // Delete a comment by its index in the post's comments array
  deleteComment(postId: string, commentIndex: number): void {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (!post || !post.comments || commentIndex < 0 || commentIndex >= post.comments.length) {
      return;
    }

    const removedComment = post.comments.splice(commentIndex, 1)[0];

    localStorage.setItem('posts', JSON.stringify(this.filteredPosts));

    this.notificationService.addNotification(
      `You deleted a comment on "${post.title}": "${removedComment.text}"`
    );
  }

  ngOnDestroy(): void {
    if (this.postsSub) {
      this.postsSub.unsubscribe();
    }
    if (this.authStatusSub) {
      this.authStatusSub.unsubscribe();
    }
  }
}
