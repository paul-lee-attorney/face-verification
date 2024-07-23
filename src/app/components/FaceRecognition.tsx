"use client"

import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import PhotoIdUpload from './PhotoIdUpload';
import { captureImage, checkEyeBlink, checkFaceAct, checkHeadNode, checkHeadTurn, checkMouthOpen, compareFaces, loadModels, startVideo } from '@/utils/faceApi';
import Image from 'next/image';

export default function FaceRecognition() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const [photoIdImage, setPhotoIdImage] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string[]>([]);

    const [ text, setText ] = useState<string>('Instruction for ID verification.');

    useEffect(() => {
        const init = async () => {
            await loadModels();
            if (videoRef.current) await startVideo(videoRef.current);
            setModelsLoaded(true);
        }

        init();
    }, [videoRef]);

    const verifyFace = async() =>{
        let capImg = captureImage(videoRef.current!, canvasRef.current!);
        if (capImg) {
            setCapturedImage(v => ([...v, capImg]));
            let res = await compareFaces(capImg, photoIdImage!);
            switch (res) {
                case 1:
                    return true;
                case -1:
                    setText('No face is detected!');
                    return false;
                case 0:
                    setText('Face not verified!');
                    return false;
            }
        }
        return false;
    }

    const handleVerifyFace = async () => {
        if (modelsLoaded && videoRef.current && canvasRef.current && photoIdImage) {

            setCapturedImage([]);
            
            let flag = await verifyFace();
            if (!flag) return;

            // setText('Please blink your eyes!');
            // flag = await checkFaceAct(videoRef.current, checkEyeBlink);
            // if (!flag) {
            //     setText('No eye blinks detected!');
            //     return;
            // }

            // flag = await verifyFace();
            // if (!flag) return;

            setText('Pls turn your head left and right!');
            flag = await checkFaceAct(videoRef.current, checkHeadTurn);
            if (!flag) {
                setText('No head turn detected!');
                return;
            }

            flag = await verifyFace();
            if (!flag) return;

            setText('Please nod your head!');
            flag = await checkFaceAct(videoRef.current, checkHeadNode);
            if (!flag) {
                setText('No head nod detected!');
                return;
            }

            flag = await verifyFace();
            if (!flag) return;

            setText('Please open your mouth!');
            flag = await checkFaceAct(videoRef.current, checkMouthOpen);
            if (!flag) {
                setText('No mouth open detected!');
                return;
            }

            flag = await verifyFace();
            if (!flag) return;

            setText('Thank You!');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h3" align="center" gutterBottom sx={{ m:2, fontWeight:'bold' }}>
                        {text ?? ' '}
                </Typography>

            <Stack direction='row' sx={{m:1, p:1}}>
                <Stack direction='column' sx={{ m:1, p:1, alignItems:'center'}}>

                    <div style={{ position: 'relative', width: '360px', height: '280px' }}>
                        <video ref={videoRef} autoPlay playsInline width="360" height="280" style={{ borderRadius: '8px' }} />
                        <canvas ref={canvasRef} width="360" height="280" style={{ display: 'none' }}></canvas>
                        <div
                            style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '150px',
                            height: '200px',
                            border: '4px dashed #fff',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        />
                    </div>

                        <PhotoIdUpload onImageUpload={setPhotoIdImage} />
                        <Button variant="contained" color="primary" onClick={handleVerifyFace} sx={{ m:2, width:218 }}>
                            Verify Face
                        </Button>
                </Stack>


                <Stack direction="column" sx={{m:1, p:1}}>
                    {capturedImage && capturedImage.map((v, i) => (
                        <Image key={i} src={v} alt='Captured Img' width={180} height={160} />
                    ))}
                    {capturedImage.length == 0 &&(
                        <>
                            <Image src='/assets/smile-face.jpg' alt='Captured Img' width={180} height={160} />
                            <Image src='/assets/smile-face.jpg' alt='Captured Img' width={180} height={160} />
                            <Image src='/assets/smile-face.jpg' alt='Captured Img' width={180} height={160} />
                            <Image src='/assets/smile-face.jpg' alt='Captured Img' width={180} height={160} />
                        </>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};