import { Landmark, GestureType } from '../types';

// Helper to calculate Euclidean distance between two 3D points
// const distance = (a: Landmark, b: Landmark) => {
//   return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
// };

// Check if a finger is extended based on tip vs pip y-coordinate (screen space inverted usually, but MediaPipe 0 is top)
// MediaPipe: y increases downwards. So if tip.y < pip.y, finger is "up".
const isFingerExtended = (tip: Landmark, pip: Landmark, wrist: Landmark): boolean => {
  // Simple check: is tip further from wrist than pip is? 
  // This works better for 3D orientation than just Y check.
  const distTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
  const distPip = Math.sqrt(Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2));
  return distTip > distPip;
};

export const detectGesture = (landmarks: Landmark[]): GestureType => {
  if (!landmarks || landmarks.length < 21) return 'NONE';

  const wrist = landmarks[0];
  
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  const thumbExtended = isFingerExtended(thumbTip, thumbIp, wrist); // Thumb is tricky, but this basic check works often
  const indexExtended = isFingerExtended(indexTip, indexPip, wrist);
  const middleExtended = isFingerExtended(middleTip, middlePip, wrist);
  const ringExtended = isFingerExtended(ringTip, ringPip, wrist);
  const pinkyExtended = isFingerExtended(pinkyTip, pinkyPip, wrist);

  // LOGIC:
  // PLANE (Open Hand): All 5 fingers extended
  // LOVE (ILY Sign): Thumb, Index, Pinky extended. Middle, Ring curled.

  if (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return 'PLANE';
  }

  if (thumbExtended && indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    return 'LOVE';
  }
  
  // Loose "Love" check (sometimes thumb isn't perfectly detected as extended depending on angle)
  if (indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
     return 'LOVE';
  }

  return 'NONE';
};