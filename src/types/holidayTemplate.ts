export interface HolidayTemplateItem {
  month: number; // 1-12
  day: number; // 1-31
  name: string;
  description?: string;
}

export interface HolidayTemplate {
  id: number;
  name: string;
  description?: string;
  holidays: HolidayTemplateItem[];
  createdDate: string;
}

export interface CreateHolidayTemplateRequest {
  name: string;
  description?: string;
  holidays: HolidayTemplateItem[];
}

export interface UpdateHolidayTemplateRequest {
  name?: string;
  description?: string;
  holidays?: HolidayTemplateItem[];
}

export interface ApplyHolidayTemplateRequest {
  year: number;
}

export interface ApplyHolidayTemplateResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    date: string;
    name: string;
    error: string;
  }>;
}
