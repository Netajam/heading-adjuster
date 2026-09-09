/**
 * The words every layer of the plugin has to say.
 *
 * This module declares types and nothing else — no functions, no constants, no
 * runtime code at all. That is what lets it sit outside the dependency tree:
 * every one of these declarations is erased at compile time, so importing them
 * couples nothing and the shipped module graph never sees this file.
 *
 * Behaviour never belongs here. The moment something in this file could run,
 * it would become a real dependency of everything that imports it, and the
 * exemption the architecture test grants this file would be a lie.
 */

/** The two directions a heading level can be moved in. */
export type AdjustmentOperation = 'increase' | 'decrease';

/**
 * The four ways of naming a level for a line that is to be a heading.
 *
 * `root` is the top of the note and answers to nothing above it. The other
 * three are read against the enclosing heading, the nearest heading above the
 * line: `parent` sits one level shallower, `sibling` takes its level, `child`
 * one deeper. These are also the four a toggle can be pointed at, which is why
 * they are a word of their own.
 *
 * `parent` is the only one that changes what the heading above it answers to:
 * placed there, the line encloses that heading rather than joining it. It is
 * how a section is opened above work already written, which is the direction
 * an outline is read in but not the one it is usually typed in.
 */
export type HeadingPlacement = 'root' | 'parent' | 'sibling' | 'child';

/**
 * Where the current line's heading sits relative to the section it is in.
 *
 * These name a level outright instead of a distance to move, which is what
 * separates them from an operation. `plain` is level zero — no heading at all —
 * and is how one is taken away.
 *
 * `toggle` is the one that also reads the line: it is whichever
 * `HeadingPlacement` the user pointed it at, unless the line is already sitting
 * there, in which case there is nothing left to add and it is `plain` instead.
 * That makes one command out of two, which is what a mobile toolbar with a
 * single free slot has room for.
 */
export type LinePlacement = HeadingPlacement | 'plain' | 'toggle';

/**
 * Why an adjustment produced nothing.
 *
 * Core decides these and the editor is what says them out loud, which is why
 * the word is shared rather than owned by either.
 */
export type RejectionReason =
  | 'empty-range'
  | 'zero-levels'
  | 'negative-levels'
  | 'no-headings';

/**
 * Which of the two overflow conversions the user has switched on.
 *
 * Both ship off. Each rewrites more than a heading line — one re-indents a
 * section body, the other converts every list item in range — so neither is
 * something to start doing to a vault on upgrade without being asked.
 */
export interface ConversionSettings {
  /** On increase, turn a heading pushed past H6 into a list item. */
  headingsToBullets: boolean;
  /** On decrease, turn list items back into headings. See docs/adr/0001. */
  bulletsToHeadings: boolean;
  /**
   * When a placement writes a heading onto a list item, lift the items nested
   * under it by as much as the item itself lost.
   *
   * Without it a deeply nested item leaves its children behind at their old
   * indent, under a heading that no longer encloses them — which CommonMark
   * reads as an indented code block rather than a list.
   */
  liftNestedOnHeading?: boolean;
  /**
   * What a placement writes where a heading used to be.
   *
   * `plain` is the text on its own. The other two put the line back in a list,
   * and `bullet-with-section` carries the heading's section in with it, so the
   * lines the heading held become the item's children rather than its
   * siblings.
   */
  removeHeadingAs?: 'plain' | 'bullet' | 'bullet-with-section';
  /**
   * The deepest level a heading may occupy before it converts to a bullet, and
   * the level a bullet converts back to. Markdown's own limit of six when
   * omitted, which is the setting doing nothing.
   */
  deepestHeadingLevel?: number;
}
