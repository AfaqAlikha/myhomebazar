export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface GuideArticle {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  published: string;
  sections: GuideSection[];
}
