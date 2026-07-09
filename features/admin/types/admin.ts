// Types for the /admin/* backend endpoints.
// See the admin panel API spec for field shapes.

export type AdminRole = 'ADMIN' | 'DOCTOR' | 'CAREGIVER' | 'PATIENT';
export type AdminStatus = 'ACTIVE' | 'INACTIVE';
export type SynapseStatus = 'PENDING' | 'CREATED' | 'FAILED';
export type AdminGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AdminUserListItem {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: string;
  status: string;
  synapse_status: string;
  created_at: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  updated_at: string | null;
  specialization?: string | null;
  relationship_to_patient?: string | null;
  national_code?: string | null;
  dob?: string | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  caregiver_id?: number | null;
  doctor_id?: number | null;
  synapse_id?: string | null;
}

export interface AdminUserRoleLookup {
  username: string;
  role: string;
  status: string;
  synapse_status: string;
}

export interface AdminUserCreate {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password: string;
  status?: string;
  dob?: string;
  gender?: string;
  weight?: number;
  height?: number;
  national_code?: string;
  doctor_id?: number;
  caregiver_id?: number;
  specialization?: string;
  relationship_to_patient?: string;
  phone_number?: string;
}

export type AdminUserUpdate = Partial<Omit<AdminUserCreate, 'username' | 'password'>>;

export interface AdminRelationMember {
  id: number;
  username: string;
  full_name: string;
}

export interface AdminRelation {
  patient_id: number;
  patient_username: string;
  patient_full_name: string;
  doctor: AdminRelationMember | null;
  caregiver: AdminRelationMember | null;
}

export interface AdminRelationsResponse {
  relations: AdminRelation[];
  total: number;
}

export interface AdminRoom {
  room_id: string;
  name: string | null;
  canonical_alias: string | null;
  joined_members: number;
  members: number;
  is_public: boolean;
  // Synapse passes through additional fields; preserve as an opaque bag.
  [key: string]: unknown;
}

export interface AdminRoomsResponse {
  rooms: AdminRoom[];
  total_rooms: number;
  offset: number;
  next_batch: string | null;
}

export interface AdminRoomMembersResponse {
  members: string[];
}

export interface AdminRoomDeleteResponse {
  room_id: string;
  purged: boolean;
  delete_id?: string;
}

export interface AdminUserRoomsResponse {
  user_id: number;
  mxid: string;
  rooms: string[];
}

export interface AdminChatSession {
  id: string;
  user_id: number;
  patient_id: number | null;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface AdminChatSessionListResponse {
  sessions: AdminChatSession[];
  total: number;
}

export interface AdminChatMessage {
  id: number;
  session_id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminChatMessagesResponse {
  session_id: string;
  messages: AdminChatMessage[];
}

export interface AdminAssignPatientRequest {
  patient_id: number;
  role_assignment: 'DOCTOR' | 'CAREGIVER';
  assign_user_id: number;
}

export interface AdminUnassignPatientRequest {
  patient_id: number;
  role_assignment: 'DOCTOR' | 'CAREGIVER';
}

export interface AdminUnassignPatientResponse {
  detail: string;
  patient_user_id: number;
  unassigned_from: string;
  success: boolean;
}
