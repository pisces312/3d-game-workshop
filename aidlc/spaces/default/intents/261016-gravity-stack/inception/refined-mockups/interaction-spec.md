# Interaction Specification

| State | Player action | System response |
|---|---|---|
| Ready | Click Start | Reset round, hide panel, spawn active block |
| Playing | Click/tap scene or Space | Set state to Dropping and apply gravity |
| Dropping | Any further input | Ignore input until landing resolves |
| Playing after landing | Wait | Spawn next block after a short feedback delay |
| Over | Click Restart | Clear tower and begin a new round |

Status text communicates the active axis, gravity, successful placement, or failure reason. [NFR-03]
