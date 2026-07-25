# Google Ecosystem MCP Servers

Google ships two flavors of MCP servers:

- **Official Google-managed (remote)** — hosted by Google, require a GCP project + OAuth/IAM setup.
- **Community-built (local)** — npm packages, only need an API key env var. Faster to stand up for a hackathon.

Full official reference: https://docs.cloud.google.com/mcp/supported-products
Community/open-source repo: https://github.com/google/mcp

---

## Maps

| Server | Type | Endpoint / Source | Notes |
|---|---|---|---|
| Maps Grounding Lite | Official (GA) | `https://mapstools.googleapis.com/mcp` | Live places/routes-style data access |
| Maps Code Assist | Official (Preview) | `https://mapscodeassist.googleapis.com/mcp` | Grounds coding help in Maps docs — not live data |
| `mcp-google-map` | Community (npm) | `npx -y mcp-google-map` | Simpler local setup, no GCP IAM needed |
| `@modelcontextprotocol/server-google-maps` | Community (npm) | `npx -y @modelcontextprotocol/server-google-maps` | Older reference implementation |

## Workspace (all Developer Preview)

| Server | Endpoint |
|---|---|
| Drive | `https://drivemcp.googleapis.com/mcp/v1` |
| Gmail | `https://gmailmcp.googleapis.com/mcp/v1` |
| Calendar | `https://calendarmcp.googleapis.com/mcp/v1` |
| Chat | `https://chatmcp.googleapis.com/mcp/v1` |
| People API | `https://people.googleapis.com/mcp/v1` |

## Cloud Data & Infra (useful for hackathon backends)

| Server | Endpoint |
|---|---|
| Firestore | `https://firestore.googleapis.com/mcp` |
| Cloud Storage | `https://storage.googleapis.com/storage/mcp` |
| BigQuery | `https://bigquery.googleapis.com/mcp` |
| Cloud SQL | `https://sqladmin.googleapis.com/mcp` |
| Cloud Run | `https://run.googleapis.com/mcp` |
| Spanner | `https://spanner.googleapis.com/mcp` |
| AlloyDB for PostgreSQL | `https://alloydb.googleapis.com/mcp` |

## AI / Gemini

| Server | Notes |
|---|---|
| Gemini Cloud Assist (Preview) | `https://geminicloudassist.googleapis.com/mcp` — manage/troubleshoot GCP conversationally |
| Gemini Enterprise Agent Platform | Vertex AI endpoints for generate/predict/tuning/retrieval/evaluation (`aiplatform.googleapis.com/mcp/*`) |
| Developer Knowledge API | `https://developerknowledge.googleapis.com/mcp` — up-to-date Google dev docs grounding |

## Other

| Server | Notes |
|---|---|
| Android Management API | `https://androidmanagement.googleapis.com/mcp` |
| Google Pay & Wallet (Preview) | `https://paydeveloper.googleapis.com/mcp` |
| Google Home Developer | `https://homedevelopers.googleapis.com/mcp` |
| Design MCP (Preview) | `https://design.googleapis.com/mcp` |
| Stitch (Beta) | `https://stitch.googleapis.com/mcp` — design-to-code |

*(30+ more niche infra servers exist — Kafka, Oracle Database@Google Cloud, NetApp Volumes, Datastream, Cloud Trace, etc. — generally not hackathon-relevant.)*

---

## Hackathon recommendation

Official servers need Cloud project + auth setup, which burns hours you don't have. For a time-boxed build:
- **Maps**: use the community `mcp-google-map` npm package
- **Persistence** (if needed): Firestore or Cloud Storage
- Skip enterprise/infra servers (Kafka, Oracle, GKE, etc.) entirely
