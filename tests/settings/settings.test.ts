import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';

import type { HeadingAdjusterSettings } from '../../src/settings/preferences';
import { openPreferences, readSettings } from '../../src/settings/settings';

/** A plugin as far as `readSettings` is concerned: something with stored data. */
function pluginStoring(data: unknown) {
  return { loadData: async () => data } as never;
}

/**
 * The same, for `openPreferences`, which also puts a tab on screen.
 *
 * The tab is caught rather than stubbed out: installing it is half of what the
 * door does, so a test that let it be skipped would stop noticing if it were.
 */
function pluginLoading(data: Partial<HeadingAdjusterSettings>) {
  const tabs: unknown[] = [];
  const saved: unknown[] = [];

  const plugin = {
    app: {},
    loadData: async () => data,
    saveData: async (settings: unknown) => void saved.push(settings),
    addSettingTab: (tab: unknown) => tabs.push(tab),
  };

  return { plugin: plugin as never, tabs, saved };
}

describe('openPreferences', () => {
  test('answers the default shift for the direction being asked about', async () => {
    const { plugin } = pluginLoading({ increaseLevel: 2, decreaseLevel: 3 });
    const preferences = await openPreferences(plugin);

    assert.equal(preferences.defaultLevel('increase'), 2);
    assert.equal(preferences.defaultLevel('decrease'), 3);
  });

  test('answers where the toggle is pointed and where the custom range runs', async () => {
    const { plugin } = pluginLoading({ toggleTarget: 'child', customRangeTop: 'cursor' });
    const preferences = await openPreferences(plugin);

    assert.equal(preferences.toggleTarget(), 'child');
    assert.deepEqual(preferences.customRange(), { top: 'cursor', bottom: 'note-end' });
  });

  test('hands on the conversions the user switched on', async () => {
    const { plugin } = pluginLoading({ bulletsToHeadings: true });
    const preferences = await openPreferences(plugin);

    assert.equal(preferences.conversion().bulletsToHeadings, true);
    assert.equal(preferences.conversion().headingsToBullets, false);
  });

  test('installs the settings tab, which is the other half of opening them', async () => {
    const { plugin, tabs } = pluginLoading({});
    await openPreferences(plugin);

    assert.equal(tabs.length, 1);
  });

  test('answers from the record the tab is editing, not a copy of it', async () => {
    const { plugin, tabs } = pluginLoading({ increaseLevel: 1 });
    const preferences = await openPreferences(plugin);

    // The tab writes the object in place, so a stale copy would answer 1 here.
    const host = tabs[0] as { setControlValue(key: string, value: unknown): Promise<void> };
    await host.setControlValue('increaseLevel', 5);

    assert.equal(preferences.defaultLevel('increase'), 5);
  });

  test('persists what the tab wrote, and persists the current record', async () => {
    const { plugin, tabs, saved } = pluginLoading({ increaseLevel: 1 });
    await openPreferences(plugin);

    const host = tabs[0] as { setControlValue(key: string, value: unknown): Promise<void> };
    await host.setControlValue('toggleTarget', 'root');

    assert.equal(saved.length, 1);
    assert.equal((saved[0] as HeadingAdjusterSettings).toggleTarget, 'root');
  });
});

describe('readSettings', () => {
  test('a fresh install shifts by one in both directions', async () => {
    assert.deepEqual(await readSettings(pluginStoring(null)), {
      increaseLevel: 1,
      decreaseLevel: 1,
      headingsToBullets: false,
      bulletsToHeadings: false,
      deepestHeadingLevel: 6,
      toggleTarget: 'sibling',
      liftNestedOnHeading: true,
      removeHeadingAs: 'plain',
      customRangeTop: 'note-start',
      customRangeBottom: 'note-end',
    });
  });

  test('a conversion the user switched on survives a reload', async () => {
    const stored = await readSettings(pluginStoring({ bulletsToHeadings: true }));

    assert.equal(stored.bulletsToHeadings, true);
    assert.equal(stored.headingsToBullets, false);
  });

  test('stored values win over the defaults', async () => {
    assert.deepEqual(await readSettings(pluginStoring({ increaseLevel: 4 })), {
      increaseLevel: 4,
      decreaseLevel: 1,
      headingsToBullets: false,
      bulletsToHeadings: false,
      deepestHeadingLevel: 6,
      toggleTarget: 'sibling',
      liftNestedOnHeading: true,
      removeHeadingAs: 'plain',
      customRangeTop: 'note-start',
      customRangeBottom: 'note-end',
    });
  });
});
