import { useEffect, useState } from "react";
import api from "../../Api/api"; // Your API instance


import { TaskIcon } from "../../icons";

// Your provided Axios error type guard
const isAxiosError = (
  error: unknown
): error is { response?: { data?: { message?: string } } } => {
  return typeof error === "object" && error !== null && "response" in error;
};

// Define a type for our stats for better autocompletion and type safety
interface TicketStats {
  total: number;
  pending: number;
  underReview: number;
  closed: number;
}

export default function TicketMetrics() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketStats = async () => {
      try {
        setLoading(true);
        const response = await api.get("/tickets/count"); // Replace with your endpoint
        
        const data = response.data.data;

        const pendingCount = data.total_per_status.pending || 0;
        const underReviewCount = data.total_per_status.underReview || 0;
        const closedCount = data.total - (pendingCount + underReviewCount);

        setStats({
          total: data.total,
          pending: pendingCount,
          underReview: underReviewCount,
          closed: closedCount >= 0 ? closedCount : 0,
        });
        setError(null);
      } catch (err) {
        if (isAxiosError(err)) {
          setError(
            err.response?.data?.message || "An unknown API error occurred."
          );
        } else {
          setError("An unexpected error occurred while fetching data.");
        }
        console.error("Failed to fetch ticket stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500 dark:text-gray-400">
        Loading Metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-100 border border-red-300 rounded-2xl dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return null; // Or a "No data" message
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
      {/* <!-- Card 1: Total Tickets --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <TaskIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total Tickets
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {stats.total}
          </h4>
        </div>
      </div>

      {/* <!-- Card 2: Status Breakdown --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h5 className="font-semibold text-gray-800 dark:text-white/90">
          Ticket Status
        </h5>
        
        {/* Status List */}
        <div className="mt-4 flex flex-col gap-4">
          {/* Pending */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="block w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pending
              </span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-white/90">
              {stats.pending}
            </span>
          </div>

          {/* Under Review */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="block w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Under Review
              </span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-white/90">
              {stats.underReview}
            </span>
          </div>

          {/* Closed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="block w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Closed
              </span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-white/90">
              {stats.closed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}