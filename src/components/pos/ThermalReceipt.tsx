import React, { forwardRef } from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
}

interface ReceiptPayment {
  method: string;
  amount: number;
}

interface ThermalReceiptProps {
  receiptWidth?: '80mm' | '58mm';
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  inn?: string;
  transactionNumber: string;
  cashierName?: string;
  branchName?: string;
  customerName?: string;
  items: ReceiptItem[];
  payments: ReceiptPayment[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  date: Date;
  footerText?: string;
}

const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  (
    {
      receiptWidth = '80mm',
      businessName,
      businessAddress,
      businessPhone,
      inn,
      transactionNumber,
      cashierName,
      branchName,
      customerName,
      items,
      payments,
      subtotal,
      discount,
      vat,
      total,
      paidAmount,
      changeAmount,
      date,
      footerText = "Xaridingiz uchun rahmat! / Спасибо за покупку!",
    },
    ref
  ) => {
    const width = receiptWidth === '80mm' ? 300 : 220;
    const fontSize = receiptWidth === '80mm' ? 12 : 10;
    const smallFontSize = receiptWidth === '80mm' ? 10 : 8;

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('uz-UZ').format(price);
    };

    const formatDate = (d: Date) => {
      return d.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const paymentMethodLabels: Record<string, string> = {
      cash: 'Naqd / Наличные',
      humo: 'Humo',
      uzcard: 'UzCard',
      click: 'Click',
      payme: 'Payme',
      uzum: 'Uzum',
    };

    return (
      <Box
        ref={ref}
        sx={{
          width,
          padding: '10px',
          fontFamily: 'monospace',
          fontSize,
          backgroundColor: 'white',
          color: 'black',
          '@media print': {
            margin: 0,
            padding: '5px',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography
            sx={{
              fontSize: fontSize + 4,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: 'black',
            }}
          >
            {businessName}
          </Typography>
          {businessAddress && (
            <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
              {businessAddress}
            </Typography>
          )}
          {businessPhone && (
            <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
              Tel: {businessPhone}
            </Typography>
          )}
          {inn && (
            <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
              STIR/INN: {inn}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', borderColor: 'black', my: 0.5 }} />

        {/* Transaction Info */}
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
            Chek / Чек: {transactionNumber}
          </Typography>
          <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
            Sana / Дата: {formatDate(date)}
          </Typography>
          {branchName && (
            <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
              Filial / Филиал: {branchName}
            </Typography>
          )}
          {cashierName && (
            <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
              Kassir / Кассир: {cashierName}
            </Typography>
          )}
          {customerName && (
            <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
              Mijoz / Клиент: {customerName}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', borderColor: 'black', my: 0.5 }} />

        {/* Items */}
        <Box sx={{ mb: 1 }}>
          {items.map((item, index) => (
            <Box key={index} sx={{ mb: 0.5 }}>
              <Typography
                sx={{
                  fontSize,
                  fontFamily: 'monospace',
                  color: 'black',
                  wordBreak: 'break-word',
                }}
              >
                {item.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
                  {item.quantity} x {formatPrice(item.unitPrice)}
                </Typography>
                <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black', fontWeight: 'bold' }}>
                  {formatPrice(item.total)}
                </Typography>
              </Box>
              {item.discount && item.discount > 0 && (
                <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
                  Chegirma / Скидка: -{formatPrice(item.discount)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', borderColor: 'black', my: 0.5 }} />

        {/* Totals */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
              Jami / Итого:
            </Typography>
            <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
              {formatPrice(subtotal)}
            </Typography>
          </Box>

          {discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
                Chegirma / Скидка:
              </Typography>
              <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
                -{formatPrice(discount)}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
              QQS 12% / НДС 12%:
            </Typography>
            <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
              {formatPrice(vat)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 0.5,
              pt: 0.5,
              borderTop: '1px solid black',
            }}
          >
            <Typography sx={{ fontSize: fontSize + 2, fontFamily: 'monospace', color: 'black', fontWeight: 'bold' }}>
              JAMI / ИТОГО:
            </Typography>
            <Typography sx={{ fontSize: fontSize + 2, fontFamily: 'monospace', color: 'black', fontWeight: 'bold' }}>
              {formatPrice(total)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', borderColor: 'black', my: 0.5 }} />

        {/* Payments */}
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black', fontWeight: 'bold', mb: 0.5 }}>
            To'lov / Оплата:
          </Typography>
          {payments.map((payment, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
                {paymentMethodLabels[payment.method] || payment.method}:
              </Typography>
              <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black' }}>
                {formatPrice(payment.amount)}
              </Typography>
            </Box>
          ))}

          {changeAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black', fontWeight: 'bold' }}>
                Qaytim / Сдача:
              </Typography>
              <Typography sx={{ fontSize, fontFamily: 'monospace', color: 'black', fontWeight: 'bold' }}>
                {formatPrice(changeAmount)}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', borderColor: 'black', my: 0.5 }} />

        {/* QR Code Placeholder */}
        <Box sx={{ textAlign: 'center', my: 1 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              border: '1px solid black',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: smallFontSize,
              fontFamily: 'monospace',
            }}
          >
            [QR Code]
          </Box>
          <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black', mt: 0.5 }}>
            soliq.uz
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', borderColor: 'black', my: 0.5 }} />

        {/* Footer */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: smallFontSize, fontFamily: 'monospace', color: 'black' }}>
            {footerText}
          </Typography>
        </Box>
      </Box>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
