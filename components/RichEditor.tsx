'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  minHeight = '7rem',
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Treat an empty doc as empty string so we don't store '<p></p>'
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
  })

  // Sync external resets (e.g. modal re-open with cleared form)
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  return (
    <div className="rich-editor-wrap">
      {/* ── Toolbar ── */}
      <div className="rich-toolbar">
        <ToolBtn
          active={editor?.isActive('bold') ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold (⌘B)"
        >
          <BoldIcon />
        </ToolBtn>

        <ToolBtn
          active={editor?.isActive('italic') ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic (⌘I)"
        >
          <ItalicIcon />
        </ToolBtn>

        <div className="rich-sep" />

        <ToolBtn
          active={editor?.isActive('heading', { level: 3 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading"
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '-0.02em' }}>H3</span>
        </ToolBtn>

        <div className="rich-sep" />

        <ToolBtn
          active={editor?.isActive('bulletList') ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <BulletIcon />
        </ToolBtn>

        <ToolBtn
          active={editor?.isActive('orderedList') ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <NumberIcon />
        </ToolBtn>

        <div className="rich-sep" />

        <ToolBtn
          active={false}
          onClick={() => editor?.chain().focus().undo().run()}
          title="Undo"
          disabled={!editor?.can().undo()}
        >
          <UndoIcon />
        </ToolBtn>

        <ToolBtn
          active={false}
          onClick={() => editor?.chain().focus().redo().run()}
          title="Redo"
          disabled={!editor?.can().redo()}
        >
          <RedoIcon />
        </ToolBtn>
      </div>

      {/* ── Editor body ── */}
      <div className="neu-inset-sm rich-body" style={{ minHeight }}>
        <EditorContent editor={editor} className="rich-editor-root" />
      </div>
    </div>
  )
}

/* ── Tool button ── */
function ToolBtn({
  children,
  active,
  onClick,
  title,
  disabled = false,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rich-tool"
      data-active={active}
    >
      {children}
    </button>
  )
}

/* ── SVG icons ── */
function BoldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h8a4 4 0 0 1 0 8H6V4zm0 8h9a4 4 0 0 1 0 8H6v-8z" />
    </svg>
  )
}

function ItalicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4v3h2.21l-3.42 10H6v3h8v-3h-2.21l3.42-10H18V4z" />
    </svg>
  )
}

function BulletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 8h13v2H8V8zm0 6h13v2H8v-2z" />
    </svg>
  )
}

function NumberIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-7v2h14V4H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16a8.002 8.002 0 0 1 7.6-5.5c1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
    </svg>
  )
}
