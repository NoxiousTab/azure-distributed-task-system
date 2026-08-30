export type ToolStatus = 'live' | 'soon';
export type ResultKind = 'image' | 'pdf';

export interface ToolDefinition {
  id: string;
  slug: string;
  categorySlug: string;
  name: string;
  tagline: string;
  status: ToolStatus;
  popular?: boolean;
  // Only present for 'live' tools - drives the upload + result flow in ToolPage.
  accept?: string;
  acceptHint?: string;
  resultKind?: ResultKind;
  downloadLabel?: string;
}

export interface CategoryDefinition {
  slug: string;
  name: string;
  description: string;
}

export const categories: CategoryDefinition[] = [
  { slug: 'compress', name: 'Compress', description: 'Shrink files down without losing what matters.' },
  { slug: 'convert', name: 'Convert', description: 'Turn a file into the format something else expects.' },
  {
    slug: 'documents',
    name: 'Documents & forms',
    description: "Everything that comes up when you're filling out paperwork.",
  },
  { slug: 'ocr', name: 'Text & OCR', description: 'Get text back out of a scan or photo.' },
];

export const tools: ToolDefinition[] = [
  {
    id: 'compress-image',
    slug: 'image',
    categorySlug: 'compress',
    name: 'Compress image',
    tagline: 'Shrink JPGs and PNGs without losing quality.',
    status: 'live',
    popular: true,
    accept: 'image/jpeg,image/png',
    acceptHint: 'JPG or PNG, up to 5 MB',
    resultKind: 'image',
    downloadLabel: 'Download image',
  },
  {
    id: 'compress-pdf',
    slug: 'pdf',
    categorySlug: 'compress',
    name: 'Compress PDF',
    tagline: 'Get a PDF under the size limit for uploads and email.',
    status: 'soon',
    popular: true,
  },
  {
    id: 'heic-to-jpg',
    slug: 'heic-to-jpg',
    categorySlug: 'convert',
    name: 'HEIC to JPG',
    tagline: 'Turn iPhone photos into a format everything accepts.',
    status: 'live',
    popular: true,
    accept: 'image/heic,image/heif,.heic,.heif',
    acceptHint: 'HEIC or HEIF, up to 5 MB',
    resultKind: 'image',
    downloadLabel: 'Download JPG',
  },
  {
    id: 'image-to-pdf',
    slug: 'image-to-pdf',
    categorySlug: 'convert',
    name: 'Image to PDF',
    tagline: 'Turn a photo or scan into a proper PDF.',
    status: 'live',
    popular: true,
    accept: 'image/jpeg,image/png',
    acceptHint: 'JPG or PNG, up to 5 MB',
    resultKind: 'pdf',
    downloadLabel: 'Download PDF',
  },
  {
    id: 'merge-pdf',
    slug: 'merge-pdf',
    categorySlug: 'documents',
    name: 'Merge PDF',
    tagline: 'Combine scanned pages into one file.',
    status: 'soon',
    popular: true,
  },
  {
    id: 'passport-photo',
    slug: 'passport-photo',
    categorySlug: 'documents',
    name: 'Passport photo maker',
    tagline: 'Crop and size a photo to official passport specs.',
    status: 'live',
    accept: 'image/jpeg,image/png',
    acceptHint: 'JPG or PNG · center-cropped to 600×600px',
    resultKind: 'image',
    downloadLabel: 'Download photo',
  },
  {
    id: 'image-to-text',
    slug: 'image-to-text',
    categorySlug: 'ocr',
    name: 'Image to text',
    tagline: 'Pull editable text out of a scanned document.',
    status: 'soon',
  },
];

export const popularTools = tools.filter((tool) => tool.popular);

export const getToolsByCategory = (categorySlug: string): ToolDefinition[] =>
  tools.filter((tool) => tool.categorySlug === categorySlug);

export const getCategory = (slug: string): CategoryDefinition | undefined =>
  categories.find((category) => category.slug === slug);

export const getTool = (categorySlug: string, toolSlug: string): ToolDefinition | undefined =>
  tools.find((tool) => tool.categorySlug === categorySlug && tool.slug === toolSlug);
