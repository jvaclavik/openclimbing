import dynamic from 'next/dynamic';
import { useTheme } from '@emotion/react';

// The QR code only appears inside the (client-only) share dialog, so load the
// library lazily to keep it out of the shared bundle.
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((m) => m.QRCodeSVG),
  { ssr: false },
);

type Props = {
  payload: string;
  image?: string;
};

export const QrCode = ({ payload, image }: Props) => {
  const theme = useTheme();
  const imageSettings = image
    ? { src: image, width: 32, height: 32, excavate: true }
    : undefined;

  return (
    <QRCodeSVG
      value={payload}
      size={128}
      level="M"
      bgColor="transparent"
      fgColor={theme.palette.text.primary}
      imageSettings={imageSettings}
    />
  );
};
