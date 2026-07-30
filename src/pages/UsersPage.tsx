import { useState, useCallback } from "react";
import { DataTable, type Column, type RowAction, type BulkAction } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppQuery } from "@/hooks/useGraphQL";
import { GET_USERS } from "@/graphql/queries";
import type { User, PaginatedResponse } from "@/types";

interface UserPaginationResponse extends PaginatedResponse<User> {
  code: number;
  success: boolean;
  message: string;
}

type UserWithId = User & { id: string };

const statusVariant: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/10 text-warning border-warning/20",
};

const columns: Column<UserWithId>[] = [
  { key: "name", label: "Name", className: "font-medium" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  {
    key: "isActive",
    label: "Status",
    render: (value) => {
      const status = value ? "active" : "inactive";
      return (
        <Badge variant="outline" className={statusVariant[status]}>
          {status}
        </Badge>
      );
    },
  },
  { 
    key: "createdAt", 
    label: "Created",
    render: (value) => new Date(value as string).toLocaleDateString()
  },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const { data, loading, refetch } = useAppQuery<{ findUserWithPagination: UserPaginationResponse }>(
    GET_USERS,
    {
      variables: {
        input: {
          page,
          limit: perPage,
          search: search || undefined,
        }
      }
    }
  );

  const usersResponse = data?.findUserWithPagination;
  const users: UserWithId[] = usersResponse?.items.map(u => ({ ...u, id: u._id })) ?? [];
  const total = usersResponse?.totalItems ?? 0;

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const rowActions: RowAction<UserWithId>[] = [
    { label: "View", icon: Eye, onClick: (row) => toast.info(`Viewing ${row.name}`) },
    { label: "Edit", icon: Edit, onClick: (row) => toast.info(`Editing ${row.name}`) },
    { label: "Delete", icon: Trash2, onClick: (row) => toast.error(`Deleted ${row.name}`), variant: "destructive" },
  ];

  const bulkActions: BulkAction<UserWithId>[] = [
    {
      label: "Delete",
      icon: Trash2,
      variant: "destructive",
      onClick: (rows) => toast.error(`Deleted ${rows.length} users`),
    },
  ];

  const handleExport = () => {
    const csv = [
      columns.map((c) => c.label).join(","),
      ...users.map((row) => columns.map((c) => (row as any)[c.key]).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions.</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-sage" />}
      </div>

      <DataTable
        data={users}
        columns={columns}
        total={total}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }}
        onSearch={handleSearch}
        searchPlaceholder="Search users..."
        rowActions={rowActions}
        bulkActions={bulkActions}
        onExport={handleExport}
      />
    </div>
  );
}
