"use client"

import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

interface PhotoIdUploadProps {
    onImageUpload: (image: string) => void;
}

const PhotoIdUpload: React.FC<PhotoIdUploadProps> = ({ onImageUpload }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                onImageUpload(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <Button variant="contained" component="label">
                Upload Photo ID
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </Button>
            {imagePreview && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">Uploaded Photo ID:</Typography>
                    <img src={imagePreview} alt="Photo ID" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />
                </Box>
            )}
        </Box>
    );
};

export default PhotoIdUpload;