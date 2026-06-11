import { AlertCircle, Check } from "lucide-react";

type Props<T extends string> = {
  steps: readonly { value: T; label: string }[];
  current: T;
  problem?: boolean;
};

export function Stepper<T extends string>({ steps, current, problem }: Props<T>) {
  const curIdx = steps.findIndex((s) => s.value === current);
  return (
    <div className="stepper">
      {steps.map((s, i) => {
        let cls = "step";
        const isDone = i < curIdx;
        const isCur = i === curIdx;
        if (problem && isCur) cls += " problem";
        else if (isDone) cls += " done";
        else if (isCur) cls += " cur";
        return (
          <div key={s.value} className={cls}>
            <div className="step-dot">
              {problem && isCur ? (
                <AlertCircle size={14} />
              ) : isDone ? (
                <Check size={14} />
              ) : (
                <span className="text-[11px] font-bold">{i + 1}</span>
              )}
            </div>
            <span className="step-lbl">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
