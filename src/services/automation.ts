/**
 * Automation via webhooks (Zapier/IFTTT) with CSV/TXT export fallback.
 */
import Share from 'react-native-share';

export type Payload = Record<string, any>;

export async function sendWebhook(url: string, payload: Payload): Promise<boolean> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (e) {
    console.warn('Webhook failed, provide CSV download');
    return false;
  }
}

export async function exportCSV(data: string[][]): Promise<void> {
  const csv = data.map(row => row.join(',')).join('\n');
  await Share.open({ title: 'Export', message: csv });
}

export async function exportPDF(texts: string[]): Promise<void> {
  const content = texts.join('\n\n');
  await Share.open({ title: 'PDF', message: content });
}

export async function exportZIP(texts: string[]): Promise<void> {
  await Share.open({ title: 'ZIP', message: texts.join('\n') });
}

export async function shareToSlack(token: string, channel: string, text: string): Promise<boolean> {
  try {
    await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channels: channel, content: text, filename: 'scan.txt' }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareToTrello(key: string, token: string, card: string, text: string): Promise<boolean> {
  try {
    await fetch(`https://api.trello.com/1/cards/${card}/attachments?key=${key}&token=${token}`, {
      method: 'POST',
      body: JSON.stringify({ name: 'scan.txt', mimeType: 'text/plain', url: `data:text/plain,${encodeURIComponent(text)}` }),
      headers: { 'Content-Type': 'application/json' },
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareToNotion(token: string, page: string, text: string): Promise<boolean> {
  try {
    await fetch('https://api.notion.com/v1/blocks', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
      body: JSON.stringify({ parent: { page_id: page }, paragraph: { rich_text: [{ text: { content: text } }] } }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function uploadToDrive(uri: string): Promise<boolean> {
  console.warn('Drive upload not configured');
  return false;
}
