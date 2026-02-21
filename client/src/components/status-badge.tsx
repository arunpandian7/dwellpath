import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, { label: string, className: string }> = {
    shortlisted: {
      label: "Shortlisted",
      className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    },
    visited: {
      label: "Visited",
      className: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
    },
    offered: {
      label: "Offer Made",
      className: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    },
    accepted: {
      label: "Accepted",
      className: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
    },
  };

  const config = variants[status.toLowerCase()] || { 
    label: status, 
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200" 
  };

  return (
    <Badge variant="outline" className={`px-2.5 py-0.5 rounded-lg border font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
