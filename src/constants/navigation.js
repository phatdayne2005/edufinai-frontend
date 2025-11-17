import { Home, DollarSign, BookOpen, Trophy, User, MessageCircle } from 'lucide-react';

export const tabs = [
  { id: 'home', label: 'Trang chủ', icon: Home },
  { id: 'finance', label: 'Tài chính', icon: DollarSign },
  { id: 'learning', label: 'Học tập', icon: BookOpen },
  { id: 'chatbot', label: 'AI Chat', icon: MessageCircle },
  { id: 'challenges', label: 'Thử thách', icon: Trophy },
  { id: 'profile', label: 'Cá nhân', icon: User },
];

export const defaultTab = 'home';

