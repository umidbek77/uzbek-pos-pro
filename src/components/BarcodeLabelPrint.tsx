import React, { forwardRef } from 'react';
import { Box, Typography } from '@mui/material';

interface BarcodeLabelPrintProps {
  productName: string;
  sku: string;
  barcode: string;
  price: number;
  size?: '80mm' | '58mm' | '40x30';
}

const BarcodeLabelPrint = forwardRef<HTMLDivElement, BarcodeLabelPrintProps>(
  ({ productName, sku, barcode, price, size = '40x30' }, ref) => {
    const formatPrice = (p: number) => new Intl.NumberFormat('uz-UZ').format(p);

    // Dimensions based on label size
    const dimensions = {
      '80mm': { width: '80mm', height: '40mm', fontSize: 12 },
      '58mm': { width: '58mm', height: '30mm', fontSize: 10 },
      '40x30': { width: '40mm', height: '30mm', fontSize: 8 },
    };

    const dim = dimensions[size];

    return (
      <Box
        ref={ref}
        sx={{
          width: dim.width,
          height: dim.height,
          border: '1px dashed #ccc',
          padding: '2mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'monospace',
          backgroundColor: 'white',
          '@media print': {
            border: 'none',
            pageBreakAfter: 'always',
          },
        }}
      >
        {/* Product Name */}
        <Typography
          sx={{
            fontSize: dim.fontSize,
            fontWeight: 700,
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {productName}
        </Typography>

        {/* Barcode visualization (simple text-based) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            my: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: dim.fontSize + 2,
              fontFamily: 'monospace',
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            {barcode || sku}
          </Typography>
        </Box>

        {/* Price and SKU */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Typography sx={{ fontSize: dim.fontSize - 1, color: '#666' }}>
            {sku}
          </Typography>
          <Typography
            sx={{
              fontSize: dim.fontSize + 1,
              fontWeight: 700,
            }}
          >
            {formatPrice(price)} UZS
          </Typography>
        </Box>
      </Box>
    );
  }
);

BarcodeLabelPrint.displayName = 'BarcodeLabelPrint';

export default BarcodeLabelPrint;
