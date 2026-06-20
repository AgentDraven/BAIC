/** Global from meritutils PAR CDN (merit_workbench@0.3.2) — see cfg/merit_par_pins.json */
declare global {
  interface Window {
    merit_workbench?: {
      MeritWorkbenchLayout: new (options: Record<string, unknown>) => {
        mount: (el: HTMLElement) => unknown;
        destroy: () => void;
        refresh: (search?: string) => Promise<void>;
      };
      mountMeritWorkbenchPanel?: (
        host: HTMLElement,
        options: Record<string, unknown>,
      ) => { destroy?: () => void };
      mintHnd?: (prefix: string, date?: Date) => string;
    };
  }
}

export {};
