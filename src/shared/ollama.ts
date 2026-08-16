export type OllamaProgress =
    | {
          phase: "runtime";
          status: "checking" | "downloading" | "starting" | "ready" | "error";
          percent?: number;
          message?: string;
          version?: string;
      }
    | {
          phase: "model";
          status: "checking" | "pulling" | "ready" | "error";
          percent?: number;
          message?: string;
          completed?: number;
          total?: number;
      };
