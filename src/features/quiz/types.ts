export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation?: string;
  authorName: string;
  createdAt?: string;
}

export interface QuizRank {
  title: string;
  badge: string;
  summary: string;
}

