// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
// @ts-ignore
import { Calendar } from "../../components/ui/calendar";
// @ts-ignore
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
// @ts-ignore
import { format } from "date-fns";
// @ts-ignore
import { id } from "date-fns/locale";
// @ts-ignore
import { CalendarIcon, CheckCircle, Clock, ListTodo, Loader2, Plus, User } from "lucide-react";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

interface SambatanTask {
  id: string;
  conversation_id: string;
  sambatan_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: {
    full_name: string;
    avatar_url: string | null;
  };
  creator?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface TaskManagerProps {
  conversationId: string;
  sambatanId: string;
}

export default function TaskManager({ conversationId, sambatanId }: TaskManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<SambatanTask[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee_id: "",
    due_date: null as Date | null,
    status: "pending" as SambatanTask["status"],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "cancelled">("all");

  useEffect(() => {
    if (!user) return;
    fetchTasks();
    fetchParticipants();
  }, [user, conversationId, sambatanId, filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("sambatan_tasks")
        .select(`
          *,
          assignee:assignee_id(full_name, avatar_url),
          creator:created_by(full_name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .eq("sambatan_id", sambatanId);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      query = query.order("due_date", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar tugas. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("private_conversation_participants")
        .select(`
          user_id,
          user:users(id, full_name, avatar_url)
        `)
        .eq("conversation_id", conversationId);

      if (error) throw error;
      setParticipants(data?.map(p => p.user) || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!user || !newTask.title) return;

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase.from("sambatan_tasks").insert({
        conversation_id: conversationId,
        sambatan_id: sambatanId,
        title: newTask.title,
        description: newTask.description || null,
        assignee_id: newTask.assignee_id || null,
        status: newTask.status,
        due_date: newTask.due_date ? newTask.due_date.toISOString() : null,
        created_by: user.id,
      }).select();

      if (error) throw error;

      toast({
        title: "Tugas Dibuat",
        description: "Tugas baru berhasil dibuat.",
      });

      // Create system message about new task
      await supabase.from("private_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `<p><em>Tugas baru dibuat: ${newTask.title}</em></p>`,
        is_system_message: true,
      });

      setShowNewTaskDialog(false);
      setNewTask({
        title: "",
        description: "",
        assignee_id: "",
        due_date: null,
        status: "pending",
      });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Gagal membuat tugas. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: SambatanTask["status"]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("sambatan_tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Status Diperbarui",
        description: "Status tugas berhasil diperbarui.",
      });

      // Create system message about status update
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await supabase.from("private_messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `<p><em>Status tugas "${task.title}" diubah menjadi ${getStatusLabel(newStatus)}</em></p>`,
          is_system_message: true,
        });
      }

      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status tugas. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: SambatanTask["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Menunggu</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sedang Dikerjakan</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Selesai</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: SambatanTask["status"]) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "in_progress": return "Sedang Dikerjakan";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <ListTodo className="h-5 w-5 mr-2 text-blue-600" />
          Tugas Sambatan
        </h3>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewTaskDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tugas Baru
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <ListTodo className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Belum ada tugas untuk Sambatan ini</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setShowNewTaskDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Tugas Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="p-4 border rounded-md hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                </div>
                <div>
                  {getStatusBadge(task.status)}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  {task.assignee_id ? (
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-500 mr-1" />
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage
                            src={
                              task.assignee?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee_id}`
                            }
                            alt={task.assignee?.full_name || ""}
                          />
                          <AvatarFallback>
                            {task.assignee?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {task.assignee?.full_name || "Pengguna"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Belum ditugaskan
                    </div>
                  )}
                  
                  {task.due_date && (
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(task.due_date), "d MMMM yyyy", { locale: id })}
                    </div>
                  )}
                </div>
                
                {task.status !== "completed" && task.status !== "cancelled" && (
                  <div className="flex gap-2">
                    {task.status === "pending" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                      >
                        Mulai Kerjakan
                      </Button>
                    )}
                    {task.status === "in_progress" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Tandai Selesai
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Tugas Baru</DialogTitle>
            <DialogDescription>
              Tambahkan tugas baru untuk Sambatan ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Judul Tugas
              </label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Masukkan judul tugas"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Deskripsi (Opsional)
              </label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Masukkan deskripsi tugas"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="assignee" className="text-sm font-medium">
                Ditugaskan Kepada (Opsional)
              </label>
              <Select
                value={newTask.assignee_id}
                onValueChange={(value) => setNewTask({ ...newTask, assignee_id: value })}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Pilih peserta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Belum ditugaskan</SelectItem>
                  {participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="due-date" className="text-sm font-medium">
                Tenggat Waktu (Opsional)
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="due-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.due_date ? (
                      format(newTask.due_date, "PPP", { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newTask.due_date || undefined}
                    onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewTaskDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTask.title || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Tugas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


