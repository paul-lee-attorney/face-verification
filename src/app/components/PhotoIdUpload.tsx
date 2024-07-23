"use client"

import React, { useState } from 'react';
import { Box, Button, Card, Divider, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

interface PhotoIdUploadProps {
    onImageUpload: (image: string) => void;
}

function PhotoIdUpload({ onImageUpload }:PhotoIdUploadProps) {

    const [photoImg, setPhotoImg] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageUpload(reader.result as string);
                setPhotoImg(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Stack direction='column' sx={{ alignItems:'center' }}>
            <Button variant="contained" component="label" sx={{m:2, width:218}}>
                Upload Photo ID
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </Button>

            <Image src={photoImg || '/assets/photo-id.jpg'} alt='Photo ID' width={270} height={240} />

        </Stack>
    );
};

export default PhotoIdUpload;