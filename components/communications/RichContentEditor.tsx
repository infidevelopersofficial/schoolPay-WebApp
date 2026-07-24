"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Heading2 } from "lucide-react";

interface RichContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichContentEditor({ value, onChange, placeholder }: RichContentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 bg-white/5",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const toggleBold = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().toggleBold().run();
  };

  const toggleItalic = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().toggleItalic().run();
  };

  const toggleHeading = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().toggleHeading({ level: 2 }).run();
  };

  const toggleBulletList = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().toggleOrderedList().run();
  };

  const toggleBlockquote = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().toggleBlockquote().run();
  };

  const undo = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().undo().run();
  };

  const redo = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().redo().run();
  };

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm">
      <div className="flex items-center gap-1 border-b border-white/10 bg-white/5 p-2 flex-wrap">
        <button
          onClick={toggleBold}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive("bold") ? "bg-white/10 text-white" : "text-white/70"}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={toggleItalic}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive("italic") ? "bg-white/10 text-white" : "text-white/70"}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={toggleHeading}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-white/10 text-white" : "text-white/70"}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={toggleBlockquote}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive("blockquote") ? "bg-white/10 text-white" : "text-white/70"}`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={toggleBulletList}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive("bulletList") ? "bg-white/10 text-white" : "text-white/70"}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={toggleOrderedList}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive("orderedList") ? "bg-white/10 text-white" : "text-white/70"}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={undo}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-white/10 transition-colors text-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-white/10 transition-colors text-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="text-white placeholder:text-white/50" />
    </div>
  );
}
