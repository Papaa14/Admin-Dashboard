import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import api from '../../Api/api'; // Assuming your api setup is in this path
import { showErrorToast } from '../../components/ui/alert/ToastMessages'; // Assuming this path

// 1. INTERFACES
// =================================================================
interface Ticket {
  id: number;
  user_id: number;
  contact_channel: string;
  issuetype: string;
  description: string;
  session_status: 'pending' | 'underReview' | 'closed';
  filepath: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: number | null;
}

interface PaginatedData {
  data: Ticket[];
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  error: string | null;
}

// 2. HELPER FUNCTION
// =================================================================
const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

// 3. REACT COMPONENT
// =================================================================
export default function RecentOrders() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchRecentTickets = async () => {
      setIsLoading(true);
      const url = `/tickets?per_page=7`;

      try {
        const response = await api.get<ApiResponse<PaginatedData>>(url);
        if (response.data.status === 'success' && response.data.data?.data) {
          setTickets(response.data.data.data);
        } else {
          setTickets([]); // Clear tickets on error or if none are found
        }
      } catch (error: unknown) {
        setTickets([]); // Clear tickets on catch
        const message = isAxiosError(error) ? error.response?.data?.message : 'An error occurred';
        showErrorToast(message || 'Failed to fetch tickets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTickets();
  }, []); // Empty dependency array since we're no longer filtering

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Tickets
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tickets')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            See all
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ticket ID</TableCell>
              <TableCell className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Channel</TableCell>
              <TableCell className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Issue Type</TableCell>
              <TableCell className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-gray-500 dark:text-gray-400">Loading tickets...</TableCell></TableRow>
            ) : tickets.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-gray-500 dark:text-gray-400">No tickets found.</TableCell></TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                   <TableCell className="py-3">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">#{ticket.id}</p>
                   </TableCell>
                   <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{ticket.contact_channel}</TableCell>
                   <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{ticket.issuetype}</TableCell>
                   <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Badge size="sm" color={ticket.session_status === "underReview" ? "warning" : ticket.session_status === "pending" ? "error" : "success"}>
                        {ticket.session_status}
                      </Badge>
                   </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}