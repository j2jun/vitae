import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  publishedAt?: string;
}

const parser = new Parser();

export async function fetchHeadlines(feedUrl: string, limit = 10): Promise<NewsItem[]> {
  const feed = await parser.parseURL(feedUrl);
  return feed.items.slice(0, limit).map((item) => ({
    title: item.title ?? "(untitled)",
    link: item.link ?? feedUrl,
    publishedAt: item.isoDate,
  }));
}
