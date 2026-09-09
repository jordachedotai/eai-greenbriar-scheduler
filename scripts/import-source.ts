// Builds data/partners.json, data/portcos.json, and data/board-members.json
// from the real Greenbriar source files in data/source, merged with the
// fictional parts that stay fictional: office street addresses, executive
// contacts, board members, and the EA assignment (a placeholder until Peggy
// confirms). Re-run after editing data/source or the tables below.
//   npm run import:source
// Then: npm run gen:fixtures, npm run gen:states.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import portfolio from "../data/source/greenbriar-portfolio.json";
import type { BoardMember, Partner, PortcoSeed } from "../lib/types";

const ROOT = resolve(__dirname, "..");

type SourceCompany = {
  slug: string;
  name: string;
  sector: string;
  site: string;
  team: { id: string; name: string; title: string; avatar?: string }[];
  city: string;
  cityVerify: boolean;
  logoLocal: string;
};

// Fictional parts, by company slug. Nothing here names a real person.
const FICTION: Record<string, { address: string; exec: [string, string]; board: [string, string][] }> = {
  "ait-worldwide-logistics": { address: "2 Pierce Place, Suite 800", exec: ["Tom Haggerty", "Chief Executive Officer"], board: [["Helen Marsh", "Board Chair"], ["Raymond Cho", "Independent Director"], ["Denise Walker", "Independent Director"]] },
  eshipping: { address: "6300 NW Prairie View Road, Suite 200", exec: ["Karen Delgado", "Chief Executive Officer"], board: [["Gordon Reyes", "Board Chair"], ["Linda Farrow", "Independent Director"], ["Marcus Bell", "Independent Director"]] },
  fragilepak: { address: "2470 St. Rose Parkway, Suite 300", exec: ["Renee Ashby", "President"], board: [["Frank Osei", "Board Chair"], ["Carol Nguyen", "Independent Director"], ["Walter Simms", "Independent Director"]] },
  "jegs-automotive": { address: "101 Innovation Drive, Suite 400", exec: ["Miguel Santana", "Chief Executive Officer"], board: [["Janet Kowalski", "Board Chair"], ["Robert Tran", "Independent Director"], ["Elaine Porter", "Independent Director"]] },
  ontrac: { address: "2501 West Chandler Boulevard, Suite 500", exec: ["Priya Raman", "Chief Financial Officer"], board: [["Samuel Adeyemi", "Board Chair"], ["Nancy Whitaker", "Independent Director"], ["Paul Brennan", "Independent Director"]] },
  "radwell-international": { address: "1 Millennium Drive, Suite 100", exec: ["Dale Whitcomb", "Chief Executive Officer"], board: [["Ruth Calloway", "Board Chair"], ["Hector Ramos", "Independent Director"], ["Beth Lindgren", "Independent Director"]] },
  randys: { address: "10411 Airport Road, Suite 200", exec: ["Ingrid Solberg", "Chief Executive Officer"], board: [["Arne Johansen", "Board Chair"], ["Grace Ito", "Independent Director"], ["Leonard Price", "Independent Director"]] },
  renuity: { address: "6000 Fairview Road, Suite 1200", exec: ["Marcus Greene", "President"], board: [["Diane Fuller", "Board Chair"], ["Kwame Mensah", "Independent Director"], ["Terry Lockhart", "Independent Director"]] },
  "sparkstone-electrical-group": { address: "1240 North Wood Dale Road, Suite 300", exec: ["Jenna Holt", "Chief Executive Officer"], board: [["Brett Hansen", "Board Chair"], ["Maya Patel", "Independent Director"], ["Clifford Young", "Independent Director"]] },
  "sunauto-tire-service": { address: "4800 East Broadway Boulevard, Suite 600", exec: ["Victor Malone", "Chief Executive Officer"], board: [["Joan Kessler", "Board Chair"], ["Dmitri Volkov", "Independent Director"], ["Alice Moreau", "Independent Director"]] },
  "sunvair-aerospace-group": { address: "28100 Avenue Stanford, Suite 100", exec: ["Lorraine Pike", "Chief Executive Officer"], board: [["Carlos Vega", "Board Chair"], ["Sheila Grant", "Independent Director"], ["Nate Ferguson", "Independent Director"]] },
  "the-facilities-group": { address: "400 North Ashley Drive, Suite 2100", exec: ["Curtis Hale", "Chief Executive Officer"], board: [["Wendell Brooks", "Board Chair"], ["Laura Chen", "Independent Director"], ["Gary Thompson", "Independent Director"]] },
  towne: { address: "600 West Germantown Pike, Suite 400", exec: ["Angela Ruiz", "Chief Financial Officer"], board: [["Patricia Dunn", "Board Chair"], ["Omar Haddad", "Independent Director"], ["Steven Kroll", "Independent Director"]] },
  "vive-collision": { address: "1 Penn Plaza, Suite 3600", exec: ["Owen Fairbanks", "Chief Executive Officer"], board: [["Margaret Lowe", "Board Chair"], ["Ken Nakamura", "Independent Director"], ["Rosa Delgado", "Independent Director"]] },
  "west-star-aviation": { address: "2 Terminal Drive, Suite 200", exec: ["Sandra Okoye", "President"], board: [["Howard Fitch", "Board Chair"], ["Amara Nwosu", "Independent Director"], ["Philip Sandoval", "Independent Director"]] },
  wineshipping: { address: "1100 Vintage Way, Suite 300", exec: ["Daniel Brightwater", "Chief Executive Officer"], board: [["Celia Marchetti", "Board Chair"], ["Bruce Halloran", "Independent Director"], ["Yvonne Castillo", "Independent Director"]] },
  "applied-aerospace-defense": { address: "3437 South Airport Way, Suite 100", exec: ["Louis Ferrante", "Chief Executive Officer"], board: [["Martha Ellison", "Board Chair"], ["Desmond Okafor", "Independent Director"], ["Karl Weber", "Independent Director"]] },
  "pursuit-aerospace": { address: "500 Main Street, Suite 700", exec: ["Ellen Sorensen", "Chief Executive Officer"], board: [["Roger Danvers", "Board Chair"], ["Mei Lin Chao", "Independent Director"], ["Stuart Beckett", "Independent Director"]] },
};

// Placeholder EA assignment until Peggy confirms. Peggy gets AIT.
const EA_OF: Record<string, string> = {
  "ait-worldwide-logistics": "ea1",
  eshipping: "ea1",
  fragilepak: "ea1",
  "radwell-international": "ea1",
  "sparkstone-electrical-group": "ea1",
  "jegs-automotive": "ea2",
  ontrac: "ea2",
  randys: "ea2",
  renuity: "ea2",
  "sunauto-tire-service": "ea2",
  "sunvair-aerospace-group": "ea3",
  "the-facilities-group": "ea3",
  towne: "ea3",
  "vive-collision": "ea3",
  "west-star-aviation": "ea4",
  wineshipping: "ea4",
  "applied-aerospace-defense": "ea4",
  "pursuit-aerospace": "ea4",
};

// Ids come from the company name, not the source slug, so they are
// predictable: "SunAuto Tire & Service" becomes "sunauto-tire-service".
function slugOf(c: SourceCompany): string {
  return c.name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function main() {
  const companies = portfolio as SourceCompany[];
  const partners = new Map<string, Partner>();
  const portcos: PortcoSeed[] = [];
  const board: BoardMember[] = [];
  let b = 1;

  for (const c of companies) {
    const id = slugOf(c);
    const fiction = FICTION[id];
    if (!fiction) throw new Error(`No fictional details for ${id}. Add them to FICTION in scripts/import-source.ts.`);
    const ea = EA_OF[id];
    if (!ea) throw new Error(`No EA assignment for ${id}.`);
    for (const t of c.team) {
      if (!partners.has(t.id)) partners.set(t.id, { id: t.id, name: t.name, title: t.title, homeCity: "Rye, NY", avatar: t.avatar });
    }
    portcos.push({
      id,
      name: c.name,
      sector: titleCase(c.sector),
      website: c.site.toLowerCase(),
      logo: c.logoLocal,
      city: c.city,
      cityVerify: c.cityVerify || undefined,
      officeAddress: `${fiction.address}, ${c.city}`,
      partnerIds: c.team.map((t) => t.id),
      execContact: { name: fiction.exec[0], title: fiction.exec[1] },
      targetQuarters: ["Q1", "Q2", "Q3", "Q4"],
      eaId: ea,
    });
    for (const [name, role] of fiction.board) {
      board.push({ id: `b${b++}`, name, portcoId: id, role, calendarVisible: false });
    }
  }

  writeFileSync(resolve(ROOT, "data/partners.json"), JSON.stringify([...partners.values()], null, 2) + "\n");
  writeFileSync(resolve(ROOT, "data/portcos.json"), JSON.stringify(portcos, null, 2) + "\n");
  writeFileSync(resolve(ROOT, "data/board-members.json"), JSON.stringify(board, null, 2) + "\n");
  console.log(`${partners.size} partners, ${portcos.length} portcos, ${board.length} board members`);
  for (const p of portcos) console.log(`  ${p.id.padEnd(28)} ${p.eaId} ${p.city.padEnd(22)} ${p.partnerIds.length} partners${p.cityVerify ? "  (city: confirm with Peggy)" : ""}`);
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

main();
