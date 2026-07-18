import { supabase } from './supabase'

export type Asset = {
  id: string
  qr_code_id: string
  name: string
  category: string
  location: string
  status: 'working' | 'under_repair' | 'out_of_service'
  notes?: string
  created_at: string
  updated_at: string
}

export type Ticket = {
  id: string
  asset_id?: string
  reported_by: string
  assigned_to?: string
  title: string
  description: string
  category?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'escalated' | 'rejected'
  photo_before_url?: string
  photo_after_url?: string
  resolution_notes?: string
  created_at: string
  resolved_at?: string
}

export type Notification = {
  id: string
  user_id: string
  message: string
  type: 'ticket_assigned' | 'status_changed' | 'resolved'
  is_read: boolean
  created_at: string
}

// ===== ASSETS =====
export async function getAssetByQRCode(qrCodeId: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('qr_code_id', qrCodeId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getAssetById(id: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getAllAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAsset(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('assets')
    .insert([asset])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAsset(id: string, updates: Partial<Asset>) {
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAsset(id: string) {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ===== TICKETS =====
export async function getTicketById(id: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getStudentTickets(userId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTechnicianTickets(userId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAllTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'resolved_at'>) {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      ...updates,
      resolved_at: updates.status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function assignTicket(ticketId: string, technicianId: string) {
  return updateTicket(ticketId, {
    assigned_to: technicianId,
    status: 'assigned',
  })
}

// ===== NOTIFICATIONS =====
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

// ===== USERS / PROFILES =====
export async function getTechnicians(): Promise<{ id: string; full_name: string; role: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'technician')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data || []
}

// ===== AI CATEGORY/SEVERITY SUGGESTION =====
export function suggestCategoryAndSeverity(description: string): {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
} {
  const lowerDesc = description.toLowerCase()

  // Category detection (keyword-based)
  let category = 'other'
  if (lowerDesc.includes('screen') || lowerDesc.includes('display')) category = 'display'
  else if (lowerDesc.includes('keyboard') || lowerDesc.includes('key')) category = 'keyboard'
  else if (lowerDesc.includes('mouse') || lowerDesc.includes('pointer')) category = 'mouse'
  else if (lowerDesc.includes('power') || lowerDesc.includes('battery')) category = 'power'
  else if (lowerDesc.includes('wifi') || lowerDesc.includes('network') || lowerDesc.includes('connection'))
    category = 'network'
  else if (lowerDesc.includes('software') || lowerDesc.includes('crash') || lowerDesc.includes('freeze'))
    category = 'software'
  else if (lowerDesc.includes('hardware')) category = 'hardware'

  // Severity detection (keyword-based)
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  if (
    lowerDesc.includes('critical') ||
    lowerDesc.includes('broken') ||
    lowerDesc.includes('not working') ||
    lowerDesc.includes('urgent')
  )
    severity = 'critical'
  else if (
    lowerDesc.includes('high') ||
    lowerDesc.includes('severe') ||
    lowerDesc.includes('major')
  )
    severity = 'high'
  else if (
    lowerDesc.includes('minor') ||
    lowerDesc.includes('small') ||
    lowerDesc.includes('low')
  )
    severity = 'low'

  return { category, severity }
}