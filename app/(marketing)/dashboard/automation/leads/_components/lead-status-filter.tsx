"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LEAD_PIPELINE_STATUS_LABELS,
  LEAD_PIPELINE_STATUSES,
  type LeadPipelineStatus,
} from "@/lib/utils/lead-pipeline-status";

export type LeadStatusFilterValue = LeadPipelineStatus | "all";

const FILTER_ITEMS: Array<{ value: LeadStatusFilterValue; label: string }> = [
  { value: "all", label: "All Statuses" },
  ...LEAD_PIPELINE_STATUSES.map((status) => ({ value: status, label: LEAD_PIPELINE_STATUS_LABELS[status] })),
];

interface LeadStatusFilterProps {
  value: LeadStatusFilterValue;
  onChange: (value: LeadStatusFilterValue) => void;
}

export function LeadStatusFilter({ value, onChange }: LeadStatusFilterProps) {
  return (
    <Select
      items={FILTER_ITEMS}
      value={value}
      onValueChange={(next) => onChange((next ?? "all") as LeadStatusFilterValue)}
    >
      <SelectTrigger aria-label="Filter by pipeline status" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FILTER_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
