import { Plugin } from 'obsidian';
import { registerCommandSurfaces } from './commands/commandSurfaces';
import { openPreferences } from './settings/settings';

/**
 * The entry point, and the root of the tree.
 *
 * It starts the two folders below it and holds nothing. `settings/` owns the
 * preferences and hands back the answers the commands need; `commands/` asks
 * for a `CommandContext`, which is those answers plus the app the editor is
 * found through. Neither folder names the other, and this file names one file
 * in each — which is what keeps the root a root rather than a place state
 * accumulates because everything can reach it.
 */
export default class HeadingAdjusterPlugin extends Plugin {
  async onload(): Promise<void> {
    const preferences = await openPreferences(this);

    registerCommandSurfaces(this, { app: this.app, ...preferences });
  }
}
