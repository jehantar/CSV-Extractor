export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  created_at: string;
  user_id: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit';
  user_id: string;
}