/* eslint-disable vue/prefer-import-from-vue */

import '@vue/runtime-core';
import {
  HTMLAttributes as HTMLAttributes_,
  SVGAttributes as SVGAttributes_,
} from '@vue/runtime-dom';

// https://github.com/microsoft/TypeScript/issues/40710#issuecomment-732229720

type Separator = ' ' | '-' | '_';

type CamelCase<T extends string> = T extends `${Separator}${infer Suffix}`
  ? CamelCase<Suffix>
  : T extends `${infer Prefix}${Separator}`
  ? CamelCase<Prefix>
  : T extends `${infer Prefix}${Separator}${infer Suffix}`
  ? CamelCase<`${Prefix}${Capitalize<Suffix>}`>
  : T;

type CamelCasedProps<T> = {
  [K in keyof T as `${CamelCase<string & K>}`]: T[K];
};

// for Vue components
declare module '@vue/runtime-core' {
  export interface AllowedComponentProps {
    [key: string]: any;
  }
}

// for native HTML and SVG elements
declare module '@vue/runtime-dom' {
  export interface HTMLAttributes extends CamelCasedProps<HTMLAttributes_> {
    // allow any data-* attrs
    [key: `data${string}`]: string;
  }

  export interface SVGAttributes extends CamelCasedProps<SVGAttributes_> {
    // allow any data-* attrs
    [key: `data${string}`]: string;
  }
}

export {};
