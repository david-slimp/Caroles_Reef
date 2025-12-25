// src/ui/FishCard.ts
// A small, typed controller that renders and manages the Fish Card panel.
// It holds no game state; callers pass the selected fish and callbacks.
// Strict, framework-free DOM code.

import type { CreatureBase } from '../creatures/types';

export type Sex = 'M' | 'F';

export type TailShape = 'pointy' | 'round' | 'fan' | 'forked' | 'lunate';

/**
 * Gets a display-friendly name for a tail shape
 */
export function getTailShapeDisplayName(shape: TailShape): string {
  const names = {
    pointy: 'Pointy',
    round: 'Round',
    fan: 'Fan',
    forked: 'Forked',
    lunate: 'Lunate'
  };
  return names[shape] || shape;
}

export interface ParentsRef {
  ma?: string;
  pa?: string;
}

export interface FishData extends Omit<CreatureBase, 'speciesId' | 'birthSize' | 'energy' | 'health' | 'direction' | 'generation' | 'parents'> {
  id: string;
  name?: string;
  species?: string;
  generation?: number;

    // Visual
  colorHue?: number;
  patternType?: string;
  /** 
   * The shape of the fish's tail/fin
   * @see {TailShape}
   */
  finShape?: TailShape;
  eyeType?: string;

  // Physical / stats
  size: number;
  maxSize: number;
  speed?: number;
  senseGene?: number;
  hungerDrive?: number;
  energy?: number;
  health?: number;

  // Genetics
  rarityGene?: number;
  constitution?: number;
  shiny?: boolean;

  // Lifecycle
  age: number; // seconds
  sex: Sex;
  favorite?: boolean;
  dead?: boolean;

  // Provenance
  parents?: ParentsRef | { ma?: string; pa?: string };
  originalId?: string;
}

export type ToastFn = (msg: string, isError?: boolean) => void;

export interface FishCardOptions {
  container: HTMLElement; // #fishCard element
  toast: ToastFn;
  onRename: (f: FishData, newName: string) => Promise<void> | void;
  onToggleFavorite: (f: FishData) => Promise<void> | void;
  onRelease: (f: FishData) => Promise<void> | void;
  onSaveToCollection: (f: FishData) => Promise<boolean> | boolean;
  getFishById: (id: string) => FishData | undefined; // pull latest data from tank
}

export class FishCard {
  private el: HTMLElement;
  private toast: ToastFn;
  private opts: FishCardOptions;
  private selectedId: string | null = null;

  constructor(opts: FishCardOptions) {
    console.log('🐟 FishCard.constructor()');
    console.log('Initial container state:', {
      id: opts.container.id,
      hidden: opts.container.hidden,
      parent: opts.container.parentElement?.id || 'no-parent',
      styles: window.getComputedStyle(opts.container),
    });

    this.el = opts.container;
    this.toast = opts.toast;
    this.opts = opts;

    // Ensure element has required ID and classes
    if (!this.el.id) this.el.id = 'fishCard';
    this.el.hidden = true;

    // Log final state
    console.log('FishCard initialized:', {
      element: this.el,
      hidden: this.el.hidden,
      styles: window.getComputedStyle(this.el),
      parent: this.el.parentElement,
      documentContains: document.contains(this.el),
    });
  }

  /** Is the panel visible? */
  isOpen() {
    return !this.el.hidden && this.selectedId !== null;
  }

  /** Make sure the UI reflects latest tank state for the selected fish. */
  refreshFromTank() {
    if (!this.isOpen() || !this.selectedId) return;
    const f = this.opts.getFishById(this.selectedId);
    if (!f) {
      this.hide();
      return;
    }
    this.update(f);
  }

  /** Open for a specific fish, replacing any previous selection. */
  open(f: FishData) {
    console.log('🐟 FishCard.open()', { fishId: f?.id, currentState: this.getState() });

    if (!this.el) {
      console.error('❌ FishCard container element is null/undefined');
      return;
    }

    // Log current state before making changes
    const beforeState = this.getState();
    console.log('Before open:', beforeState);

    this.selectedId = f.id;
    this.renderSkeleton(f);
    this.wireEvents(f);
    this.update(f);

    // Show the card
    this.el.style.display = 'block';
    this.el.hidden = false;
    this.el.offsetHeight; // Force reflow

    // Log final state
    const afterState = this.getState();
    console.log('After open:', afterState);
    console.log('Element visibility state:', {
      display: window.getComputedStyle(this.el).display,
      visibility: window.getComputedStyle(this.el).visibility,
      opacity: window.getComputedStyle(this.el).opacity,
      rect: this.el.getBoundingClientRect(),
      isConnected: this.el.isConnected,
      isInDocument: document.body.contains(this.el),
    });

    // Verify styles are applied
    const styles = window.getComputedStyle(this.el);
    console.log('Applied styles:', {
      position: styles.position,
      zIndex: styles.zIndex,
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      pointerEvents: styles.pointerEvents,
      width: styles.width,
      height: styles.height,
    });

    // Check if element is visible in viewport
    const rect = this.el.getBoundingClientRect();
    const isInViewport =
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0;
    console.log('Element in viewport:', isInViewport, { rect });

    console.log('✅ FishCard opened for fish:', f.id);
  }

  /** Update only changing values; DOM nodes are persistent. */
  update(f: FishData) {
    if (!this.selectedId || this.selectedId !== f.id) return;

    const by = (sel: string) => this.el.querySelector(sel) as HTMLElement | null;
    // Title row
    const nameEl = by('#fc-name');
    if (nameEl) nameEl.textContent = f.name || 'Unnamed Fish';
    const sexEl = by('#fc-sex');
    if (sexEl) sexEl.textContent = f.sex;

    // Stage
    const stageEl = by('#fc-stage');
    if (stageEl) {
      const stage = f.dead ? 'Dead' : f.age && f.age < 30 ? 'Juvenile' : f.age && f.age < 60 ? 'Adult' : 'Elder';
      stageEl.textContent = stage;
    }

    // Shiny
    const shinyEl = by('#fc-shiny');
    if (shinyEl) shinyEl.style.display = f.shiny ? 'inline' : 'none';

    // Basics
    const idEl = by('#fc-id');
    if (idEl) idEl.textContent = f.id;
    const ageEl = by('#fc-age');
    if (ageEl) ageEl.textContent = ((f.age ?? 0) / 60).toFixed(1) + ' min';
    const sizeEl = by('#fc-size');
    if (sizeEl)
      sizeEl.textContent = `${(f.size ?? 1).toFixed(0)} (${f.maxSize ? Math.max(1, Math.min(f.maxSize - 1, f.size ?? 1)) : '?'}-${f.maxSize ?? '?'})`;

    // Core stats
    const core = by('#fc-core-stats');
    if (core) {
      core.textContent = `Speed: ${f.speed ?? '?'} | Sense: ${f.senseGene ?? '?'} | Hunger: ${f.hungerDrive ?? '?'} | Rarity: ${f.rarityGene ?? '?'} | Con: ${f.constitution ?? '?'}`;
    }

    // Appearance
    const app = by('#fc-appearance');
    if (app) {
      app.textContent = `Hue: ${f.colorHue ?? '?'} | Pattern: ${f.patternType ?? '?'} | Fin: ${f.finShape ?? '?'} | Eye: ${f.eyeType ?? '?'}`;
    }

    // Parents
    const parents = by('#fc-parents');
    if (parents) {
      const pr = f.parents as ParentsRef | undefined;
      parents.textContent = pr ? `Parents: ${pr.ma ?? '?'} × ${pr.pa ?? '?'}` : '— wild origin —';
    }

    // Favorite star
    const favBtn = by('#toggleFav');
    if (favBtn) {
      favBtn.textContent = f.favorite ? '★' : '☆';
      (favBtn as HTMLElement).style.color = f.favorite ? '#ffd700' : '#888';
      (favBtn as HTMLElement).setAttribute(
        'title',
        f.favorite ? 'Remove from favorites' : 'Add to favorites'
      );
    }
  }

  /** Hide and clear selection (keeps DOM for quick show). */
  private getState() {
    if (!this.el) return { error: 'No element' };

    return {
      id: this.el.id,
      hidden: this.el.hidden,
      display: window.getComputedStyle(this.el).display,
      visibility: window.getComputedStyle(this.el).visibility,
      opacity: window.getComputedStyle(this.el).opacity,
      rect: this.el.getBoundingClientRect(),
      parent: this.el.parentElement?.id || 'no-parent',
      inDocument: document.body.contains(this.el),
      styles: {
        position: window.getComputedStyle(this.el).position,
        zIndex: window.getComputedStyle(this.el).zIndex,
        pointerEvents: window.getComputedStyle(this.el).pointerEvents,
        backgroundColor: window.getComputedStyle(this.el).backgroundColor,
      },
      selectedId: this.selectedId,
    };
  }

  hide() {
    console.log('🐟 FishCard.hide()', { currentState: this.getState() });

    if (this.el) {
      const beforeState = this.getState();
      console.log('Before hide:', beforeState);

      this.el.style.display = 'none';
      this.el.hidden = true;
      this.selectedId = null;

      // Force reflow
      this.el.offsetHeight;

      const afterState = this.getState();
      console.log('After hide:', afterState);
      console.log('✅ FishCard hidden');
    } else {
      console.warn('FishCard.hide() called but element is not available');
    }
  }

  // --- internals ---
  private renderSkeleton(f: FishData) {
    this.el.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom: 10px;">
        <button id="toggleFav" style="background:none; border:none; cursor:pointer; font-size:1.5em; color:${
          f.favorite ? '#ffd700' : '#888'
        }; padding:4px;" title="${f.favorite ? 'Remove from favorites' : 'Add to favorites'}">${f.favorite ? '★' : '☆'}</button>
        <strong id="fc-name" style="flex-grow:1">${f.name || 'Unnamed Fish'}</strong>
        <span class="badge" id="fc-sex">${f.sex}</span>
        <span class="badge" id="fc-stage"></span>
        <span class="badge" id="fc-shiny" style="display:${f.shiny ? 'inline' : 'none'}">✨ Shiny</span>
      </div>

      <div class="small" style="margin: 4px 0">ID: <span id="fc-id">${f.id}</span></div>
      <div class="small" style="margin: 4px 0">Age: <span id="fc-age">${(f.age / 60).toFixed(1)} min</span> • Size: <span id="fc-size">${f.size.toFixed(1)}</span></div>
      <div class="small" id="fc-core-stats" style="margin: 4px 0">
        Speed: ${f.speed} • Sense: ${f.senseGene}
      </div>
      <div class="small" id="fc-appearance" style="margin: 8px 0 12px 0">
        Pattern: ${f.patternType} • Fin: ${f.finShape}
      </div>

      <div style="margin: 12px 0 8px 0">
        <label class="small" style="display:block; margin-bottom:4px">Rename</label>
        <input type="text" id="renameFish" placeholder="Type a name…" value="${f.name || ''}" style="width:100%; padding:6px; border-radius:4px; border:1px solid #2a4a6a; background:rgba(0,0,0,0.3); color:white" />
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button id="saveName" style="flex:1; padding:6px 10px; background:#2a4a6a; color:white; border:none; border-radius:4px; cursor:pointer">Save</button>
        <button id="releaseFish" style="flex:1; padding:6px 10px; background:#ff4444; color:white; border:none; border-radius:4px; cursor:pointer">Release</button>
        <button id="closeCard" style="padding:6px 10px; background:#444; color:white; border:none; border-radius:4px; cursor:pointer">✕</button>
      </div>
    `;
  }

  private wireEvents(initial: FishData) {
    const by = (sel: string) => this.el.querySelector(sel) as HTMLElement | null;
    const save = by('#saveName') as HTMLButtonElement | null;
    const close = by('#closeCard') as HTMLButtonElement | null;
    const input = by('#renameFish') as HTMLInputElement | null;
    const favBtn = by('#toggleFav') as HTMLButtonElement | null;
    const releaseBtn = by('#releaseFish') as HTMLButtonElement | null;
    const saveToCollectionBtn = by('#saveToCollection') as HTMLButtonElement | null;

    if (save) {
      save.onclick = async () => {
        const f = this.opts.getFishById(this.selectedId!) || initial;
        const newName = (input?.value ?? '').trim();
        if (!newName) return;
        await this.opts.onRename(f, newName);
        this.toast('Fish renamed');
        this.update({ ...f, name: newName });
      };
    }

    if (close) {
      close.onclick = () => this.hide();
    }

    if (favBtn) {
      favBtn.onclick = async e => {
        e.stopPropagation();
        const f = this.opts.getFishById(this.selectedId!) || initial;
        await this.opts.onToggleFavorite(f);
        this.update({ ...f, favorite: !f.favorite });
      };
    }

    if (releaseBtn) {
      releaseBtn.onclick = async () => {
        const f = this.opts.getFishById(this.selectedId!) || initial;
        await this.opts.onRelease(f);
        this.hide();
      };
    }

    if (saveToCollectionBtn) {
      saveToCollectionBtn.onclick = async e => {
        e.stopPropagation();
        const f = this.opts.getFishById(this.selectedId!) || initial;
        const ok = await this.opts.onSaveToCollection(f);
        if (ok) {
          this.toast('Fish saved to collection!');
          saveToCollectionBtn.textContent = 'Saved to Collection';
          (saveToCollectionBtn as HTMLButtonElement).style.backgroundColor = '#2e7d32';
          saveToCollectionBtn.disabled = true;
        } else {
          this.toast('Failed to save fish to collection', true);
        }
      };
    }
  }
}
