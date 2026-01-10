import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FindReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFind?: (searchText: string) => void;
  onReplace?: (searchText: string, replaceText: string) => void;
  onReplaceAll?: (searchText: string, replaceText: string) => void;
}

export function FindReplaceDialog({
  open,
  onOpenChange,
  onFind,
  onReplace,
  onReplaceAll,
}: FindReplaceDialogProps) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="find-replace-dialog">
        <DialogHeader>
          <DialogTitle>Find and Replace</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="find-input">Find</Label>
            <div className="flex gap-2">
              <Input
                id="find-input"
                placeholder="Search text..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                data-testid="input-find"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => onFind?.(findText)}
                data-testid="button-find-next"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onFind?.(findText)}
                data-testid="button-find-previous"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="replace-input">Replace</Label>
            <Input
              id="replace-input"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              data-testid="input-replace"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onReplace?.(findText, replaceText)}
              data-testid="button-replace"
            >
              Replace
            </Button>
            <Button
              onClick={() => onReplaceAll?.(findText, replaceText)}
              data-testid="button-replace-all"
            >
              Replace All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
