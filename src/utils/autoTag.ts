export type Tag = 'url' | 'product' | 'contact' | 'text' | 'social' | 'phone' | 'email';

export default function autoTag(content: string): Tag[] {
  const tags: Tag[] = [];
  if (/^https?:\/\//i.test(content)) tags.push('url');
  if (/^\d{10,13}$/.test(content)) tags.push('product');
  if (/^WIFI:/.test(content) || /^BEGIN:VCARD/.test(content)) tags.push('contact');
  if (tags.length === 0) tags.push('text');
  // additional heuristics
  if (/\bfacebook\.com|twitter\.com/.test(content)) tags.push('social');
  if (/\b(?:\+?\d{1,3})?\d{7,12}\b/.test(content)) tags.push('phone');
  if (/@/.test(content) && /\./.test(content)) tags.push('email');
  return tags;
}
