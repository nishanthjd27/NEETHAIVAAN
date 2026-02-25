// path: client/src/utils/statusBadge.ts
// Returns Tailwind colour classes for each complaint status.

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'Submitted':    'bg-blue-100 text-blue-800',
    'Under Review': 'bg-yellow-100 text-yellow-800',
    'In Progress':  'bg-purple-100 text-purple-800',
    'Escalated':    'bg-red-100 text-red-800',
    'Resolved':     'bg-green-100 text-green-800',
    'Closed':       'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    'Low':      'bg-green-100 text-green-700',
    'Medium':   'bg-yellow-100 text-yellow-700',
    'High':     'bg-orange-100 text-orange-700',
    'Critical': 'bg-red-100 text-red-800',
  };
  return map[priority] || 'bg-gray-100 text-gray-700';
}
