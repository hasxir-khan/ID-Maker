import { CardTemplate } from '../types/card';
import { HORIZONTAL_TEMPLATES } from './templates/horizontalTemplates';
import { VERTICAL_TEMPLATES } from './templates/verticalTemplates';

const enrichTemplate = (t: CardTemplate): CardTemplate => {
  const isHorizontal = t.defaultOrientation === 'horizontal' || t.orientation === 'horizontal';
  const width = isHorizontal ? 85.6 : 53.98;
  const height = isHorizontal ? 53.98 : 85.6;
  return {
    ...t,
    templateId: t.id,
    orientation: isHorizontal ? 'horizontal' : 'vertical',
    defaultOrientation: isHorizontal ? 'horizontal' : 'vertical',
    dimensions: t.dimensions || {
      width,
      height,
      unit: 'mm',
      preset: 'CR80',
    },
    width,
    height,
    unit: 'mm',
    elementsFront: t.elementsFront || [],
    elementsBack: t.elementsBack || [],
  };
};

const enrichedHorizontal = HORIZONTAL_TEMPLATES.map(enrichTemplate);
const enrichedVertical = VERTICAL_TEMPLATES.map(enrichTemplate);

// Unified full catalog of 22 distinct production-ready templates
export const CARD_TEMPLATES: CardTemplate[] = [
  ...enrichedHorizontal,
  ...enrichedVertical,
];

export { enrichedHorizontal as HORIZONTAL_TEMPLATES, enrichedVertical as VERTICAL_TEMPLATES };

