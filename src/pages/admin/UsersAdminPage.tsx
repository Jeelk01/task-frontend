import { useState } from "react";
import { useAppQuery } from "@/hooks/useGraphQL";
import { GET_USERS } from "@/graphql/queries";
import { motion } from "framer-motion";
import { Users, Search, Filter, Loader2, CheckCircle2, XCircle, Mail, Shield, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PaginatedResponse, User as UserType } from "@/types";

function formatDate(dt: string) {
     return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(dt));
}

export default function UsersAdminPage() {
     const [page, setPage] = useState(1);
     const [search, setSearch] = useState("");
     const [roleFilter, setRoleFilter] = useState<string>("all");

     const { data, loading, refetch } = useAppQuery<{
          findUserWithPagination: PaginatedResponse<UserType>;
     }>(GET_USERS, {
          variables: {
               input: {
                    page,
                    limit: 15,
                    email: search || undefined,
                    role: roleFilter !== "all" ? roleFilter : undefined,
               },
          },
     });

     const users = data?.findUserWithPagination?.items ?? [];
     const totalItems = data?.findUserWithPagination?.totalItems ?? 0;
     const totalPages = data?.findUserWithPagination?.totalPages ?? 1;

     return (
          <div className="p-6 space-y-6">
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                    <div>
                         <h1 className="text-2xl font-bold text-bark flex items-center gap-2">
                              <Users className="h-6 w-6 text-sage" />
                              Users
                         </h1>
                         <p className="text-tan text-sm mt-1">{totalItems} user{totalItems !== 1 ? "s" : ""} total</p>
                    </div>
               </motion.div>

               {/* Filters */}
               <div className="flex gap-3">
                    <div className="relative flex-1 max-w-sm">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                         <Input
                              placeholder="Search by email..."
                              value={search}
                              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                              className="pl-10 bg-white border-sand text-bark placeholder-tan focus:border-sage"
                         />
                    </div>
                    <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                         <SelectTrigger className="w-32 bg-white border-sand text-bark focus:border-sage">
                              <SelectValue placeholder="Role" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-sand text-bark">
                              <SelectItem value="all">All roles</SelectItem>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                         </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="border-sand text-bark hover:bg-sand hover:text-sage">
                         <Filter className="h-4 w-4 mr-1.5" />Refresh
                    </Button>
               </div>

               {/* Table */}
               {loading ? (
                    <div className="flex items-center justify-center py-24">
                         <Loader2 className="h-8 w-8 text-sage animate-spin" />
                    </div>
               ) : users.length === 0 ? (
                    <div className="text-center py-24 text-tan">
                         <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                         <p className="text-sm">No users found</p>
                    </div>
               ) : (
                    <div className="bg-white border border-sand rounded-2xl overflow-hidden shadow-sm">
                         <div className="overflow-x-auto">
                              <table className="w-full">
                                   <thead>
                                        <tr className="border-b border-sand bg-cream">
                                             <th className="text-left px-5 py-3.5 text-xs font-semibold text-tan uppercase tracking-wider">User</th>
                                             <th className="text-left px-5 py-3.5 text-xs font-semibold text-tan uppercase tracking-wider">Role</th>
                                             <th className="text-left px-5 py-3.5 text-xs font-semibold text-tan uppercase tracking-wider">Status</th>
                                             <th className="text-left px-5 py-3.5 text-xs font-semibold text-tan uppercase tracking-wider">Verified</th>
                                             <th className="text-left px-5 py-3.5 text-xs font-semibold text-tan uppercase tracking-wider">Created</th>
                                        </tr>
                                   </thead>
                                   <tbody className="divide-y divide-sand">
                                        {users.map((user, i) => (
                                             <motion.tr
                                                  key={user._id}
                                                  initial={{ opacity: 0 }}
                                                  animate={{ opacity: 1 }}
                                                  transition={{ delay: i * 0.03 }}
                                                  className="hover:bg-cream/60 transition-colors"
                                             >
                                                  <td className="px-5 py-4">
                                                       <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center flex-shrink-0">
                                                                 <span className="text-sage font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                 <p className="text-sm font-medium text-bark truncate">{user.name}</p>
                                                                 <p className="text-xs text-tan flex items-center gap-1 truncate">
                                                                      <Mail className="h-3 w-3 flex-shrink-0" />{user.email}
                                                                 </p>
                                                            </div>
                                                       </div>
                                                  </td>
                                                  <td className="px-5 py-4">
                                                       <Badge className={cn(
                                                            "text-xs border",
                                                            user.role === "ADMIN"
                                                                 ? "bg-sage/10 text-sage border-sage/20"
                                                                 : "bg-sand text-tan border-sand-dark"
                                                       )}>
                                                            {user.role === "ADMIN"
                                                                 ? <><Shield className="h-3 w-3 mr-1" />Admin</>
                                                                 : <><User className="h-3 w-3 mr-1" />User</>}
                                                       </Badge>
                                                  </td>
                                                  <td className="px-5 py-4">
                                                       <Badge className={cn(
                                                            "text-xs border",
                                                            user.isActive
                                                                 ? "bg-sage/10 text-sage border-sage/20"
                                                                 : "bg-red-50 text-red-500 border-red-200"
                                                       )}>
                                                            {user.isActive
                                                                 ? <><CheckCircle2 className="h-3 w-3 mr-1" />Active</>
                                                                 : <><XCircle className="h-3 w-3 mr-1" />Inactive</>}
                                                       </Badge>
                                                  </td>
                                                  <td className="px-5 py-4">
                                                       {user.isVerified ? (
                                                            <span className="flex items-center gap-1 text-xs text-sage">
                                                                 <CheckCircle2 className="h-3.5 w-3.5" />Verified
                                                            </span>
                                                       ) : (
                                                            <span className="flex items-center gap-1 text-xs text-amber-600">
                                                                 <XCircle className="h-3.5 w-3.5" />Pending
                                                            </span>
                                                       )}
                                                  </td>
                                                  <td className="px-5 py-4 text-xs text-tan">{formatDate(user.createdAt)}</td>
                                             </motion.tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    </div>
               )}

               {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                         <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                              className="border-sand text-bark hover:bg-sand">Previous</Button>
                         <span className="text-tan text-sm">Page {page} of {totalPages}</span>
                         <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                              className="border-sand text-bark hover:bg-sand">Next</Button>
                    </div>
               )}
          </div>
     );
}
