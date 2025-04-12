// @ts-ignore
import React, { useState, useRef, useEffect } from "react";
// @ts-ignore
import data from "@emoji-mart/data";
// @ts-ignore
import Picker from "@emoji-mart/react";
// @ts-ignore
import { Smile } from "lucide-react";
// @ts-ignore
import { Button } from "../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: any) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Insert emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0 border-none shadow-lg"
        align="end"
        side="top"
        sideOffset={5}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme="light"
          previewPosition="none"
          skinTonePosition="none"
        />
      </PopoverContent>
    </Popover>
  );
}


