import React from 'react';

interface CustomImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    style?: React.CSSProperties;
}

export default function CustomImg(props: CustomImgProps) {
    return <img {...props} />;
}
