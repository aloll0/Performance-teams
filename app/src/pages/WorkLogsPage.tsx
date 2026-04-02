import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock3, MessageSquareText, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { getMyWorkLogs, getTeamWorkLogs, reviewWorkLog, submitMyWorkLog } from '@/services/workLogApi';
import { getAllUsers } from '@/services/userApi';
import type { WorkLog } from '@/types';
import { toast } from 'sonner';

const makeToday = () => new Date().toISOString().split('T')[0];

const WorkLogsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isEmployee = user?.role === 'employee';

  const [date, setDate] = useState(makeToday());
  const [items, setItems] = useState([{ task: '', hours: '1', notes: '' }]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [reviewComment, setReviewComment] = useState<Record<string, string>>({});

  const myLogsQuery = useQuery({
    queryKey: ['myWorkLogs'],
    queryFn: async () => {
      const response = await getMyWorkLogs();
      return response.data as WorkLog[];
    },
    enabled: isEmployee
  });

  const teamLogsQuery = useQuery({
    queryKey: ['teamWorkLogs', date, selectedEmployeeId],
    queryFn: async () => {
      const response = await getTeamWorkLogs({
        date,
        employeeId: selectedEmployeeId === 'all' ? undefined : selectedEmployeeId
      });
      return response.data as WorkLog[];
    },
    enabled: !isEmployee
  });

  const employeesQuery = useQuery({
    queryKey: ['worklogEmployees'],
    queryFn: async () => {
      const response = await getAllUsers({ role: 'employee' });
      return response.data as Array<{ id?: string; _id?: string; name: string }>;
    },
    enabled: !isEmployee
  });

  const submitMutation = useMutation({
    mutationFn: submitMyWorkLog,
    onSuccess: () => {
      toast.success('Daily log saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['myWorkLogs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save daily log.');
    }
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, leaderComment }: { id: string; leaderComment: string }) => reviewWorkLog(id, { leaderComment }),
    onSuccess: () => {
      toast.success('Log marked as reviewed.');
      queryClient.invalidateQueries({ queryKey: ['teamWorkLogs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to review log.');
    }
  });

  const totalHours = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.hours || 0), 0),
    [items]
  );

  const addItem = () => setItems((prev) => [...prev, { task: '', hours: '1', notes: '' }]);

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, key: 'task' | 'hours' | 'notes', value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const submit = () => {
    if (totalHours > 7) {
      toast.error('You can submit maximum 7 hours per day.');
      return;
    }

    const cleaned = items
      .map((item) => ({
        task: item.task.trim(),
        notes: item.notes.trim(),
        hours: Number(item.hours)
      }))
      .filter((item) => item.task && item.hours > 0);

    if (cleaned.length === 0) {
      toast.error('Please add at least one task with hours.');
      return;
    }

    submitMutation.mutate({ date, items: cleaned });
  };

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Work Log</h1>
          <p className="text-white/60">Submit your daily tasks within 7 hours for team-leader review.</p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#F26B21]" />
              Daily Submission
            </CardTitle>
            <CardDescription className="text-white/60">What did you work on today?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            {items.map((item, index) => (
              <div key={index} className="p-4 rounded-lg border border-white/10 bg-white/5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-white">Task</Label>
                    <Input
                      value={item.task}
                      onChange={(e) => updateItem(index, 'task', e.target.value)}
                      placeholder="Example: Fixed checkout bug"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Hours</Label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      max="7"
                      value={item.hours}
                      onChange={(e) => updateItem(index, 'hours', e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeItem(index)}
                      className="w-full border-red-400/40 text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Notes (optional)</Label>
                  <Textarea
                    value={item.notes}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Quick details about outcome"
                  />
                </div>
              </div>
            ))}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <Button type="button" variant="outline" onClick={addItem} className="border-white/20 text-white hover:bg-white/10">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
              <div className="flex items-center gap-2 text-white">
                <Clock3 className="w-4 h-4 text-[#F26B21]" />
                <span>Total hours: {totalHours.toFixed(2)} / 7</span>
              </div>
            </div>

            <Button onClick={submit} disabled={submitMutation.isPending} className="w-full bg-[#F26B21] hover:bg-[#d85a1b] text-white">
              <Save className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? 'Saving...' : 'Submit Daily Log'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">My Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myLogsQuery.data?.map((log) => (
                <div key={log._id} className="p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{log.date}</span>
                    <span className="text-white/60">{log.totalHours}h</span>
                  </div>
                  <p className="text-white/50 text-xs mt-1">{log.items.length} tasks • status: {log.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Daily Logs</h1>
        <p className="text-white/60">Review employee daily tasks and add comments.</p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Employee</Label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 text-white"
            >
              <option value="all" className="text-black">All Employees</option>
              {employeesQuery.data?.map((employee) => {
                const id = employee.id || employee._id || '';
                return (
                  <option key={id} value={id} className="text-black">
                    {employee.name}
                  </option>
                );
              })}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {teamLogsQuery.data?.map((log) => {
          const employee = typeof log.employeeId === 'string' ? null : log.employeeId;
          return (
            <Card key={log._id} className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  <span>{employee?.name || 'Employee'} - {log.date}</span>
                  <span className="text-sm text-white/60">{log.totalHours}h</span>
                </CardTitle>
                <CardDescription className="text-white/60">{employee?.email} • {log.team}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {log.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded bg-white/5 border border-white/10">
                      <p className="text-white text-sm font-medium">{item.task} ({item.hours}h)</p>
                      {item.notes ? <p className="text-white/60 text-xs mt-1">{item.notes}</p> : null}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4 text-[#F26B21]" />
                    Leader Comment
                  </Label>
                  <Textarea
                    value={reviewComment[log._id] ?? log.leaderComment ?? ''}
                    onChange={(e) => setReviewComment((prev) => ({ ...prev, [log._id]: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                  <Button
                    onClick={() => reviewMutation.mutate({ id: log._id, leaderComment: reviewComment[log._id] ?? log.leaderComment ?? '' })}
                    disabled={reviewMutation.isPending}
                    className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                  >
                    Mark Reviewed
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WorkLogsPage;
