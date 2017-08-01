declare class Vue {
  constructor(options: VueOptions);
  static component(name: string, options: VueOptions);
}

interface VueOptions {
  el?: Element | string;
  template?: string;

  data?: Object | (() => Object);
  props?: string[] | { [key: string]: any };
  propsData?: Object;
  computed?: { [key: string]: any };
  methods?: { [key: string]: (...args: any[]) => any };
  watch?: { [key: string]: any };

  render?(createElement?: Function): any;
  staticRenderFns?: ((createElement: Function) => any)[];

  beforeCreate?(): void;
  created?(): void;
  beforeDestroy?(): void;
  destroyed?(): void;
  beforeMount?(): void;
  mounted?(): void;
  beforeUpdate?(): void;
  updated?(): void;
  activated?(): void;
  deactivated?(): void;

  directives?: { [key: string]: any };
  components?: { [key: string]: any };
  transitions?: { [key: string]: Object };
  filters?: { [key: string]: Function };

  parent?: Vue;
  mixins?: (VueOptions | Vue)[];
  name?: string;
  extends?: VueOptions | Vue;
  delimiters?: [string, string];

  router?: VueRouter;
}



type Dictionary<T> = { [key: string]: T };

type RouterMode = "hash" | "history" | "abstract";
type RawLocation = string | Location;
type RedirectOption = RawLocation | ((to: Route) => RawLocation);
type NavigationGuard = (
  to: Route,
  from: Route,
  next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void
) => any

declare class VueRouter {
  constructor (options?: RouterOptions);

  app: Vue;
  mode: RouterMode;
  currentRoute: Route;

  beforeEach (guard: NavigationGuard): void;
  afterEach (hook: (to: Route, from: Route) => any): void;
  push (location: RawLocation): void;
  replace (location: RawLocation): void;
  go (n: number): void;
  back (): void;
  forward (): void;
  //getMatchedComponentes (to?: RawLocation): Component[];
  resolve (to: RawLocation, current?: Route, append?: boolean): {
    normalizedTo: Location;
    resolved: Route;
    href: string;
  };

  //static install: PluginFunction<never>;
}

interface RouterOptions {
  routes?: RouteConfig[];
  mode?: RouterMode;
  base?: string;
  linkActiveClass?: string;
  scrollBehavior?: (
    to: Route,
    from: Route,
    savedPosition: { x: number, y: number } | undefined
  ) => { x: number, y: number } | { selector: string } | void;
}

interface RouteConfig {
  path: string;
  name?: string;
  component?: any;
  components?: Dictionary<any>;
  redirect?: RedirectOption;
  alias?: string | string[];
  children?: RouteConfig[];
  meta?: any;
  beforeEnter?: NavigationGuard;
}

interface RouteRecord {
  path: string;
  components: Dictionary<any>;
  instances: Dictionary<Vue>;
  name?: string;
  parent?: RouteRecord;
  redirect?: RedirectOption;
  matchAs?: string;
  meta: any;
  beforeEnter?: (
    route: Route,
    redirect: (location: RawLocation) => void,
    next: () => void
  ) => any;
}

interface Route {
  path: string;
  name?: string;
  hash: string;
  query: Dictionary<string>;
  params: Dictionary<string>;
  fullPath: string;
  matched: RouteRecord[];
  redirectedFrom?: string;
  meta?: any;
}