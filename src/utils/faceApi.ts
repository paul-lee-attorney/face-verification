import * as faceapi from 'face-api.js';

export const loadModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/ssd_mobilenetv1');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68');
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
};

export const startVideo = async (video: HTMLVideoElement) => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  if (video) {
    video.srcObject = stream;
    video.play();
  }
};

export const captureImage = (video: HTMLVideoElement, canvas:HTMLCanvasElement) => {
  if (canvas && video) {
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }
  return null; 
}

export const detectFace = async (video: HTMLVideoElement) => {
  const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
  return detections;
};

export const cropFaceFromImage = async (imageUrl: string) => {
  const img = await faceapi.fetchImage(imageUrl);
  const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  
  if (detection) {
      const { x, y, width, height } = detection.detection.box;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
          return canvas.toDataURL('image/png');
      }
  }
  return null;
};

export const compareFaces = async (image1: string, image2: string) => {

  const threshold = 0.6;

  const img1 = await faceapi.fetchImage(image1);
  const img2 = await faceapi.fetchImage(image2);

  const detections1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
  const detections2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

  if (detections1 && detections2) {
      const distance = faceapi.euclideanDistance(detections1.descriptor, detections2.descriptor);
      return (distance < threshold ? 1 : 0);
  } else {
      return (-1);
  }

}

// ==== Check Face Act ====

interface HeadPosition {
  x: number;
  y: number;
  timestamp: number;
}

export const checkFaceAct = async (video: HTMLVideoElement, checkAct: (video: HTMLVideoElement, prePosition: HeadPosition | null) => Promise<boolean | null>): Promise<boolean> => {

  const FRAMES_THRESHOLD = 2;
  let previousHeadPosition: HeadPosition | null = null;

  let actCount = 0;
  let frameCount = 0;

  let intervalId = setInterval(async () => {
    let flag = await checkAct(video, previousHeadPosition);
    
    if (flag) {
      frameCount++;
      console.log('frameCount: ', frameCount);
    } else {
      if (frameCount >= FRAMES_THRESHOLD) {
        actCount++;
      }
      frameCount = 0;
    }
    // }
  }, 100);

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await wait(5000); // Run for 5 seconds

  clearInterval(intervalId);

  console.log('finalCount: ', actCount);
  return actCount >= 1;
}


// ==== Blink Eyes ====

// Function to calculate the Euclidean distance between two points using Math.hypot
const euclideanDistance = (point1: faceapi.Point, point2: faceapi.Point) => {
  return Math.hypot(point2.x - point1.x, point2.y - point1.y);
};

export const checkEyeBlink = async (video: HTMLVideoElement, prePosition: HeadPosition | null): Promise<boolean | null> => {

  const detections = await detectFace(video);
  if (detections) {
    const landmarks = detections.landmarks;

    const threshold = 0.6;

    const getEAR = (eye: faceapi.Point[]) => {
      const a = euclideanDistance(eye[1], eye[5]);
      console.log('a: ', a);
      const b = euclideanDistance(eye[2], eye[4]);
      console.log('b: ', b);
      const c = euclideanDistance(eye[0], eye[3]);
      console.log('c: ', c);
      return (a + b) / c;
    };

    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEAR = getEAR(leftEye);
    console.log('leftEAR: ', leftEAR);
    const rightEAR = getEAR(rightEye);
    console.log('rightEAR: ', rightEAR);

    return leftEAR < threshold || rightEAR < threshold;
  }

  return null;
}

// ==== Head Turn ===

export const checkHeadTurn = async (video: HTMLVideoElement, prePosition: HeadPosition | null): Promise<boolean | null> => {

  const detections = await detectFace(video);
  if (detections) {
    const landmarks = detections.landmarks;

    const threshold = 0.1; // Adjust this threshold based on your requirements

    const nose = landmarks.getNose()[0];
    const currentPosition: HeadPosition = { x: nose.x, y:nose.y, timestamp: Date.now() };

    console.log('prePosition: ', prePosition);
    console.log('curPosition: ', currentPosition);

    if (prePosition) {
      const deltaX = currentPosition.x - prePosition.x;
      const deltaTime = currentPosition.timestamp - prePosition.timestamp;
      const velocity = deltaX / deltaTime;
      console.log('velocity: ', velocity);
      return Math.abs(velocity) > threshold;
    } else {
      return checkHeadTurn(video, currentPosition);
    }
  }
  return null;
}

// ==== Head Nod ===

export const checkHeadNode = async (video: HTMLVideoElement, prePosition: HeadPosition | null): Promise<boolean | null> => {

  const detections = await detectFace(video);
  if (detections) {
    const landmarks = detections.landmarks;

    const threshold = 0.08;

    const nose = landmarks.getNose()[0];
    const currentPosition: HeadPosition = { x: nose.x, y:nose.y, timestamp: Date.now() };

    console.log('preNodPosition: ', prePosition);
    console.log('curNodPosition: ', currentPosition);


    if (prePosition) {
      const deltaX = currentPosition.y - prePosition.y;
      const deltaTime = currentPosition.timestamp - prePosition.timestamp;
      const velocity = deltaX / deltaTime;

      console.log('velocityOfNod: ', velocity);

      return Math.abs(velocity) > threshold;
    } else {
      return checkHeadNode(video, currentPosition);
    }
  }
  return null;
};

// ==== Mouth Open ====

export const checkMouthOpen = async (video: HTMLVideoElement, prePosition: HeadPosition | null): Promise<boolean | null> => {

  const detections = await detectFace(video);
  if (detections) {
    const landmarks = detections.landmarks;

    let threshold = 2;

    const mouth = landmarks.getMouth();

    const topLipPoint = mouth[3];  // Upper lip top point
    const bottomLipPoint = mouth[9]; // Lower lip bottom point
    const leftLipPoint = mouth[0];  // Left corner of the mouth
    const rightLipPoint = mouth[6];  // Right corner of the mouth
    
    const verticalDistance = euclideanDistance(topLipPoint, bottomLipPoint);
    console.log('verDis: ', verticalDistance);
    const horizontalDistance = euclideanDistance(leftLipPoint, rightLipPoint);
    console.log('horDis: ', horizontalDistance);
    
    console.log('h/v ratio:', horizontalDistance / verticalDistance);

    return horizontalDistance / verticalDistance < threshold;
  }

  return null;
}
