export const Roles = { STUDENT: 'STUDENT', STAFF: 'STAFF', ADMIN: 'ADMIN' } as const;
export type Role = (typeof Roles)[keyof typeof Roles];

export const TicketStatuses = [
  'OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED', 'REJECTED',
] as const;
export type TicketStatus = (typeof TicketStatuses)[number];

export const ApplicationStatuses = [
  'APPLICATION_SUBMITTED', 'WAITING_FOR_PAYMENT', 'PAYMENT_RECEIVED',
  'UNDER_PROCESS', 'READY_FOR_COLLECTION', 'COMPLETED', 'REJECTED',
] as const;
export type ApplicationStatus = (typeof ApplicationStatuses)[number];

export const ApplicationTypes = ['PROFORMA', 'TRANSCRIPT'] as const;
export type ApplicationType = (typeof ApplicationTypes)[number];

export const OfficeTypes = ['REGISTRAR_OFFICE', 'SEMESTER_CELL'] as const;
export type OfficeType = (typeof OfficeTypes)[number];

/** Valid ticket status transitions */
export const TICKET_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['WAITING_FOR_STUDENT', 'RESOLVED', 'REJECTED'],
  WAITING_FOR_STUDENT: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  REJECTED: [],
};

/** Valid application status transitions */
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  APPLICATION_SUBMITTED: ['WAITING_FOR_PAYMENT', 'REJECTED'],
  WAITING_FOR_PAYMENT: ['PAYMENT_RECEIVED', 'REJECTED'],
  PAYMENT_RECEIVED: ['UNDER_PROCESS', 'WAITING_FOR_PAYMENT', 'REJECTED'],
  UNDER_PROCESS: ['READY_FOR_COLLECTION', 'REJECTED'],
  READY_FOR_COLLECTION: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
};

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: unknown };
}
export interface ApiSuccessBody<T> { success: true; data: T }
export interface Paginated<T> { items: T[]; page: number; pageSize: number; total: number }
