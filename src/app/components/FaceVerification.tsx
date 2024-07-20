"use client"

import React, { useRef, useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import * as faceapi from 'face-api.js';
import PhotoIdUpload from './PhotoIdUpload';

const FaceVerification: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [photoIdImage, setPhotoIdImage] = useState<string | null>(null);
    const [verificationResult, setVerificationResult] = useState<string | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/ssd_mobilenetv1');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68');
            setModelsLoaded(true);
        };

        loadModels();

        if (videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoRef.current!.srcObject = stream;
                });
        }
    }, []);

    const captureImage = () => {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            return canvasRef.current.toDataURL('image/png');
        }
        return null;
    };

    const handleVerifyFace = async () => {
        if (modelsLoaded && videoRef.current && photoIdImage) {
            const capturedImage = captureImage();
            if (capturedImage) {
                const img1 = await faceapi.fetchImage(photoIdImage);
                const img2 = await faceapi.fetchImage(capturedImage);

                const detections1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
                const detections2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

                if (detections1 && detections2) {
                    const distance = faceapi.euclideanDistance(detections1.descriptor, detections2.descriptor);
                    setVerificationResult(distance < 0.6 ? 'Face Verified' : 'Face Not Verified');
                } else {
                    setVerificationResult('Face not detected in one or both images.');
                }
            }
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PhotoIdUpload onImageUpload={setPhotoIdImage} />
            <video ref={videoRef} autoPlay playsInline width="720" height="560" style={{ borderRadius: '8px' }} />
            <canvas ref={canvasRef} width="720" height="560" style={{ display: 'none' }}></canvas>
            <Button variant="contained" color="primary" onClick={handleVerifyFace} sx={{ mt: 2 }}>
                Verify Face
            </Button>
            {verificationResult && <Box sx={{ mt: 2 }}>{verificationResult}</Box>}
        </Box>
    );
};

export default FaceVerification;