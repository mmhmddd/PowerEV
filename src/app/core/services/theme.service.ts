import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'powerev-theme';
  private isBrowser: boolean;

  private themeSubject = new BehaviorSubject<Theme>('dark');
  public theme$ = this.themeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.initTheme();
  }

  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  get isDark(): boolean {
    return this.themeSubject.value === 'dark';
  }

  get isLight(): boolean {
    return this.themeSubject.value === 'light';
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initTheme(): void {
    if (!this.isBrowser) return;

    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;

    if (saved === 'light' || saved === 'dark') {
      this.applyTheme(saved);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Toggle between dark and light
   */
  toggle(): void {
    const next: Theme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  }

  /**
   * Set a specific theme
   */
  setTheme(theme: Theme): void {
    this.applyTheme(theme);
  }

  /**
   * Apply theme to DOM and persist
   */
  private applyTheme(theme: Theme): void {
    this.themeSubject.next(theme);

    if (!this.isBrowser) return;

    const root = document.documentElement;

    // Remove both, then add the current
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${theme}`);

    // Also set data attribute for easy CSS targeting
    root.setAttribute('data-theme', theme);

    // Persist
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
}
