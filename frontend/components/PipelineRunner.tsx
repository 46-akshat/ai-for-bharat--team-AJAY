"use client";

import { useState, useCallback } from "react";
import { Play, Database, RefreshCw, Layers, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/lib/types";
import { JsonViewer } from "./JsonViewer";
import {
  runPipelineGenerate,
  runPipelineNormalize,
  runPipelinePair,
  runPipelineScore,
  runPipelineDecision,
  wipeDatabase
} from "@/lib/api";

type StepResult = {
  stdout: string;
  data: any;
};

export function PipelineRunner({ setSteps }: { setSteps: (steps: PipelineStep[]) => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [results, setResults] = useState<Record<number, StepResult>>({});
  const [error, setError] = useState<string | null>(null);

  const pipelineSequence = [
    { func: runPipelineGenerate, name: "Generate" },
    { func: runPipelineNormalize, name: "Normalize" },
    { func: runPipelinePair, name: "Pair" },
    { func: runPipelineScore, name: "Score" },
    { func: runPipelineDecision, name: "Decision" },
  ];

  const updateStepper = useCallback(
    (index: number, status: "pending" | "active" | "done") => {

      setSteps((prev) =>
        prev.map((step, i) => {
          if (i < index) return { ...step, status: "done" };
          if (i === index) return { ...step, status };
          return { ...step, status: "pending" };
        })
      );
    },
    [setSteps]
  );

  const handleWipe = async () => {
    try {
      setIsRunning(true);
      setError(null);
      setResults({});
      setSteps((prev) => prev.map((s) => ({ ...s, status: "pending" })));
      setCurrentStepIndex(-1);
      
      const res = await wipeDatabase();
      alert(res.message || "Database wiped.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runNextStep = async () => {
    if (currentStepIndex >= pipelineSequence.length - 1) return;

    setIsRunning(true);
    setError(null);
    if (currentStepIndex === -1) {
      setResults({});
    }

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    updateStepper(nextIndex, "active");

    try {
      const res = await pipelineSequence[nextIndex].func();
      
      setResults((prev) => ({
        ...prev,
        [nextIndex]: {
          stdout: res.stdout || "",
          data: res.data || res.message,
        },
      }));

      updateStepper(nextIndex, "done");
    } catch (err: any) {
      setError(err.message);
      updateStepper(nextIndex, "pending");
      setCurrentStepIndex(currentStepIndex); // Revert index on error
    } finally {
      setIsRunning(false);
    }
  };

  const activeResult = currentStepIndex >= 0 ? results[currentStepIndex] : null;
  const isComplete = currentStepIndex >= pipelineSequence.length - 1 && !isRunning && !error;
  const buttonLabel = isRunning 
    ? "Running..." 
    : currentStepIndex === -1 
      ? "Start Pipeline" 
      : isComplete 
        ? "Pipeline Complete" 
        : `Run Step: ${pipelineSequence[currentStepIndex + 1].name}`;

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300">
      {/* Runner Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Pipeline Orchestrator
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Run backend python scripts and monitor execution output</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleWipe}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-red-950/30 text-red-500 border border-red-900 rounded hover:bg-red-900/50 disabled:opacity-50 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Wipe DB
          </button>
          
          <button
            onClick={runNextStep}
            disabled={isRunning || isComplete}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isComplete ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            {buttonLabel}
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-950/50 border border-red-900 rounded-md text-red-400 text-sm">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Results Panel */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-400">Execution Log</h2>
          
          <div className="flex-1 min-h-[300px] border border-zinc-800 rounded bg-zinc-950 p-3 overflow-auto font-mono text-[11px] text-zinc-500 leading-relaxed">
            {Object.keys(results).length === 0 && !isRunning && (
              <div className="flex items-center justify-center h-full text-zinc-700">
                Click "Run Pipeline" to start execution
              </div>
            )}
            
            {Object.entries(results).map(([idx, res]) => (
              <div key={idx} className="mb-4">
                <div className="text-indigo-400 font-bold mb-1">=== Step {Number(idx) + 1} Output ===</div>
                <div className="whitespace-pre-wrap">{res.stdout || "No stdout"}</div>
              </div>
            ))}
            
            {isRunning && currentStepIndex >= 0 && (
              <div className="flex items-center gap-2 text-emerald-500 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Executing Model Script...
              </div>
            )}
          </div>
        </div>

        {/* Data Sample Panel */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-400">Data Sample</h2>
          
          <JsonViewer 
            title={activeResult ? "Latest Script Output" : "Idle"} 
            data={activeResult ? activeResult.data : { message: "Waiting for pipeline step data..." }}
            className="flex-1 min-h-[300px]"
          />
        </div>
      </div>
    </div>
  );
}