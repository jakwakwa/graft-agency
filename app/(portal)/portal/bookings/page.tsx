import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { agentService } from "@/lib/services/agent.service";
import { type CalBookingSortOrder, calService, type ListBookingsInput } from "@/lib/services/cal.service";
import { type BookingSortKey, BookingsTable } from "./_components/bookings-table";

const PAGE_SIZE = 25;
const SORT_QUERY_PARAMS = {
  start: "sortStart",
  end: "sortEnd",
  created: "sortCreated",
  updated: "sortUpdatedAt",
} as const satisfies Record<BookingSortKey, keyof ListBookingsInput>;

interface BookingsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  return formatMonth(new Date());
}

function getMonthRange(month: string): { afterStart: string; beforeEnd: string; label: string } {
  const [yearValue, monthValue] = month.split("-");
  const year = Number.parseInt(yearValue ?? "", 10);
  const monthIndex = Number.parseInt(monthValue ?? "", 10) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

  return {
    afterStart: start.toISOString(),
    beforeEnd: end.toISOString(),
    label: new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" }).format(start),
  };
}

function parseSortKey(value: string | undefined): BookingSortKey {
  switch (value) {
    case "end":
    case "created":
    case "updated":
      return value;
    default:
      return "start";
  }
}

function parseSortOrder(value: string | undefined): CalBookingSortOrder {
  return value === "desc" ? "desc" : "asc";
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const params = (await searchParams) ?? {};
  const page = parsePage(firstParam(params.page));
  const month = parseMonth(firstParam(params.month));
  const sortKey = parseSortKey(firstParam(params.sort));
  const sortOrder = parseSortOrder(firstParam(params.order));
  const monthRange = getMonthRange(month);

  const agentConfigPromise = agentService.getConfig(clientId);
  const bookingsPromise = calService.listBookings({
    status: "upcoming",
    afterStart: monthRange.afterStart,
    beforeEnd: monthRange.beforeEnd,
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    [SORT_QUERY_PARAMS[sortKey]]: sortOrder,
  });

  const [agentConfig, bookingsResult] = await Promise.all([agentConfigPromise, bookingsPromise]);
  const calendarLabel = agentConfig.defaultEventSlug ?? agentConfig.calComUsername ?? "Cal.com";
  const bookings = "status" in bookingsResult && bookingsResult.status === "success" ? bookingsResult.data : [];
  const bookingsError = "error" in bookingsResult ? bookingsResult.error : undefined;
  const pagination =
    "status" in bookingsResult && bookingsResult.status === "success" ? bookingsResult.pagination : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8">
      <div className="flex flex-col gap-2">
        <Typography.H1>Bookings</Typography.H1>
        <Typography.Lead>View this month's upcoming bookings for {calendarLabel}.</Typography.Lead>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="text-primary" />
            {monthRange.label} bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingsTable
            bookings={bookings}
            error={bookingsError}
            month={month}
            pageSize={PAGE_SIZE}
            pagination={pagination}
            sortKey={sortKey}
            sortOrder={sortOrder}
          />
        </CardContent>
      </Card>
    </div>
  );
}
