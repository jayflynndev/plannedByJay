"use client";
import { useEffect, useRef } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
export function VisualEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        link: {
          openOnClick: false,
          autolink: false,
          protocols: ["http", "https", "mailto"],
        },
      }),
    ],
    content: value,
    editorProps: {
      transformPastedHTML: (html) => html.replace(/<(\/?)h1\b/gi, "<$1h2"),
      attributes: {
        role: "textbox",
        "aria-label": "Article body",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => callback.current(editor.getHTML()),
  });
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      const pos = editor.state.selection.from;
      editor.commands.setContent(value, { emitUpdate: false });
      editor.commands.setTextSelection(
        Math.min(pos, editor.state.doc.content.size),
      );
    }
  }, [editor, value]);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold"),
      italic: e?.isActive("italic"),
      underline: e?.isActive("underline"),
      h2: e?.isActive("heading", { level: 2 }),
      h3: e?.isActive("heading", { level: 3 }),
      bullet: e?.isActive("bulletList"),
      ordered: e?.isActive("orderedList"),
      quote: e?.isActive("blockquote"),
      link: e?.isActive("link"),
    }),
  });
  if (!editor)
    return (
      <div className="article-editor-loading">Loading article editor...</div>
    );
  const button = (label: string, action: () => void, active?: boolean) => (
    <button
      type="button"
      key={label}
      aria-label={label}
      title={label}
      aria-pressed={!!active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={action}
    >
      {label}
    </button>
  );
  return (
    <div className="article-word-editor">
      <div role="toolbar" aria-label="Article formatting">
        {button("Paragraph", () => editor.chain().focus().setParagraph().run())}
        {button(
          "Heading",
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          state?.h2,
        )}
        {button(
          "Subheading",
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          state?.h3,
        )}
        {button(
          "Bold",
          () => editor.chain().focus().toggleBold().run(),
          state?.bold,
        )}
        {button(
          "Italic",
          () => editor.chain().focus().toggleItalic().run(),
          state?.italic,
        )}
        {button(
          "Underline",
          () => editor.chain().focus().toggleUnderline().run(),
          state?.underline,
        )}
        {button(
          "Bulleted list",
          () => editor.chain().focus().toggleBulletList().run(),
          state?.bullet,
        )}
        {button(
          "Numbered list",
          () => editor.chain().focus().toggleOrderedList().run(),
          state?.ordered,
        )}
        {button(
          "Link",
          () => {
            const href = window.prompt(
              "Link URL (https://...)",
              editor.getAttributes("link").href || "https://",
            );
            if (href === null) return;
            if (!href) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            try {
              const url = new URL(href);
              if (["https:", "http:", "mailto:"].includes(url.protocol))
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href })
                  .run();
            } catch {
              /* Keep the existing link if the entered URL is invalid. */
            }
          },
          state?.link,
        )}
        {button(
          "Quote",
          () => editor.chain().focus().toggleBlockquote().run(),
          state?.quote,
        )}
        {button("Undo", () => editor.chain().focus().undo().run())}
        {button("Redo", () => editor.chain().focus().redo().run())}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
