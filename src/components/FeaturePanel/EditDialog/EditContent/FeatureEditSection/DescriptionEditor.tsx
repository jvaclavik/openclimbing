import React from 'react';
import { t } from '../../../../../services/intl';
import { isLocalizedTagKey, LocalizedTagEditor } from './LocalizedTagEditor';

export const isDescriptionKey = (k: string) =>
  isLocalizedTagKey('description', k);

export const isNameKey = (k: string) => isLocalizedTagKey('name', k);

type Props = {
  autoFocus?: boolean;
  helperText?: string;
  onEmpty?: () => void;
};

export const DescriptionEditor: React.FC<Props> = (props) => (
  <LocalizedTagEditor
    baseKey="description"
    label={t('tags.description')}
    {...props}
  />
);

export const NameEditor: React.FC<Props> = (props) => (
  <LocalizedTagEditor
    baseKey="name"
    label={t('tags.name')}
    multiline={false}
    {...props}
  />
);
