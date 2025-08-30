// @ts-nocheck
/**
 * UI controls and panels extracted from legacy code.
 * Handles: audio mute buttons, side panels, theme, sliders, dex panel, collection button.
 */
type UIRefs = {
  panelDecor: HTMLElement;
  panelTheme: HTMLElement;
  panelDex: HTMLElement;
  dexList: HTMLElement;
  discEl: HTMLElement;
  popEl: HTMLElement;
  genEl: HTMLElement;
  toastEl: HTMLElement;
  pauseEl: HTMLInputElement;
  btnFood: HTMLElement;
  btnDecor: HTMLElement;
  btnTheme: HTMLElement;
  btnDex: HTMLElement;
  btnCollection: HTMLElement;
  muteSfxBtn: HTMLElement;
  muteMusicBtn: HTMLElement;
  bubbleLevel: HTMLInputElement;
  timeSpeed: HTMLInputElement;
  decorType: HTMLSelectElement;
  decorSize: HTMLSelectElement;
};

type Deps = {
  isMuted: (ch: 'sfx' | 'music') => boolean;
  toggleMute: (ch: 'sfx' | 'music') => boolean;
  playBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  toast: (msg: string, isError?: boolean) => void;
  bubbles: any;
  modeRef: { value: string };
  pausedRef: { value: boolean };
  setTheme: (t: string) => void;
  refreshDex: () => void;
  decorSelect: { type: string; size: string };
  fish: any[];
};

export function setupUIControls(ui: UIRefs, deps: Deps) {
  const {
    isMuted, toggleMute, playBackgroundMusic, pauseBackgroundMusic,
    toast, bubbles, modeRef, pausedRef, setTheme, refreshDex, decorSelect, fish
  } = deps;

  // Backup manager topbar mount (if present)
  // This is invoked by caller.

  // Pause checkbox
  ui.pauseEl.onchange = () => (pausedRef.value = ui.pauseEl.checked);

  // Update mute button states
  const updateMuteButtons = () => {
    const isSfxMuted = isMuted('sfx');
    ui.muteSfxBtn.classList.toggle('muted', isSfxMuted);
    (ui.muteSfxBtn as any).title = isSfxMuted ? 'Unmute sound effects' : 'Mute sound effects';
    const isMusicMuted = isMuted('music');
    ui.muteMusicBtn.classList.toggle('muted', isMusicMuted);
    (ui.muteMusicBtn as any).title = isMusicMuted ? 'Unmute music' : 'Mute music';
  };

  ui.muteSfxBtn.onclick = () => {
    const isNowMuted = toggleMute('sfx');
    toast(isNowMuted ? 'Sound effects muted' : 'Sound effects unmuted');
    updateMuteButtons();
  };

  ui.muteMusicBtn.onclick = () => {
    const isNowMuted = toggleMute('music');
    if (isNowMuted) {
      pauseBackgroundMusic();
      toast('Music muted');
    } else {
      playBackgroundMusic();
      toast('Music playing');
    }
    updateMuteButtons();
  };

  updateMuteButtons();

  // Food button
  ui.btnFood.onclick = () => (modeRef.value = 'food');

  // Panels and buttons
  function togglePanel(panel: HTMLElement) {
    [ui.panelDecor, ui.panelTheme, ui.panelDex].forEach((p) => {
      if (p !== panel) p.style.display = 'none';
    });
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    modeRef.value = panel === ui.panelDecor ? 'decor' : modeRef.value;
  }

  ui.btnDecor.addEventListener('click', () => togglePanel(ui.panelDecor));
  ui.btnTheme.addEventListener('click', () => togglePanel(ui.panelTheme));
  ui.btnDex.addEventListener('click', () => {
    refreshDex();
    togglePanel(ui.panelDex);
  });

  // Theme buttons inside panel
  ui.panelTheme.querySelectorAll('button[data-theme]').forEach((btn: HTMLElement) => {
    btn.onclick = () => setTheme((btn as any).dataset.theme);
  });

  // Sliders
  ui.bubbleLevel.oninput = () => (bubbles.targetDensity = parseFloat(ui.bubbleLevel.value));
  ui.timeSpeed.oninput = () => {/* timeScale handled by caller binding to this input's value */};

  // Decor selectors
  ui.decorType.onchange = (e: any) => (decorSelect.type = e.target.value);
  ui.decorSize.onchange = (e: any) => (decorSelect.size = e.target.value);

  // Collection button
  ui.btnCollection?.addEventListener('click', async () => {
    try {
      const { fishCollection } = await import('../ui/FishCollection');
      fishCollection.show(async (fishData: any) => {
        try {
          await fishCollection.spawnFishFromData(fishData, fish);
        } catch (error) {
          console.error('Error adding fish to tank:', error);
          toast('Failed to add fish to tank', true);
        }
      });
    } catch (error) {
      console.error('Error showing fish collection:', error);
      toast('Failed to load fish collection', true);
    }
  });

  return { togglePanel, updateMuteButtons };
}
