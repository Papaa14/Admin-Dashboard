import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, X as XIcon, Loader2 } from 'lucide-react';
import api from '../../Api/api';
// FIX: Both toast messages are now used.
import { showSuccessToast, showErrorToast } from '../../components/ui/alert/ToastMessages';

// --- INTERFACES & HELPERS ---

interface Message {
  id: number;
  message_content: string;
  sender_id: number;
  created_at: string;
  file_url?: string;
  read_status: 0 | 1;
}

interface PaginationInfo {
  next_page_url: string | null;
}

// Assumed from a user context/auth state
const AGENT_USER_ID = 2; // Replace with actual logged-in agent's ID

const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error;
};


// --- COMPONENT ---

const TicketChatView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticket } = location.state || {};

  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- REFS FOR UI MANIPULATION ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA FETCHING & LIFECYCLE ---

  useEffect(() => {
    if (!ticket?.id) return;

    const fetchAndMarkMessages = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/messages/${ticket.id}/messages`);
        if (response.data.status === 'success') {
          const fetchedMessages: Message[] = response.data.data.data;
          // Check if the first message from the API is the same as the initial ticket description.
          // If it is, we create a new array without that first message
          const messagesToDisplay =
            fetchedMessages.length > 0 &&
              fetchedMessages[0].message_content === ticket.description
              ? fetchedMessages.slice(1) // Creates a new array starting from the second element
              : fetchedMessages;
          setMessages(messagesToDisplay);
          setPagination(response.data.data);

          const unreadUserMessageIds = fetchedMessages
            .filter(msg => msg.sender_id !== AGENT_USER_ID && msg.read_status === 0)
            .map(msg => msg.id);

          if (unreadUserMessageIds.length > 0) {
            await api.put(`/messages/${ticket.id}/read-status`, { message_ids: unreadUserMessageIds });
          }
        }

      } catch (_error: unknown) {
        const message = isAxiosError(_error) ? _error.response?.data?.message : 'An error occurred while fetching messages.';
        showErrorToast(message || 'Failed to load chat history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndMarkMessages();
  }, [ticket.description, ticket.id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);


  // --- EVENT HANDLERS ---

  const handleLoadMore = async () => {
    if (!pagination?.next_page_url || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await api.get(pagination.next_page_url);
      if (response.data.status === 'success') {
        const olderMessages: Message[] = response.data.data.data;
        setMessages(prev => [...olderMessages, ...prev]);
        setPagination(response.data.data);
      }

    } catch (_error: unknown) {
      const message = isAxiosError(_error) ? _error.response?.data?.message : 'An error occurred while loading older messages.';
      showErrorToast(message || 'Failed to load older messages.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) return;

    setIsSending(true);
    let uploadedFilePath: string | null = null;

    try {
      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        formData.append('user_id', String(AGENT_USER_ID));
        const uploadResponse = await api.post('/messages/upload-file', formData);
        if (uploadResponse.data.status === 'success') {
          uploadedFilePath = uploadResponse.data.data.filepath;
        } else {
          throw new Error(uploadResponse.data.error || 'File upload failed.');
        }
      }

      const messagePayload = {
        ticket_id: ticket.id,
        sender_id: AGENT_USER_ID,
        recipient_id: ticket.user_id,
        message_content: newMessage.trim(),
        filepath: uploadedFilePath,
      };

      const messageResponse = await api.post('/messages', messagePayload);
      if (messageResponse.data.status === 'success') {
        // Added a success toast for better user feedback.
        showSuccessToast('Message sent!');
        setMessages(prev => [...prev, messageResponse.data.data]);
        setNewMessage('');
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        throw new Error(messageResponse.data.error || 'Failed to send message.');
      }

    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : String(error);
      showErrorToast(message || 'An error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- RENDER LOGIC ---

  if (!ticket) {
    return <div>No ticket data available.</div>;
  }

  const isUserMessage = (msg: Message) => msg.sender_id !== AGENT_USER_ID;

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 p-4 flex items-center justify-between shadow-md border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-lg font-bold capitalize">{ticket.issuetype}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Ticket #{ticket.id}</p>
          </div>
        </div>
        <div className="text-right text-sm"><p className="text-slate-500 dark:text-slate-400">Status: <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.session_status}</span></p></div>
      </header>

      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : (
          <>
            {pagination?.next_page_url && (
              <div className="text-center">
                <button onClick={handleLoadMore} disabled={isLoadingMore} className="text-sm text-blue-600 hover:underline disabled:text-slate-400">
                  {isLoadingMore ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}

            <div className={`flex items-end gap-2 justify-start`}>
              <div className={`max-w-md px-4 py-3 rounded-2xl bg-blue-600 text-white rounded-bl-lg`}>
                {ticket.file_url && (
                  <a href={ticket.file_url} target="_blank" rel="noopener noreferrer" className="block mb-2"><img src={ticket.file_url} alt="User attachment" className="max-w-xs rounded-lg" /></a>
                )}
                <p className="text-sm font-semibold mb-1">Initial Issue:</p>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                <p className={`text-xs mt-2 text-right text-blue-200`}>{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
            </div>

            {messages.map((message) => (
              <div key={message.id} className={`flex items-end gap-2 ${isUserMessage(message) ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-md px-4 py-3 rounded-2xl ${isUserMessage(message) ? 'bg-blue-600 text-white rounded-bl-lg' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm rounded-br-lg'}`}>
                  {message.file_url && (
                    <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="block mb-2"><img src={message.file_url} alt="Attachment" className="max-w-xs rounded-lg" /></a>
                  )}
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.message_content}</p>
                  <p className={`text-xs mt-2 text-right ${isUserMessage(message) ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      <footer className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        {attachedFile && (
          <div className="mb-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-300 truncate">{attachedFile.name}</span>
            <button onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"><XIcon size={16} /></button>
          </div>
        )}
        <div className="flex items-center space-x-3">
          <input type="file" ref={fileInputRef} onChange={(e) => setAttachedFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"><Paperclip size={20} /></button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            rows={1}
            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 resize-none"
            style={{ minHeight: '42px' }}
          />
          <button onClick={handleSendMessage} disabled={isSending || (!newMessage.trim() && !attachedFile)} className="bg-blue-600 text-white p-2 w-[42px] h-[42px] flex items-center justify-center rounded-lg hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0">
            {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default TicketChatView;