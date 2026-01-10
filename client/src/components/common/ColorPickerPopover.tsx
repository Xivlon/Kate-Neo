import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPickerPopover({ color, onChange }: ColorPickerPopoverProps) {
  const [localColor, setLocalColor] = useState(color);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-6 h-6 rounded border-2 border-foreground/20 cursor-pointer hover-elevate"
          style={{ backgroundColor: color }}
          data-testid="color-picker-trigger"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64" data-testid="color-picker-popover">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Color Picker</h4>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color-input">Hex Color</Label>
            <div className="flex gap-2">
              <Input
                id="color-input"
                type="color"
                value={localColor}
                onChange={(e) => {
                  setLocalColor(e.target.value);
                  onChange(e.target.value);
                }}
                className="h-10 w-16"
                data-testid="input-color-picker"
              />
              <Input
                type="text"
                value={localColor}
                onChange={(e) => {
                  setLocalColor(e.target.value);
                  onChange(e.target.value);
                }}
                placeholder="#000000"
                className="flex-1 font-mono"
                data-testid="input-color-hex"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"].map((c) => (
              <button
                key={c}
                className="w-8 h-8 rounded border border-foreground/20 hover-elevate"
                style={{ backgroundColor: c }}
                onClick={() => {
                  setLocalColor(c);
                  onChange(c);
                }}
                data-testid={`color-preset-${c}`}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
