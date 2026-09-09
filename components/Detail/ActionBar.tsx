"use client";

// The pinned action bar: the step sentence on the left, the buttons on the
// right. One primary button, brand green, or blue when a decline needs the EA.

import { primary, regenerate } from "@/lib/actions";
import { activePartners, primaryAction, STAGE_DRAFT } from "@/lib/pipeline";
import { joinNames } from "@/lib/format";
import { personName } from "@/lib/data";
import { IconSearch, IconSend } from "@/components/ui/icons";
import { useDetail } from "./DetailContext";

function useStepSentence(): string {
  const { portco, members, stage, phase } = useDetail();
  const exec = portco.execContact.name;
  const n = activePartners(portco).length;
  const boardCount = members.length === 3 ? "all three" : `all ${members.length}`;
  switch (stage) {
    case 1:
      if (phase === "idle") return `Step 1 of 5. Checks ${n} calendars, ranks the top three windows per quarter, and drafts the proposal for ${exec}.`;
      if (phase === "needsDraft") return `Step 1 of 5. Drafts the proposal for ${exec} from the ranked windows.`;
      return `Step 1 of 5. Approving the one-pager moves it to the partners for sign-off. Nothing goes to ${exec} yet.`;
    case 2:
      if (phase === "waiting") return `Step 2 of 5. Waiting for each partner to reply yes. The company sees nothing until they do.`;
      if (phase === "ready") return `Step 2 of 5. All partners signed off. Next, the cover email to ${exec}.`;
      return `Step 2 of 5. Sends the one-pager to ${joinNames(portco.partnerIds.map(personName))} for a yes before ${exec} sees it.`;
    case 3:
      if (phase === "waiting") return `Step 3 of 5. Waiting for ${exec} to pick one option per quarter.`;
      if (phase === "ready") return `Step 3 of 5. Dates picked. Next, the confirmation email to the board.`;
      return `Step 3 of 5. Sends the proposal and one-pager to ${exec}. They pick one option per quarter.`;
    case 4:
      if (phase === "conflict") return `Step 4 of 5. Sends the Q3 change to ${boardCount} board members. The other quarters stay as confirmed.`;
      if (phase === "waiting") return `Step 4 of 5. Waiting for ${boardCount} board members to confirm the four dates.`;
      if (phase === "ready") return `Step 4 of 5. Every board member confirmed. Lock the dates and book hotels and dinners.`;
      return `Step 4 of 5. Sends the four picked dates to ${boardCount} board members for a yes.`;
    default:
      if (phase === "done") return "All five steps done. Calendar invites go out from Outlook.";
      return "Step 5 of 5. Locks the four dates and books a hotel and a dinner for each. Invites go out from Outlook.";
  }
}

export function ActionBar() {
  const { portco, members, stage, phase, working, editingKey, setEditingKey, viewStep, setViewStep } = useDetail();
  const action = primaryAction(portco, members);
  const conflictKey = portco.targetQuarters.map((q) => `conflict:${q}`).find((k) => portco.drafts[k] && !portco.drafts[k].approved);
  const draftKey = phase === "conflict" && conflictKey ? conflictKey : STAGE_DRAFT[stage];
  const showingDraft = (phase === "review" || phase === "conflict") && !!portco.drafts[draftKey] && !working;
  const canRegenerate = showingDraft && phase === "review";
  const blue = phase === "conflict";
  const sentence = useStepSentence();

  return (
    <div className="flex shrink-0 items-center justify-between gap-6 border-t border-line bg-white px-7 py-3.5 shadow-[0_-8px_24px_-18px_rgba(23,34,26,0.25)]" data-testid="action-bar">
      <span className="text-[14px] text-mut" data-testid="action-hint">
        {viewStep !== null ? "Looking at a finished step, read only." : working ? <span className="working text-brand">{working}</span> : editingKey ? "Editing. Save or cancel in the draft." : sentence}
      </span>
      <div className="flex shrink-0 items-center gap-2.5">
        {viewStep !== null ? (
          <button type="button" className={secondary} onClick={() => setViewStep(null)} data-testid="back-to-current">
            Back to the current step
          </button>
        ) : (
          <>
            {showingDraft && !editingKey ? (
              <button type="button" className={secondary} onClick={() => setEditingKey(draftKey)} data-testid="edit-draft">
                Edit
              </button>
            ) : null}
            {canRegenerate && !editingKey ? (
              <button type="button" className={secondary} onClick={() => void regenerate(portco.id)} data-testid="regenerate-draft">
                Regenerate
              </button>
            ) : null}
            {action ? (
              <button
                type="button"
                onClick={() => void primary(portco.id)}
                disabled={!action.enabled || !!working || !!editingKey}
                data-testid="primary-action"
                className={
                  "inline-flex h-11 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-[22px] text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 " +
                  (blue ? "bg-you shadow-[0_1px_2px_rgba(43,95,158,0.35)] hover:brightness-95" : "bg-brand shadow-[0_1px_2px_rgba(20,63,31,0.3)] hover:bg-brand2")
                }
              >
                {stage === 1 && phase === "idle" ? <IconSearch size={18} /> : /send/i.test(action.label) ? <IconSend size={18} /> : null}
                <span>{action.label}</span>
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

const secondary = "inline-flex h-11 items-center whitespace-nowrap rounded-[10px] border border-ring bg-white px-[18px] text-[16px] font-semibold text-txt hover:border-brand disabled:cursor-not-allowed disabled:opacity-50";
