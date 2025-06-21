import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { Edit2, Trash2, Save, X } from 'lucide-react';

// Define the structure of a ticket
interface Ticket {
  id: number;
  user_id: number;
  contact_channel: string;
  issuetype: string;
  description: string;
  session_status: string;
  filepath: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: number | null;
}

// Sample data
const sampleTickets: Ticket[] = [
  {
    id: 1,
    user_id: 1,
    contact_channel: "email",
    issuetype: "technical issue",
    description: "Unable to login to my account...",
    session_status: "underReview",
    filepath: null,
    created_at: "2025-06-07 09:50:29",
    updated_at: "2025-06-10 14:33:22",
    deleted_at: null,
    deleted_by: 13,
  },
  {
    id: 2,
    user_id: 5,
    contact_channel: "email",
    issuetype: "technical issue",
    description: "Unable to login to purchase hotspot packages",
    session_status: "underReview",
    filepath: null,
    created_at: "2025-06-07 09:53:20",
    updated_at: "2025-06-07 09:53:20",
    deleted_at: null,
    deleted_by: 0,
  },
];

const TicketTable = () => {
  const [tickets, setTickets] = useState<Ticket[]>(sampleTickets);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');

  const navigate = useNavigate();

  const handleStatusChange = (id: number, newStatus: string) => {
    setTickets(tickets.map(ticket =>
      ticket.id === id ? { ...ticket, session_status: newStatus } : ticket
    ));
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setTickets(tickets.filter(ticket => ticket.id !== id));
  };

  const handleRowClick = (ticket: Ticket) => {
    navigate('/ticket-chat', { state: { ticket } });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell className="px-5 py-3 font-medium text-start">ID</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start">Contact Channel</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start">Issue Type</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start">Description</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start">Status</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-gray-50">
                <TableCell className="px-5 py-4 text-start">
                  <div className="cursor-pointer" onClick={() => handleRowClick(ticket)}>{ticket.id}</div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                  <div className="cursor-pointer" onClick={() => handleRowClick(ticket)}>{ticket.contact_channel}</div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                  <div className="cursor-pointer" onClick={() => handleRowClick(ticket)}>{ticket.issuetype}</div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                  <div className="cursor-pointer" onClick={() => handleRowClick(ticket)}>{ticket.description}</div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                  {editingId === ticket.id ? (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="border rounded p-1 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="underReview">Under Review</option>
                      <option value="closed">Closed</option>
                    </select>
                  ) : (
                    <Badge
                      size="sm"
                      color={
                        ticket.session_status === "underReview"
                          ? "success"
                          : ticket.session_status === "pending"
                          ? "warning"
                          : "error"
                      }
                    >
                      {ticket.session_status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                  {editingId === ticket.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(ticket.id, editStatus);
                        }}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(ticket.id);
                          setEditStatus(ticket.session_status);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ticket.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TicketTable;
