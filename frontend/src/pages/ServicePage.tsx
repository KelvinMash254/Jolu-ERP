import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '../services/api';
import { PageHeader, LoadingSpinner, StatusBadge } from '../components/ui/Shared';
import type { ServiceTicket } from '../types';
import { useState } from 'react';
import ServiceTicketModal from '../components/ServiceTicketModal';
import toast from 'react-hot-toast';

export default function ServicePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['service-tickets'],
    queryFn: () => serviceApi.getTickets(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => serviceApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tickets'] });
      setIsModalOpen(false);
      toast.success('Ticket created');
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => serviceApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tickets'] });
      toast.success('Status updated');
    },
  });

  const tickets = (data?.data?.data || []) as ServiceTicket[];

  return (
    <div>
      <PageHeader 
        title="After Sales Service" 
        subtitle="Service tickets, technician assignments, and performance" 
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">New Ticket</button>
        } 
      />

      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="card flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-sm text-gray-500">{ticket.ticketNumber}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="font-medium mb-2">{ticket.problem}</p>
                  {ticket.customer && <p className="text-sm text-gray-600">{ticket.customer.name} · {ticket.customer.phone}</p>}
                  {ticket.machineryUnit && <p className="text-sm text-gray-500 mt-1">Unit: {ticket.machineryUnit.productName} ({ticket.machineryUnit.serialNumber})</p>}
                  {ticket.vehicle && <p className="text-sm text-gray-500 mt-1">Vehicle: {ticket.vehicle.make} {ticket.vehicle.model} ({ticket.vehicle.registrationNumber})</p>}
                  {ticket.technician && <p className="text-sm text-jolu-600 mt-2">Tech: {ticket.technician.firstName} {ticket.technician.lastName}</p>}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <select 
                    className="w-full text-xs rounded border-gray-300"
                    value={ticket.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            ))}
            {!tickets.length && <p className="col-span-full text-center text-gray-500 py-12">No service tickets</p>}
          </div>
        )}
      </div>

      <ServiceTicketModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
