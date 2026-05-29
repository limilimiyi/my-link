export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  clickCount?: number;
}

export const dummyLinks: LinkItem[] = [
  {
    id: "1",
    title: "GitHub",
    url: "https://github.com/username",
    icon: "github"
  },
  {
    id: "2",
    title: "Instagram",
    url: "https://instagram.com/username",
    icon: "instagram"
  },
  {
    id: "3",
    title: "YouTube",
    url: "https://youtube.com/@username",
    icon: "youtube"
  },
  {
    id: "4",
    title: "Tech Blog",
    url: "https://velog.io/@username",
    icon: "link"
  },
  {
    id: "5",
    title: "Portfolio",
    url: "https://username.com",
    icon: "briefcase"
  }
];
