import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as UploadIcon,
  AutoAwesome as GenerateIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { useSuppliers } from '@/hooks/useSuppliers';
import { generateSKU, uploadProductImage, type ProductWithRelations } from '@/hooks/useProducts';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  cost_price: z.number().min(0).optional().nullable(),
  selling_price: z.number().min(0).optional().nullable(),
  attributes: z.record(z.string()).optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  name_uz: z.string().optional().nullable(),
  name_ru: z.string().optional().nullable(),
  name_en: z.string().optional().nullable(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  brand_id: z.string().optional().nullable(),
  supplier_id: z.string().optional().nullable(),
  cost_price: z.number().min(0).default(0),
  selling_price: z.number().min(0),
  min_price: z.number().min(0).optional().nullable(),
  vat_rate: z.number().min(0).max(100).default(12),
  unit: z.string().default('piece'),
  min_stock: z.number().int().min(0).default(0),
  max_stock: z.number().int().min(0).optional().nullable(),
  track_inventory: z.boolean().default(true),
  is_service: z.boolean().default(false),
  is_active: z.boolean().default(true),
  image_url: z.string().optional().nullable(),
  variants: z.array(variantSchema).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ProductWithRelations | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
];

const VARIANT_ATTRIBUTES = [
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'material', label: 'Material' },
  { key: 'style', label: 'Style' },
];

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
  
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: suppliers = [] } = useSuppliers();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      name_uz: product?.name_uz || '',
      name_ru: product?.name_ru || '',
      name_en: product?.name_en || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      description: product?.description || '',
      category_id: product?.category_id || '',
      brand_id: product?.brand_id || '',
      supplier_id: product?.supplier_id || '',
      cost_price: product?.cost_price || 0,
      selling_price: product?.selling_price || 0,
      min_price: product?.min_price || null,
      vat_rate: product?.vat_rate || 12,
      unit: product?.unit || 'piece',
      min_stock: product?.min_stock || 0,
      max_stock: product?.max_stock || null,
      track_inventory: product?.track_inventory !== false,
      is_service: product?.is_service || false,
      is_active: product?.is_active !== false,
      image_url: product?.image_url || '',
      variants: product?.variants?.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode || '',
        cost_price: v.cost_price || 0,
        selling_price: v.selling_price || 0,
        attributes: (v.attributes as Record<string, string>) || {},
      })) || [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const sellingPrice = watch('selling_price');
  const vatRate = watch('vat_rate');
  const costPrice = watch('cost_price');

  // Calculate VAT and profit
  const vatAmount = (sellingPrice * vatRate) / (100 + vatRate);
  const netPrice = sellingPrice - vatAmount;
  const profit = netPrice - (costPrice || 0);
  const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100) : 0;

  const handleGenerateSKU = () => {
    setValue('sku', generateSKU());
  };

  const handleGenerateVariantSKU = (index: number) => {
    const baseSku = watch('sku') || generateSKU();
    const variantSku = `${baseSku}-V${index + 1}`;
    setValue(`variants.${index}.sku`, variantSku);
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to Supabase
      const url = await uploadProductImage(file);
      setValue('image_url', url);
      setImagePreview(url);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  }, [setValue]);

  const addVariant = () => {
    const baseSku = watch('sku') || generateSKU();
    appendVariant({
      name: '',
      sku: `${baseSku}-V${variantFields.length + 1}`,
      barcode: '',
      cost_price: costPrice || 0,
      selling_price: sellingPrice || 0,
      attributes: {},
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('products.title')} - Basic Info
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('products.productName') + ' *'}
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>

              {/* Multi-language names */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="name_uz"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Nomi (UZ)"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="name_ru"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Название (RU)"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="name_en"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Name (EN)"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('products.sku') + ' *'}
                      fullWidth
                      error={!!errors.sku}
                      helperText={errors.sku?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleGenerateSKU} size="small">
                              <GenerateIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label={t('products.barcode')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>{t('products.category')}</InputLabel>
                      <Select {...field} value={field.value || ''} label={t('products.category')}>
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="brand_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>{t('products.brand')}</InputLabel>
                      <Select {...field} value={field.value || ''} label={t('products.brand')}>
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {brands.map((brand) => (
                          <MenuItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="supplier_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>{t('products.supplier')}</InputLabel>
                      <Select {...field} value={field.value || ''} label={t('products.supplier')}>
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {suppliers.map((sup) => (
                          <MenuItem key={sup.id} value={sup.id}>
                            {sup.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>{t('products.unit')}</InputLabel>
                      <Select {...field} label={t('products.unit')}>
                        {UNITS.map((unit) => (
                          <MenuItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label={t('products.description')}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pricing & VAT
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="cost_price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      label={t('products.costPrice')}
                      type="number"
                      fullWidth
                      InputProps={{
                        startAdornment: <InputAdornment position="start">UZS</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="selling_price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      label={t('products.sellingPrice') + ' *'}
                      type="number"
                      fullWidth
                      error={!!errors.selling_price}
                      helperText={errors.selling_price?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">UZS</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="vat_rate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || 12}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 12)}
                      label={t('products.vatRate')}
                      type="number"
                      fullWidth
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* VAT Calculation Display */}
            {sellingPrice > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Net Price (excl. VAT)
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {netPrice.toLocaleString()} UZS
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      VAT Amount ({vatRate}%)
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      {vatAmount.toLocaleString()} UZS
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Profit
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color={profit >= 0 ? 'success.main' : 'error.main'}>
                      {profit.toLocaleString()} UZS
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Profit Margin
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color={profitMargin >= 0 ? 'success.main' : 'error.main'}>
                      {profitMargin.toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Inventory Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="min_stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      label={t('products.minStock')}
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="max_stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      label="Max Stock"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={2}>
                  <Controller
                    name="track_inventory"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={field.onChange} />}
                        label={t('products.trackInventory')}
                      />
                    )}
                  />
                  <Controller
                    name="is_service"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={field.onChange} />}
                        label={t('products.isService')}
                      />
                    )}
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('products.images')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  sx={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              )}
              <Button
                component="label"
                variant="outlined"
                startIcon={uploadingImage ? <CircularProgress size={20} /> : <UploadIcon />}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Variants Section */}
        <Accordion defaultExpanded={variantFields.length > 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">{t('products.variants')}</Typography>
              <Chip label={variantFields.length} size="small" color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {variantFields.map((field, index) => (
                <Card key={field.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Variant #{index + 1}
                      </Typography>
                      <IconButton onClick={() => removeVariant(index)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name={`variants.${index}.name`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Variant Name"
                              placeholder="e.g., Red - XL"
                              fullWidth
                              error={!!errors.variants?.[index]?.name}
                              helperText={errors.variants?.[index]?.name?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name={`variants.${index}.sku`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Variant SKU"
                              fullWidth
                              error={!!errors.variants?.[index]?.sku}
                              helperText={errors.variants?.[index]?.sku?.message}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => handleGenerateVariantSKU(index)} size="small">
                                      <GenerateIcon />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name={`variants.${index}.barcode`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || ''}
                              label="Barcode"
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name={`variants.${index}.cost_price`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              label="Cost Price"
                              type="number"
                              fullWidth
                              InputProps={{
                                startAdornment: <InputAdornment position="start">UZS</InputAdornment>,
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name={`variants.${index}.selling_price`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              label="Selling Price"
                              type="number"
                              fullWidth
                              InputProps={{
                                startAdornment: <InputAdornment position="start">UZS</InputAdornment>,
                              }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    {/* Variant Attributes */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                        Attributes (Color, Size, etc.)
                      </Typography>
                      <Grid container spacing={1}>
                        {VARIANT_ATTRIBUTES.map((attr) => (
                          <Grid size={{ xs: 6, sm: 3 }} key={attr.key}>
                            <Controller
                              name={`variants.${index}.attributes.${attr.key}`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  value={field.value || ''}
                                  label={attr.label}
                                  fullWidth
                                  size="small"
                                />
                              )}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addVariant}
                fullWidth
              >
                {t('products.addVariant')}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Active Status */}
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={field.onChange} />}
              label={t('common.active')}
            />
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : t('common.save')}
        </Button>
      </Stack>
    </form>
  );
};

export default ProductForm;
