
export interface Dataset {
  id: number;
  name: string;
  source_org: string;
  description: string;
  files: string[];
}

export interface DatasetCount {
  index: string;
  dataset_count: number;
}