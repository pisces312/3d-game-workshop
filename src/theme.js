// AWS Edition theme: palette, service names and Region "levels" (FR19, FR21, FR22).
// Pure module: no three.js, no DOM. AWS appears only as factual service / Region names.

export const PALETTE = Object.freeze({
  orange: 0xff9900,
  orangeLight: 0xffb84d,
  ink: 0x232f3e,
  bg: 0x0b1320,
  blue: 0x3eb8e5,
  white: 0xffffff,
  tunnel: 0x3a5276,
  twist: 0xff9900,
});

const hex = (n) => '#' + n.toString(16).padStart(6, '0').toUpperCase();

export const CSS_PALETTE = Object.freeze(
  Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, hex(v)])),
);

export const SERVICES = Object.freeze([
  'Lambda', 'S3', 'DynamoDB', 'EC2', 'CloudFront', 'API Gateway', 'SQS', 'SNS', 'Step Functions',
  'EventBridge', 'Bedrock', 'ECS', 'EKS', 'Aurora', 'CloudWatch', 'IAM', 'Kinesis', 'Route 53',
]);

export const REGIONS = Object.freeze([
  'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
  'ap-northeast-1', 'ap-southeast-1', 'ap-south-1', 'sa-east-1',
]);

export const REGION_EVERY = 5;

const isScore = (s) => Number.isInteger(s) && s >= 0;

/** Service shown for the s-th pass (s ≥ 1). Invalid / ≤ 0 → first service. */
export function serviceForScore(s) {
  if (!isScore(s) || s < 1) return SERVICES[0];
  return SERVICES[(s - 1) % SERVICES.length];
}

/** Region for a score: changes every REGION_EVERY points and wraps. Invalid → first. */
export function regionForScore(s) {
  if (!isScore(s)) return REGIONS[0];
  return REGIONS[Math.floor(s / REGION_EVERY) % REGIONS.length];
}

/** True only when the score increased across a REGION_EVERY boundary. */
export function regionChanged(prev, next) {
  if (!isScore(prev) || !isScore(next) || next <= prev) return false;
  return Math.floor(prev / REGION_EVERY) !== Math.floor(next / REGION_EVERY);
}
