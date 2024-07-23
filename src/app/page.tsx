// src/app/page.tsx
import React from 'react';
import { Container, CssBaseline, Typography } from '@mui/material';
import FaceRecognition from './components/FaceRecognition';

function HomePage() {
    return (
        <Container component="main" sx={{alignItems:'center', alignContent:'center'}}>
            <CssBaseline />
            {/* <Typography component="h1" variant="h4" align="center" gutterBottom>
                Face Verification
            </Typography> */}
            <FaceRecognition />
        </Container>
    );
};

export default HomePage;