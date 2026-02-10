import type {
  CustomerSearchResult,
  Customer,
  PatientRecord,
  Appointment,
  Treatment,
  EmailTemplate,
  Campaign,
  RevenueStats,
  DailyScheduleItem,
} from './types';
import { createClient } from './supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ========== Edge Function Helper ==========

async function callEdgeFunction<T>(
  name: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  }
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = new URL(`${SUPABASE_URL}/functions/v1/${name}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) =>
      url.searchParams.set(k, v)
    );
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  try {
    const res = await fetch(url.toString(), {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, data: json as T };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ========== Supabase Client Helper ==========

export function getSupabaseClient() {
  return createClient();
}

// ========== Customer APIs ==========

export async function searchCustomers(
  query: string
): Promise<CustomerSearchResult[]> {
  const result = await callEdgeFunction<{ results: CustomerSearchResult[] }>(
    'customer-search',
    { method: 'POST', params: { q: query } }
  );
  return result.data?.results || [];
}

export async function upsertCustomer(
  data: Partial<Customer>
): Promise<{ ok: boolean; customer?: Customer; error?: string }> {
  const result = await callEdgeFunction<{ customer: Customer }>(
    'customer-upsert',
    { body: data }
  );
  return { ok: result.ok, customer: result.data?.customer, error: result.error };
}

export async function mergeCustomers(sourceId: string, targetId: string) {
  return callEdgeFunction('customer-merge', {
    body: { source_id: sourceId, target_id: targetId },
  });
}

export async function getCustomerById(id: string): Promise<Customer> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .schema('crm')
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function getCustomerOverview() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .schema('crm')
    .from('v_customer_overview')
    .select('*');
  if (error) throw error;
  return data;
}

// ========== Treatment APIs ==========

export async function logTreatment(data: {
  customer_id: string;
  appointment_id?: string;
  notes?: string;
  treatment_details?: Record<string, unknown>;
  note_type?: string;
  source?: string;
}) {
  return callEdgeFunction<{ record: PatientRecord }>('treatment-log', {
    body: data,
  });
}

export async function getTreatmentHistory(customerId: string) {
  return callEdgeFunction<{ customer: Customer; timeline: unknown[] }>(
    'treatment-history',
    { method: 'GET', params: { customer_id: customerId } }
  );
}

export async function getTreatments(): Promise<Treatment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .schema('crm')
    .from('treatments')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return data as Treatment[];
}

// ========== Appointment APIs ==========

export async function getAppointments(filters?: {
  date?: string;
  location?: string;
  status?: string;
  customer_id?: string;
}): Promise<Appointment[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .schema('crm')
    .from('appointments')
    .select('*, customer:customers(*), treatment:treatments(*)');
  if (filters?.date) query = query.eq('date', filters.date);
  if (filters?.location) query = query.eq('location', filters.location);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
  query = query.order('start_time', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data as Appointment[];
}

export async function getTodaySchedule(location?: string) {
  const today = new Date().toISOString().split('T')[0];
  return getAppointments({ date: today, location });
}

// ========== Schedule / Stats Views ==========

export async function getDailySchedule(
  date?: string
): Promise<DailyScheduleItem[]> {
  const supabase = getSupabaseClient();
  const targetDate = date || new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .schema('crm')
    .from('v_daily_schedule')
    .select('*')
    .eq('date', targetDate)
    .order('start_time');
  if (error) throw error;
  return data as DailyScheduleItem[];
}

export async function getRevenueStats(): Promise<RevenueStats> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .schema('crm')
    .from('v_revenue_stats')
    .select('*')
    .single();
  if (error) throw error;
  return data as RevenueStats;
}

// ========== Email / Campaign APIs ==========

export async function sendEmail(data: {
  to: string;
  template_slug?: string;
  subject?: string;
  html?: string;
  variables?: Record<string, string>;
}) {
  return callEdgeFunction('email-send', { body: data });
}

export async function sendCampaign(campaignId: string) {
  return callEdgeFunction('email-campaign', {
    body: { campaign_id: campaignId },
  });
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .schema('crm')
    .from('email_templates')
    .select('*')
    .eq('active', true);
  if (error) throw error;
  return data as EmailTemplate[];
}

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .schema('crm')
    .from('campaigns')
    .select('*, template:email_templates(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

// ========== Auth ==========

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
