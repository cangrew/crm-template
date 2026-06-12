import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ERROR, requireApiRole, STAFF } from "@/lib/auth/authorize";
import { getAgency } from "@/lib/data/agencies";
import { getAgent } from "@/lib/data/agents";
import { getPolicy } from "@/lib/data/policies";
import {
  getStatement,
  listStatementLines,
  postStatement,
  type LedgerEntryWire,
} from "@/lib/data/statements";
import { allocateLine } from "@/lib/domain/commission-engine";
import { createClient } from "@/lib/supabase/server";
import type { Agency, Agent, Policy } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * Post a statement: run the commission engine over every matched line and
 * persist the resulting ledger entries atomically via the post_statement RPC.
 * Staff-only (the RPC re-checks, and RLS is the floor). Ignored and unmatched
 * lines are skipped — they stay on the statement, unposted.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const auth = await requireApiRole(supabase, STAFF);
  if (!auth.ok) {
    return NextResponse.json(AUTH_ERROR[auth.status], { status: auth.status });
  }

  let statement;
  try {
    statement = await getStatement(supabase, id);
  } catch {
    return NextResponse.json({ error: "Statement not found" }, { status: 404 });
  }

  if (statement.status !== "draft" && statement.status !== "matching") {
    return NextResponse.json(
      { error: `Statement is not postable (status: ${statement.status})` },
      { status: 400 },
    );
  }

  const lines = await listStatementLines(supabase, id);
  const matched = lines.filter(
    (l) =>
      (l.match_status === "auto_matched" || l.match_status === "manual_matched") &&
      l.matched_policy_id !== null &&
      !l.posted,
  );

  if (matched.length === 0) {
    return NextResponse.json(
      { error: "No matched lines to post. Match or ignore the lines first." },
      { status: 400 },
    );
  }

  // Hierarchy rows are cached per id — statements repeat policies and agents.
  const policies = new Map<string, Policy>();
  const agents = new Map<string, Agent>();
  const agencies = new Map<string, Agency>();

  const entries: LedgerEntryWire[] = [];
  try {
    for (const line of matched) {
      const policyId = line.matched_policy_id as string;

      let policy = policies.get(policyId);
      if (!policy) {
        policy = await getPolicy(supabase, policyId);
        policies.set(policyId, policy);
      }

      let agent = agents.get(policy.agent_id);
      if (!agent) {
        agent = await getAgent(supabase, policy.agent_id);
        agents.set(policy.agent_id, agent);
      }

      let agency: Agency | null = null;
      if (agent.agency_id !== null) {
        agency = agencies.get(agent.agency_id) ?? null;
        if (!agency) {
          agency = await getAgency(supabase, agent.agency_id);
          agencies.set(agent.agency_id, agency);
        }
      }

      const drafts = allocateLine({
        amountCents: line.amount_cents,
        lineKind: line.line_kind,
        agent: {
          id: agent.id,
          commissionSplitBps: agent.commission_split_bps,
          agencyId: agent.agency_id,
        },
        agency: agency
          ? {
              id: agency.id,
              commissionCutBps: agency.commission_cut_bps,
              overrideCutBps: agency.override_cut_bps,
            }
          : null,
      });

      for (const d of drafts) {
        entries.push({
          statement_line_id: line.id,
          policy_id: policyId,
          entry_kind: d.entryKind,
          payee_type: d.payeeType,
          agent_id: d.agentId,
          agency_id: d.agencyId,
          amount_cents: d.amountCents,
          applied_bps: d.appliedBps,
          period_month: statement.period_month,
        });
      }
    }

    await postStatement(supabase, id, entries);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Posting failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ posted: matched.length, entries: entries.length });
}
