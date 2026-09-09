import type { ConversionSettings, HeadingPlacement } from '../contracts';

/**
 * The shape of the stored preferences — `settings/`'s own vocabulary.
 *
 * These two are not shared words the way `AdjustmentOperation` is. They are
 * the record this folder reads, writes and persists, and the only file outside
 * it that names either is `main.ts`, which owns the object. Keeping them at the
 * root of `src/` put one folder's data structure where every layer could see
 * it; keeping them here says who they belong to.
 *
 * Like `contracts.d.ts` this module declares types and nothing else, so it is
 * erased at compile time and is not a door anyone has to knock on. It imports
 * only from `contracts.d.ts`, which is erased for the same reason — the
 * exemption covers a module whose whole import closure disappears with it.
 */

/** The preferences a user can set for the plugin. */
export interface HeadingAdjusterSettings extends ConversionSettings {
  increaseLevel: number;
  decreaseLevel: number;
  deepestHeadingLevel: number;
  /** Which level the toggle puts a heading at, and so which one takes it off. */
  toggleTarget: HeadingPlacement;
  /**
   * Where the custom commands start, and where they stop.
   *
   * Each end names the boundary it sits on rather than answering a yes/no about
   * the cursor: a toggle has to assert one state in its label and describe the
   * other in its help text, which reads as a contradiction whichever way it is
   * worded. `'cursor'` on both ends is the cursor line alone, and the pair
   * defaults to the whole note — the same range the document commands cover, so
   * the custom pair does something sensible before it is configured.
   *
   * The two ends take different options on purpose. Nothing above the top or
   * below the bottom is offered, so a backwards range cannot be configured and
   * there is none to reject.
   *
   * A fixed line number is deliberately not offered either. A range baked into a
   * hotkey outlives the note it was set for; the dialog is where a one-off range
   * belongs.
   */
  customRangeTop: 'note-start' | 'cursor';
  customRangeBottom: 'cursor' | 'note-end';
}

/** Whatever owns the settings and can persist them. */
export interface SettingsHost {
  settings: HeadingAdjusterSettings;
  saveSettings(): Promise<void>;
}
