export type JsonObject = Record<string, unknown>;

export type CalBookingStatusFilter = "upcoming" | "recurring" | "past" | "cancelled" | "unconfirmed";
export type CalBookingSortOrder = "asc" | "desc";

export interface CalBookingAttendee {
  name: string;
  email: string;
  displayEmail: string;
  timeZone: string;
  absent: boolean;
  phoneNumber?: string;
}

export interface CalBookingEventType {
  id: number;
  slug: string;
}

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  description?: string;
  status: string;
  start: string;
  end: string;
  duration: number;
  eventTypeId?: number;
  eventType?: CalBookingEventType;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  attendees: CalBookingAttendee[];
}

export interface CalBookingsPagination {
  totalItems: number;
  remainingItems: number;
  returnedItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListBookingsInput {
  status?: CalBookingStatusFilter;
  attendeeEmail?: string;
  attendeeName?: string;
  bookingUid?: string;
  eventTypeIds?: string;
  eventTypeId?: string;
  teamIds?: string;
  teamId?: string;
  afterStart?: string;
  beforeEnd?: string;
  afterCreatedAt?: string;
  beforeCreatedAt?: string;
  afterUpdatedAt?: string;
  beforeUpdatedAt?: string;
  sortStart?: CalBookingSortOrder;
  sortEnd?: CalBookingSortOrder;
  sortCreated?: CalBookingSortOrder;
  sortUpdatedAt?: CalBookingSortOrder;
  take?: number;
  skip?: number;
}
