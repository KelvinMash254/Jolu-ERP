import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../services/api';
import { PageHeader, LoadingSpinner, StatusBadge } from '../components/ui/Shared';
import type { ServiceTicket } from '../types';

export default function ServicePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['service-tickets'],
    queryFn: () => serviceApi.getTickets(),
  });

  const tickets = (data?.data?.data || []) as ServiceTicket[];

  return (
    <div>
      <PageHeader title="After Sales Service" subtitle="Service tickets, technician assignments, and performance" actions={<button className="btn-primary">New Ticket</button>} />

      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-sm text-gray-500">{ticket.ticketNumber}</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="font-medium mb-2">{ticket.problem}</p>
                {ticket.customer && <p className="text-sm text-gray-600">{ticket.customer.name} · {ticket.customer.phone}</p>}
                {ticket.technician && <p className="text-sm text-jolu-600 mt-2">Tech: {ticket.technician.firstName} {ticket.technician.lastName}</p>}
              </div>
            ))}
            {!tickets.length && <p className="col-span-full text-center text-gray-500 py-12">No service tickets</p>}
          </div>
        )}
      </div>
    </div>
  );
}
