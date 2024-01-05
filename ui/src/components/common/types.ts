
export interface Dataset {
  id: number;
  bbox: number[];
  name: string;
  source_org: string;
  description: string;
  url: string;
  files: string[];
  accessibility: string;
  date_start: Date;
  date_end: Date;
}

export interface DatasetCount {
  index: string;
  dataset_count: number;
}