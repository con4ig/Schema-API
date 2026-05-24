// ─── Client-Side Domain Types ────────────────────────────────

export interface Invoice {
  _id: string;
  vendor_name: string;
  date?: string;
  total_net: number;
  total_gross?: number;
  category?: string;
  anomaly_detected?: string | null;
  original_filename?: string;
  image_data?: string;
  mime_type?: string;
  buyer_nip?: string | null;
  status: "approved" | "pending" | "rejected";
  isArchived: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

export interface Settings {
  company_nip: string | null;
  default_vat_rate: number;
  custom_categories: string[];
}

// ─── Component Prop Types ────────────────────────────────────

export interface UploadProps {
  onUploadSuccess: (invoice: Invoice) => void;
}

export interface StatsProps {
  invoices: Invoice[];
  showArchived: boolean;
}

export interface InvoiceListProps {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}

export interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onUpdate: (updatedInvoice?: Invoice) => void;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  fetchNotifications?: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}
