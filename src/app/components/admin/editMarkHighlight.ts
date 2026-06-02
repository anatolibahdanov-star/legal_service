import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

// Highlights {{...}} edit-markup (Grok wraps any text it added/rewrote in double
// curly braces per the prompt's "ПРАВИЛО СКОБОК") inside the admin rich-text
// editor. Implemented as a non-destructive ProseMirror decoration: it only
// paints a red background, never changes the document content.
const editMarkKey = new PluginKey('editMarkHighlight');
const EDIT_MARK_RE = /\{\{[\s\S]*?\}\}/g;
const EDIT_MARK_STYLE = 'background-color:#fee2e2;color:#b91c1c;border-radius:2px;';

function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    EDIT_MARK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = EDIT_MARK_RE.exec(text)) !== null) {
      const from = pos + match.index;
      const to = from + match[0].length;
      decorations.push(Decoration.inline(from, to, { style: EDIT_MARK_STYLE }));
    }
  });
  return DecorationSet.create(doc, decorations);
}

export const EditMarkHighlight = Extension.create({
  name: 'editMarkHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: editMarkKey,
        state: {
          init: (_config, { doc }) => buildDecorations(doc),
          apply: (tr, old) => (tr.docChanged ? buildDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return editMarkKey.getState(state);
          },
        },
      }),
    ];
  },
});
