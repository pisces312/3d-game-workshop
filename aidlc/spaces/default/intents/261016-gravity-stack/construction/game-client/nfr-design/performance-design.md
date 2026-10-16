# Performance Design

Three.js renderer settings use antialiasing, capped pixel ratio, shadow-map sizing, and ACES tone mapping. The animation loop uses a capped delta and keeps the object count low. Camera motion uses damped interpolation rather than expensive post-processing.
