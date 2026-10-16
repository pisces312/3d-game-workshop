# Security Design

The page has no backend boundary. Static markup is trusted, gameplay values are rendered through `textContent`, and the only external module is the pinned Three.js import map entry. No user input is persisted except the numeric local best score.
