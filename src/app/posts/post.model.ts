export interface Comment {
  user: string;
  text: string;
}


export interface Post {
  id: string;
  title: string;
  content: string;
  imagePath: string;
  creator?: string | null; 
  comments?: Comment[];  
}
