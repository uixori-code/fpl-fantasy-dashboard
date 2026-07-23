import type { Team } from '../lib/types';
import type { FixtureRun } from '../lib/types';
import { difficultyColor, teamShortName } from '../lib/format';

export default function FDRGrid({ teams, fixtureRuns }: { teams: Team[]; fixtureRuns: FixtureRun[] }) {
  const sorted = [...fixtureRuns].sort((a, b) => a.avgDifficultyNext5 - b.avgDifficultyNext5);
  const maxCols = Math.max(1, ...sorted.map((r) => r.nextDifficulties.length));

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-white/10">
            <th className="px-4 py-2 font-medium">Team</th>
            {Array.from({ length: maxCols }).map((_, i) => (
              <th key={i} className="px-2 py-2 font-medium text-center">
                GW+{i + 1}
              </th>
            ))}
            <th className="px-4 py-2 font-medium text-right">Avg FDR</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((run) => (
            <tr key={run.teamId} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-2 font-medium">{teamShortName(teams, run.teamId)}</td>
              {Array.from({ length: maxCols }).map((_, i) => {
                const difficulty = run.nextDifficulties[i];
                return (
                  <td key={i} className="px-2 py-2 text-center">
                    {difficulty ? (
                      <span
                        className={`inline-block w-7 h-7 leading-7 rounded text-xs font-bold text-white ${difficultyColor(difficulty)}`}
                      >
                        {difficulty}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-2 text-right font-semibold text-accent">{run.avgDifficultyNext5}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
