import { Injectable, signal, computed } from '@angular/core';

export interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCompletedProfile: boolean;
  hasVisitedSettings: boolean;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly STORAGE_KEY = 'todo_app_onboarding';

  // Signals for onboarding state
  private _onboardingState = signal<OnboardingState>({
    hasSeenWelcome: false,
    hasCompletedProfile: false,
    hasVisitedSettings: false,
    lastUpdated: new Date()
  });

  // Computed signals
  public readonly hasSeenWelcome = computed(() => this._onboardingState().hasSeenWelcome);
  public readonly hasCompletedProfile = computed(() => this._onboardingState().hasCompletedProfile);
  public readonly hasVisitedSettings = computed(() => this._onboardingState().hasVisitedSettings);
  public readonly isOnboardingComplete = computed(() =>
    this._onboardingState().hasSeenWelcome &&
    this._onboardingState().hasCompletedProfile &&
    this._onboardingState().hasVisitedSettings
  );

  constructor() {
    this.loadOnboardingState();
  }

  private loadOnboardingState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        // Convert lastUpdated back to Date object
        if (state.lastUpdated) {
          state.lastUpdated = new Date(state.lastUpdated);
        }
        this._onboardingState.set(state);
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
  }

  private saveOnboardingState(): void {
    try {
      const state = {
        ...this._onboardingState(),
        lastUpdated: new Date()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  markWelcomeSeen(): void {
    this._onboardingState.update(state => ({
      ...state,
      hasSeenWelcome: true
    }));
    this.saveOnboardingState();
  }

  markProfileCompleted(): void {
    this._onboardingState.update(state => ({
      ...state,
      hasCompletedProfile: true
    }));
    this.saveOnboardingState();
  }

  markSettingsVisited(): void {
    this._onboardingState.update(state => ({
      ...state,
      hasVisitedSettings: true
    }));
    this.saveOnboardingState();
  }

  resetOnboarding(): void {
    this._onboardingState.set({
      hasSeenWelcome: false,
      hasCompletedProfile: false,
      hasVisitedSettings: false,
      lastUpdated: new Date()
    });
    this.saveOnboardingState();
  }

  shouldShowWelcome(): boolean {
    return !this.hasSeenWelcome();
  }

  shouldPromptProfileCompletion(): boolean {
    return this.hasSeenWelcome() && !this.hasCompletedProfile();
  }

  shouldPromptSettingsVisit(): boolean {
    return this.hasCompletedProfile() && !this.hasVisitedSettings();
  }
}
