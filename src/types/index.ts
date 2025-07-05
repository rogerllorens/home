export interface ProductData {
  title?: string;
  description?: string;
  price?: string;
  [key: string]: any;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ScanRecord {
  type: string;
  content: string;
  date: string;
  favorite: boolean;
  tags?: string[];
  product?: any;
  location?: Location;
  count?: number;
  folderId?: string;
  comments?: Comment[];
  password?: string;
  expires?: string;
}

export interface Comment {
  id: string;
  text: string;
  date: string;
}

export interface Metric {
  command: string;
  value: any;
  date: number;
}
