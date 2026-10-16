# Security Requirements

- Do not collect player identity or send gameplay data to a server.
- Keep runtime dependencies pinned to explicit CDN versions.
- Treat local score as non-sensitive client data.
- Do not add dynamic HTML injection for gameplay values; update text nodes only.
