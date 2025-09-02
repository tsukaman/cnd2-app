/**
 * Framer Motion mock helper for tests
 * Filters out Framer Motion specific props to avoid React warnings
 */

import * as React from 'react';

// Type definitions for mock components
type MockComponentProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

type MockAnimationControls = {
  start: jest.Mock;
  stop: jest.Mock;
  set: jest.Mock;
};

type MockMotionValue<T = unknown> = {
  get: () => T;
  set: jest.Mock;
};

// Framer Motion specific props that should be filtered out
const framerMotionProps = new Set([
  'animate',
  'initial',
  'exit',
  'transition',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragTransition',
  'dragPropagation',
  'dragDirectionLock',
  'dragSnapToOrigin',
  'onDragStart',
  'onDragEnd',
  'onDrag',
  'onDirectionLock',
  'onDragTransitionEnd',
  'layout',
  'layoutId',
  'layoutDependency',
  'onLayoutAnimationStart',
  'onLayoutAnimationComplete',
  'onLayoutMeasure',
  'onBeforeLayoutMeasure',
  'onAnimationStart',
  'onAnimationComplete',
  'onUpdate',
  'onViewportEnter',
  'onViewportLeave',
  'viewport',
  'variants',
  'custom',
  'inherit',
  'static',
]);

/**
 * Filters out Framer Motion specific props from the props object
 */
export function filterFramerMotionProps(props: MockComponentProps) {
  const filteredProps: Record<string, unknown> = {};
  
  for (const key in props) {
    if (!framerMotionProps.has(key)) {
      filteredProps[key] = props[key];
    }
  }
  
  return filteredProps;
}

/**
 * Map of HTML element names to their corresponding DOM element types
 */
type ElementTypeMap = {
  div: HTMLDivElement;
  span: HTMLSpanElement;
  button: HTMLButtonElement;
  a: HTMLAnchorElement;
  img: HTMLImageElement;
  section: HTMLElement;
  article: HTMLElement;
  header: HTMLElement;
  footer: HTMLElement;
  nav: HTMLElement;
  ul: HTMLUListElement;
  li: HTMLLIElement;
  p: HTMLParagraphElement;
  h1: HTMLHeadingElement;
  h2: HTMLHeadingElement;
  h3: HTMLHeadingElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  label: HTMLLabelElement;
};

/**
 * Creates a mock motion component that filters out Framer Motion props
 */
export function createMotionComponent<K extends keyof ElementTypeMap>(element: K) {
  return React.forwardRef<ElementTypeMap[K], MockComponentProps>(({ children, ...props }, ref) => {
    const filteredProps = filterFramerMotionProps(props);
    return React.createElement(element, { ...filteredProps, ref }, children as React.ReactNode);
  });
}

/**
 * Complete Framer Motion mock for Jest
 */
export const framerMotionMock = {
  motion: {
    div: createMotionComponent('div'),
    span: createMotionComponent('span'),
    button: createMotionComponent('button'),
    a: createMotionComponent('a'),
    img: createMotionComponent('img'),
    section: createMotionComponent('section'),
    article: createMotionComponent('article'),
    header: createMotionComponent('header'),
    footer: createMotionComponent('footer'),
    nav: createMotionComponent('nav'),
    ul: createMotionComponent('ul'),
    li: createMotionComponent('li'),
    p: createMotionComponent('p'),
    h1: createMotionComponent('h1'),
    h2: createMotionComponent('h2'),
    h3: createMotionComponent('h3'),
    form: createMotionComponent('form'),
    input: createMotionComponent('input'),
    label: createMotionComponent('label'),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: (): MockAnimationControls => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: <T = unknown>(value: T): MockMotionValue<T> => ({ get: () => value, set: jest.fn() }),
  useTransform: <T = unknown>(value: T) => value,
  useScroll: () => ({ scrollY: 0, scrollX: 0 }),
  useInView: () => true,
  domAnimation: {},
  LazyMotion: ({ children }: { children: React.ReactNode }) => children,
  m: {
    div: createMotionComponent('div'),
    span: createMotionComponent('span'),
  },
};