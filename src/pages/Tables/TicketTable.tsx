import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { Edit2, Trash2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../Api/api';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../components/ui/alert/ToastMessages';

// 1. INTERFACES FOR TYPE SAFETY
// =================================================================

// Defines the structure of a single ticket object
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

// Defines the structure of the pagination metadata from the API
interface PaginationInfo {
  current_page: number;
  from: number;
  to: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  path: string;
  per_page: number;
}

// Defines the structure of the 'data' object in the API response, which includes pagination
interface PaginatedData extends PaginationInfo {
  data: Ticket[];
}

// Defines the top-level structure of the entire API response
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  error: string | null;
}

// 2. HELPER FUNCTIONS
// =================================================================

// Type guard to check if an error is an Axios error with a response
const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

// 3. REACT COMPONENT
// =================================================================

const TicketTable = () => {
  // --- STATE MANAGEMENT ---
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');

  const navigate = useNavigate();

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchTickets = async (page: number) => {
      setIsLoading(true);
      try {
        const response = await api.get<ApiResponse<PaginatedData>>(`/tickets?page=${page}`);
        if (response.data.status === 'success' && response.data.data) {       
          // Separate pagination details from the ticket array for easier state management
          const { data:ticketData, ...paginationDetails } = response.data.data;
          setTickets(ticketData);
          setPaginationInfo(paginationDetails);
        } else {
          showErrorToast(response.data.error || 'Failed to fetch tickets');
        }
      } catch (error: unknown) {
        const message = isAxiosError(error) ? error.response?.data?.message : 'An error occurred while fetching tickets';
        showErrorToast(message || 'Failed to fetch tickets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets(currentPage);
  }, [currentPage]); // Re-run effect when currentPage changes

  // --- EVENT HANDLERS ---
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      // NOTE: Assuming an endpoint like `/tickets/update-status/{id}` exists
      const response = await api.put<ApiResponse<Ticket>>(`/tickets/${id}`, {
        session_status: newStatus,
      });

      if (response.data.status === 'success') {
        setTickets(tickets.map(ticket =>
          ticket.id === id ? { ...ticket, session_status: newStatus } : ticket
        ));
        showSuccessToast('Ticket status updated successfully');
      } else {
        showErrorToast(response.data.error || 'Failed to update status');
      }
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'An error occurred';
      showErrorToast(message || 'Failed to update status');
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = (id: number) => {
    confirmDelete('Are you sure you want to delete this ticket?', async () => {
      try {
        // NOTE: Assuming a DELETE endpoint like `/tickets/delete/{id}` exists
        const response = await api.delete<ApiResponse<null>>(`/tickets/${id}`);

        if (response.data.status === 'success') {
          setTickets(tickets.filter(ticket => ticket.id !== id));
          showSuccessToast('Ticket deleted successfully');
        } else {
          showErrorToast(response.data.error || 'Failed to delete ticket');
        }
      } catch (error: unknown) {
        const message = isAxiosError(error) ? error.response?.data?.message : 'An error occurred';
        showErrorToast(message || 'Failed to delete ticket');
      }
    });
  };
  
  const handleRowClick = (ticket: Ticket) => {
    navigate('/ticket-chat', { state: { ticket } });
  };
  
  const handlePrevPage = () => {
    if (paginationInfo?.prev_page_url) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleNextPage = () => {
     if (paginationInfo?.next_page_url) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // --- JSX RENDER ---
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
            <TableRow>
              <TableCell className="px-5 py-3 font-medium text-start text-slate-600 dark:text-slate-300">ID</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start text-slate-600 dark:text-slate-300">Contact Channel</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start text-slate-600 dark:text-slate-300">Issue Type</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start text-slate-600 dark:text-slate-300">Description</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start text-slate-600 dark:text-slate-300">Status</TableCell>
              <TableCell className="px-5 py-3 font-medium text-start text-slate-600 dark:text-slate-300">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">Loading tickets...</TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
               <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">No tickets found.</TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell className="px-5 py-4 text-start"><div className="cursor-pointer font-medium text-slate-800 dark:text-slate-200" onClick={() => handleRowClick(ticket)}>{ticket.id}</div></TableCell>
                  <TableCell className="px-4 py-3 text-start text-slate-600 dark:text-slate-400"><div className="cursor-pointer" onClick={() => handleRowClick(ticket)}>{ticket.contact_channel}</div></TableCell>
                  <TableCell className="px-4 py-3 text-start text-slate-600 dark:text-slate-400"><div className="cursor-pointer" onClick={() => handleRowClick(ticket)}>{ticket.issuetype}</div></TableCell>
                  <TableCell className="px-4 py-3 text-start text-slate-600 dark:text-slate-400"><div className="cursor-pointer truncate max-w-xs" onClick={() => handleRowClick(ticket)}>{ticket.description}</div></TableCell>
                  <TableCell className="px-4 py-3 text-start text-slate-600 dark:text-slate-400">
                    {editingId === ticket.id ? (
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} onClick={(e) => e.stopPropagation()} className="border border-slate-300 rounded p-1 cursor-pointer bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="pending">Pending</option>
                        <option value="underReview">Under Review</option>
                        <option value="closed">Closed</option>
                      </select>
                    ) : (
                      <Badge size="sm" color={ticket.session_status === "underReview" ? "warning" : ticket.session_status === "pending" ? "error" : "success"}>{ticket.session_status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-slate-600 dark:text-slate-400">
                    {editingId === ticket.id ? (
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, editStatus);}} className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 rounded"><Save size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null);}} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(ticket.id); setEditStatus(ticket.session_status);}} className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id);}} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {paginationInfo && tickets.length > 0 && (
         <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex flex-1 justify-between sm:hidden">
             <button onClick={handlePrevPage} disabled={!paginationInfo.prev_page_url || isLoading} className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600">Previous</button>
             <button onClick={handleNextPage} disabled={!paginationInfo.next_page_url || isLoading} className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600">Next</button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div><p className="text-sm text-slate-700 dark:text-slate-400">Showing <span className="font-medium">{paginationInfo.from}</span> to <span className="font-medium">{paginationInfo.to}</span></p></div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button onClick={handlePrevPage} disabled={!paginationInfo.prev_page_url || isLoading} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"><span className="sr-only">Previous</span><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
                <button onClick={handleNextPage} disabled={!paginationInfo.next_page_url || isLoading} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"><span className="sr-only">Next</span><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTable;