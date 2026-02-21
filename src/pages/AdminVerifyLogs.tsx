import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Heart,
  Flame,
  Timer,
} from 'lucide-react';
import { format } from 'date-fns';

interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  admin_comment: string | null;
  created_at: string;
  log_type: 'cardio' | 'strength' | 'hiit' | 'tmarm';
  table_name: string;
  participant_name: string;
  unit: string;
  unit_category: string;
  status: 'pending' | 'verified' | 'flagged';
  // Cardio specific
  cardio_type?: string;
  distance?: number;
  distance_unit?: string;
  notes?: string;
  // Strength specific
  exercise_name?: string;
  sets?: number;
  reps_per_set?: number;
  weight_per_rep?: number;
  total_weight?: number;
  // HIIT/TMARM specific
  duration?: number;
  description?: string;
}

interface LogsResponse {
  logs: WorkoutLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminVerifyLogs() {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'verify' | 'flag';
    log: WorkoutLog | null;
  }>({ open: false, action: 'verify', log: null });
  const [flagComment, setFlagComment] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check admin status
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error || !data) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }

    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else {
        checkAdminStatus();
      }
    }
  }, [user, authLoading, navigate]);

  // Fetch logs
  useEffect(() => {
    async function fetchLogs() {
      if (!isAdmin || !session) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          status: statusFilter,
          type: typeFilter,
          page: page.toString(),
          limit: '20',
        });

        const { data, error } = await supabase.functions.invoke('admin-verify-logs', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: null,
        });

        // Use fetch directly since invoke doesn't support query params well
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify-logs?${params}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }

        const result: LogsResponse = await response.json();
        setLogs(result.logs);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast.error('Failed to load workout logs');
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin && session) {
      fetchLogs();
    }
  }, [isAdmin, session, statusFilter, typeFilter, page]);

  // Handle verify/flag action
  const handleAction = async () => {
    if (!actionDialog.log || !session) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logId: actionDialog.log.id,
            logType: actionDialog.log.log_type,
            action: actionDialog.action,
            comment: actionDialog.action === 'flag' ? flagComment : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update log');
      }

      toast.success(
        actionDialog.action === 'verify'
          ? 'Log verified successfully'
          : 'Log flagged successfully'
      );

      // Update local state
      setLogs(prev =>
        prev.map(log =>
          log.id === actionDialog.log?.id
            ? {
                ...log,
                verified: actionDialog.action === 'verify',
                status: actionDialog.action === 'verify' ? 'verified' : 'flagged',
                admin_comment: actionDialog.action === 'flag' ? flagComment : null,
              }
            : log
        )
      );

      setActionDialog({ open: false, action: 'verify', log: null });
      setFlagComment('');
    } catch (error) {
      console.error('Error updating log:', error);
      toast.error('Failed to update log');
    } finally {
      setProcessing(false);
    }
  };

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.participant_name.toLowerCase().includes(query) ||
      log.unit.toLowerCase().includes(query) ||
      log.id.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'flagged':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Flagged
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cardio':
        return <Timer className="w-4 h-4 text-blue-400" />;
      case 'strength':
        return <Dumbbell className="w-4 h-4 text-orange-400" />;
      case 'hiit':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'tmarm':
        return <Heart className="w-4 h-4 text-pink-400" />;
      default:
        return null;
    }
  };

  const getLogDetails = (log: WorkoutLog) => {
    switch (log.log_type) {
      case 'cardio':
        return `${log.distance} ${log.distance_unit} (${log.cardio_type?.replace('_', ' ')})`;
      case 'strength':
        return `${log.exercise_name}: ${log.sets}×${log.reps_per_set} @ ${log.weight_per_rep}lbs = ${log.total_weight}lbs`;
      case 'hiit':
        return `${log.duration} minutes${log.description ? ` - ${log.description}` : ''}`;
      case 'tmarm':
        return `${log.duration} minutes${log.description ? ` - ${log.description}` : ''}`;
      default:
        return 'N/A';
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background texture-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background texture-canvas">
        <Navbar />
        <section className="pt-24 pb-16">
          <div className="container px-4">
            <div className="glass rounded-2xl p-8 max-w-md mx-auto text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-heading font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You do not have admin privileges to access this page.
              </p>
              <Button asChild>
                <Link to="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8">
        <div className="container px-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">
                Admin <span className="text-gradient">Verification Panel</span>
              </h1>
              <p className="text-muted-foreground">
                Review and verify workout logs submitted by participants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-4">
        <div className="container px-4">
          <div className="glass rounded-xl p-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, unit, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-secondary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] bg-secondary/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="tmarm">TMAR-M</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {total} total logs
            </div>
          </div>
        </div>
      </section>

      {/* Logs Table */}
      <section className="pb-8">
        <div className="container px-4">
          <div className="glass rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No workout logs found matching your filters.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Participant</TableHead>
                        <TableHead className="text-muted-foreground">Unit</TableHead>
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Details</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={`${log.table_name}-${log.id}`} className="border-border">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(log.log_type)}
                              <span className="capitalize">{log.log_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{log.participant_name}</TableCell>
                          <TableCell className="text-muted-foreground">{log.unit || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(log.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={getLogDetails(log)}>
                            {getLogDetails(log)}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {log.status !== 'verified' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                                  onClick={() => setActionDialog({ open: true, action: 'verify', log })}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Verify
                                </Button>
                              )}
                              {log.status !== 'flagged' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                  onClick={() => setActionDialog({ open: true, action: 'flag', log })}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Flag
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                  {filteredLogs.map((log) => (
                    <div
                      key={`${log.table_name}-${log.id}`}
                      className="bg-secondary/30 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(log.log_type)}
                          <span className="capitalize font-medium">{log.log_type}</span>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Participant:</span> {log.participant_name}</p>
                        <p><span className="text-muted-foreground">Unit:</span> {log.unit || 'N/A'}</p>
                        <p><span className="text-muted-foreground">Date:</span> {format(new Date(log.date), 'MMM d, yyyy')}</p>
                        <p><span className="text-muted-foreground">Details:</span> {getLogDetails(log)}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {log.status !== 'verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-green-400 border-green-500/30"
                            onClick={() => setActionDialog({ open: true, action: 'verify', log })}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        {log.status !== 'flagged' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-400 border-red-500/30"
                            onClick={() => setActionDialog({ open: true, action: 'flag', log })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Flag
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 p-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="glass rounded-2xl p-6 border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Audit Trail:</strong> All verification actions are logged
              for accountability and compliance. Ensure thorough review before verifying or flagging entries.
            </p>
          </div>
        </div>
      </section>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ open: false, action: 'verify', log: null });
          setFlagComment('');
        }
      }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.action === 'verify' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Verify Workout Log
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  Flag Workout Log
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'verify'
                ? 'Confirm that this workout log is valid and accurate.'
                : 'Flag this workout log as invalid or requiring revision.'}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.log && (
            <div className="space-y-3 py-4">
              <div className="bg-secondary/50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Participant:</span> {actionDialog.log.participant_name}</p>
                <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{actionDialog.log.log_type}</span></p>
                <p><span className="text-muted-foreground">Date:</span> {format(new Date(actionDialog.log.date), 'MMM d, yyyy')}</p>
                <p><span className="text-muted-foreground">Details:</span> {getLogDetails(actionDialog.log)}</p>
              </div>

              {actionDialog.action === 'flag' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for flagging (required)</label>
                  <Textarea
                    placeholder="Enter reason for flagging this log..."
                    value={flagComment}
                    onChange={(e) => setFlagComment(e.target.value)}
                    className="bg-secondary/50 border-border"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, action: 'verify', log: null });
                setFlagComment('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionDialog.action === 'flag' && !flagComment.trim())}
              className={actionDialog.action === 'verify'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
              }
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : actionDialog.action === 'verify' ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {actionDialog.action === 'verify' ? 'Verify Log' : 'Flag Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
