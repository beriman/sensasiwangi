// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { Button } from "../../components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
// @ts-ignore
import { VoteType } from "../../types/forum";

interface ReplyActionsProps {
  replyId: string;
  isAuthor: boolean;
  userVote: VoteType | null;
  voteCount: { cendol: number; bata: number };
  onVote: (voteType: VoteType) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ReplyActions({
  replyId,
  isAuthor,
  userVote,
  voteCount,
  onVote,
  onEdit,
  onDelete,
}: ReplyActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="flex justify-end space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center ${userVote === "cendol" ? "text-green-600 bg-green-50" : "text-gray-600"}`}
        onClick={() => onVote("cendol")}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        Cendol ({voteCount.cendol || 0})
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center ${userVote === "bata" ? "text-red-600 bg-red-50" : "text-gray-600"}`}
        onClick={() => onVote("bata")}
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        Bata ({voteCount.bata || 0})
      </Button>

      {isAuthor && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center text-blue-600 hover:bg-blue-50"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your reply.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}


