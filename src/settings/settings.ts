import type { Plugin } from 'obsidian';
import type {
  AdjustmentOperation,
  ConversionSettings,
  HeadingPlacement,
} from '../contracts';
import type { HeadingAdjusterSettings, SettingsHost } from './preferences';
import { HeadingAdjusterSettingTab } from './settingsTab';

/**
 * The user's preferences — the door into `settings/`, and where they live.
 *
 * This folder owns the record outright: it reads it, hands it to the tab that
 * edits it, persists it, and answers questions about it. Nothing outside names
 * `HeadingAdjusterSettings`, which is what lets `preferences.d.ts` sit beside
 * the three files that do without being a second way in.
 *
 * The plugin used to hold the object and hand itself back down as a
 * `SettingsHost`. That put one folder's record at the root of the tree, made
 * the root class a settings facade with four accessors and no logic of its
 * own, and gave `main.ts` two files to name in here. Owning it removes all
 * three at once.
 */

const DEFAULT_SETTINGS: HeadingAdjusterSettings = {
  increaseLevel: 1,
  decreaseLevel: 1,
  // Both off: each rewrites more than a heading line, so neither is something
  // to start doing to an existing vault without being asked.
  headingsToBullets: false,
  bulletsToHeadings: false,
  // Markdown's own limit, which is this setting having no effect.
  deepestHeadingLevel: 6,
  // What the toggle did before it could be pointed anywhere else, so an
  // upgrade finds the command behaving exactly as it left it.
  toggleTarget: 'sibling',
  // On: a heading that leaves its children stranded at an indent nothing
  // encloses is broken markup, not a preference.
  liftNestedOnHeading: true,
  // What removing a heading has always written, so the command keeps meaning
  // what its name says until the user asks for something else.
  removeHeadingAs: 'plain',
  // The whole note, so the custom commands start out as a second copy of the
  // document commands rather than as something surprising.
  customRangeTop: 'note-start',
  customRangeBottom: 'note-end',
};

/**
 * What the rest of the plugin asks of the settings: answers, not the record.
 *
 * This is the same trade `CommandContext` makes one folder over — ask for the
 * answer and the record never has to cross a boundary, so there is no type to
 * import, no generic to thread and nothing to restate. The two interfaces are
 * near enough to be one, and are deliberately not: `commands/` may not name
 * `settings/` and `settings/` may not name `commands/`, so each declares what
 * it needs and TypeScript matches them structurally, exactly as a leaf and the
 * `Heading` satisfying it do in `core/`.
 */
export interface Preferences {
  defaultLevel(operation: AdjustmentOperation): number;
  /** Which conversions are switched on, and what a placement writes. */
  conversion(): ConversionSettings;
  /** Where the toggle is pointed, and so which level it takes back off. */
  toggleTarget(): HeadingPlacement;
  /** The two boundaries the user set the custom range to. */
  customRange(): { top: 'note-start' | 'cursor'; bottom: 'cursor' | 'note-end' };
}

/**
 * Reads the stored settings, puts the tab on screen, and hands back the
 * answers — everything this folder does, in the one call `main.ts` makes.
 *
 * The record is held in the closure rather than returned, so the only thing
 * that can write it is the tab this function handed it to. `saveSettings`
 * reads `host` back out of its own initialiser on purpose: the tab mutates the
 * object in place, so persisting has to see the current one, not a copy taken
 * when the plugin loaded.
 */
export async function openPreferences(plugin: Plugin): Promise<Preferences> {
  const host: SettingsHost = {
    settings: await readSettings(plugin),
    saveSettings: () => plugin.saveData(host.settings),
  };

  plugin.addSettingTab(new HeadingAdjusterSettingTab(plugin, host));

  return {
    defaultLevel: (operation) => defaultLevelFor(host.settings, operation),
    conversion: () => host.settings,
    toggleTarget: () => host.settings.toggleTarget,
    customRange: () => ({
      top: host.settings.customRangeTop,
      bottom: host.settings.customRangeBottom,
    }),
  };
}

/** The stored settings, with anything missing filled in from the defaults. */
export async function readSettings(plugin: Plugin): Promise<HeadingAdjusterSettings> {
  // loadData() is typed `any`, and a vault may hold settings written by an
  // older version of the plugin, so what comes back is a partial at best.
  const stored = (await plugin.loadData()) as Partial<HeadingAdjusterSettings> | null;
  return { ...DEFAULT_SETTINGS, ...stored };
}

/** The shift to use when the user does not name one for this operation. */
function defaultLevelFor(
  settings: HeadingAdjusterSettings,
  operation: AdjustmentOperation
): number {
  return operation === 'increase' ? settings.increaseLevel : settings.decreaseLevel;
}
