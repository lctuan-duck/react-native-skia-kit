/**
 * Router — Declarative routing engine for deep linking & URL sync.
 * Phase 9 + Phase 14: Navigator 2.0 pattern.
 *
 * Equivalent to Flutter's Router + RouteParser + RouterDelegate.
 */

import { useNavStore } from '../stores/navStore';

// ===== Route Config =====

export interface RouteConfig {
  screenName: string;
  params: Record<string, string>;
  path: string;
}

export interface RouteDefinition {
  pattern: string;
  screenName: string;
  guard?: () => boolean;
}

// ===== RouteParser =====

export class RouteParser {
  private routes: RouteDefinition[] = [];

  /**
   * Register a route pattern.
   * Pattern supports :param syntax for dynamic segments.
   *
   * @example
   * parser.register('/home', 'Home');
   * parser.register('/profile/:userId', 'Profile');
   * parser.register('/settings', 'Settings', () => isAuthenticated);
   */
  register(pattern: string, screenName: string, guard?: () => boolean) {
    this.routes.push({ pattern, screenName, guard });
  }

  /**
   * Parse a URL into a RouteConfig.
   * Returns null if no matching route found.
   */
  parse(url: string): RouteConfig | null {
    const cleanUrl = url.replace(/\?.*$/, '').replace(/\/$/, '') || '/';

    for (const route of this.routes) {
      const params = this._matchPattern(route.pattern, cleanUrl);
      if (params !== null) {
        // Check guard
        if (route.guard && !route.guard()) {
          continue;
        }
        return {
          screenName: route.screenName,
          params,
          path: cleanUrl,
        };
      }
    }
    return null;
  }

  /**
   * Restore a URL from screen name and params.
   */
  restore(screenName: string, params: Record<string, string> = {}): string {
    const route = this.routes.find((r) => r.screenName === screenName);
    if (!route) return '/';

    let url = route.pattern;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, value);
    }
    return url;
  }

  /**
   * Get all registered routes (for debugging/inspection).
   */
  getRoutes(): ReadonlyArray<RouteDefinition> {
    return this.routes;
  }

  /**
   * Match a pattern against a path, extracting params.
   * Returns null if no match.
   */
  private _matchPattern(
    pattern: string,
    path: string
  ): Record<string, string> | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      const pp = patternParts[i]!;
      const pathPart = pathParts[i]!;

      if (pp.startsWith(':')) {
        // Dynamic segment
        params[pp.slice(1)] = pathPart;
      } else if (pp !== pathPart) {
        return null;
      }
    }
    return params;
  }
}

// ===== RouterDelegate =====

export class RouterDelegate {
  private parser: RouteParser;
  private navId: string;

  constructor(parser: RouteParser, navId: string = 'main') {
    this.parser = parser;
    this.navId = navId;
  }

  /**
   * Handle an incoming deep link or URL.
   * Parses the URL and navigates to the matching screen.
   */
  handleDeepLink(url: string): boolean {
    const config = this.parser.parse(url);
    if (!config) return false;

    const store = useNavStore.getState();
    store.pushScreen(this.navId, config.screenName, config.params);
    store.setCurrentUrl(url);
    return true;
  }

  /**
   * Replace current screen via deep link.
   */
  replaceWithDeepLink(url: string): boolean {
    const config = this.parser.parse(url);
    if (!config) return false;

    const store = useNavStore.getState();
    store.replaceScreen(this.navId, config.screenName, config.params);
    store.setCurrentUrl(url);
    return true;
  }

  /**
   * Get the current URL based on active screen.
   */
  getCurrentUrl(): string {
    const store = useNavStore.getState();
    const screenName = store.getCurrentScreenName(this.navId);
    if (!screenName) return '/';

    const params = store.restoreScreenState(this.navId, screenName);
    return this.parser.restore(screenName, params as Record<string, string>);
  }
}

// ===== Convenience: createRouter =====

/**
 * Create a Router instance with routes.
 *
 * @example
 * const router = createRouter([
 *   { pattern: '/home', screenName: 'Home' },
 *   { pattern: '/profile/:userId', screenName: 'Profile' },
 *   { pattern: '/settings', screenName: 'Settings', guard: () => isLoggedIn },
 * ]);
 */
export function createRouter(
  routes: Array<{ pattern: string; screenName: string; guard?: () => boolean }>,
  navId: string = 'main'
): { parser: RouteParser; delegate: RouterDelegate } {
  const parser = new RouteParser();
  for (const route of routes) {
    parser.register(route.pattern, route.screenName, route.guard);
  }
  const delegate = new RouterDelegate(parser, navId);
  return { parser, delegate };
}
