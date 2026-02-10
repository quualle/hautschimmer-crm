// ========== Core Entities ==========

/** Customer record */
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  date_of_birth: string | null;
  location: 'neumarkt' | 'kw' | null;
  tags: string[];
  notes: string | null;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

/** Customer search result from customer-search Edge Function */
export interface CustomerSearchResult extends Customer {
  total_appointments: number;
  last_appointment_date: string | null;
  next_appointment_date: string | null;
  total_revenue: number;
  similarity: number;
}

/** Treatment catalog entry */
export interface Treatment {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_eur: number;
  duration_minutes: number;
  available_at: string[];
  active: boolean;
  sort_order: number;
  notes: string | null;
}

/** Appointment record */
export interface Appointment {
  id: string;
  customer_id: string;
  treatment_id: string | null;
  location: 'neumarkt' | 'kw';
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_eur: number | null;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  created_by: string;
  remind_at: string | null;
  sms_reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  treatment?: Treatment;
}

/** Patient record / treatment note */
export interface PatientRecord {
  id: string;
  appointment_id: string | null;
  customer_id: string;
  notes: string | null;
  treatment_details: Record<string, unknown> | null;
  complications: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  note_type: 'treatment' | 'consultation' | 'follow_up' | 'general' | 'consent_form';
  source: 'manual' | 'telegram' | 'voice' | 'ocr';
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Patient file / upload */
export interface PatientFile {
  id: string;
  customer_id: string;
  appointment_id: string | null;
  file_type: 'photo' | 'consent_form' | 'lab_result' | 'document' | 'before_after';
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  description: string | null;
  uploaded_via: 'web' | 'telegram' | 'api';
  created_at: string;
  signed_url?: string;
}

/** Email template */
export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  template_type: 'transactional' | 'marketing' | 'aftercare' | 'reminder';
  variables: unknown[];
  active: boolean;
}

/** Campaign */
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body_html: string | null;
  template_id: string | null;
  segment_filter: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
  template?: EmailTemplate;
}

/** Salon access PIN entry */
export interface SalonAccess {
  id: string;
  location: 'neumarkt' | 'kw';
  pin_hash: string;
  name: string;
  active: boolean;
}

/** Availability slot */
export interface Availability {
  id: string;
  location: 'neumarkt' | 'kw';
  date: string;
  start_time: string;
  end_time: string;
}

// ========== View Types ==========

/** Row from v_daily_schedule view */
export interface DailyScheduleItem {
  appointment_id: string;
  customer_name: string;
  customer_id: string;
  treatment_name: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  location: string;
}

/** Row from v_revenue_stats view */
export interface RevenueStats {
  total_revenue: number;
  month_revenue: number;
  appointments_today: number;
  appointments_week: number;
  total_customers: number;
  new_customers_month: number;
}

// ========== API Response Types ==========

/** Generic API response wrapper */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

/** Location type alias for convenience */
export type Location = 'neumarkt' | 'kw';

/** Appointment status type alias */
export type AppointmentStatus = Appointment['status'];

/** Note type alias */
export type NoteType = PatientRecord['note_type'];

/** Birthday entry for upcoming birthdays widget */
export interface BirthdayEntry {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}
