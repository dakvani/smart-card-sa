import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Plus, X, ChevronDown, ChevronRight, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface LinkGroup {
  id: string;
  user_id: string;
  name: string;
  position: number;
  is_collapsed: boolean;
}

interface LinkGroupManagerProps {
  groups: LinkGroup[];
  onAddGroup: (name: string) => Promise<void>;
  onUpdateGroup: (id: string, updates: Partial<LinkGroup>) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export function LinkGroupManager({
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
}: LinkGroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    
    await onAddGroup(newGroupName.trim());
    setNewGroupName("");
    setIsDialogOpen(false);
  };

  const handleStartEdit = (group: LinkGroup) => {
    setEditingId(group.id);
    setEditName(group.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdateGroup(id, { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span>Link Groups</span>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Link Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Group name (e.g., Social, Products)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
              />
              <Button onClick={handleAddGroup} variant="gradient" className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No groups yet. Create groups to organize your links.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border"
            >
              <button
                onClick={() => onUpdateGroup(group.id, { is_collapsed: !group.is_collapsed })}
                className="p-1 hover:bg-secondary rounded"
              >
                {group.is_collapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              <Folder className="w-4 h-4 text-primary flex-shrink-0" />
              
              {editingId === group.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleSaveEdit(group.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(group.id)}
                  className="h-7 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 text-sm font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleStartEdit(group)}
                >
                  {group.name}
                </span>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDeleteGroup(group.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
