export interface Poster {
  id: string;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
}

export interface PosterTheme {
  id: string;
  title: string;
  mainPoster: Poster;
  extensions: Poster[];
  color: string;
  description?: string;
}
