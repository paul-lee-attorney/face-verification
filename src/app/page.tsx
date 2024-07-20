// src/app/page.tsx
import React from 'react';
import FaceVerification from './components/FaceVerification';
import { Container, CssBaseline, Typography } from '@mui/material';

const HomePage: React.FC = () => {
    return (
        <Container component="main" maxWidth="md">
            <CssBaseline />
            <Typography component="h1" variant="h4" align="center" gutterBottom>
                Face Verification
            </Typography>
            <FaceVerification />
        </Container>
    );
};

export default HomePage;