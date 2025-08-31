/**
 * Framer Motion mock helper for tests
 * Filters out Framer Motion specific props to avoid React warnings
 */

const React = require('react');

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
export function filterFramerMotionProps(props: any) {
  const filteredProps: any = {};
  
  for (const key in props) {
    if (!framerMotionProps.has(key)) {
      filteredProps[key] = props[key];
    }
  }
  
  return filteredProps;
}

/**
 * Creates a mock motion component that filters out Framer Motion props
 */
export function createMotionComponent(element: string) {
  return React.forwardRef(({ children, ...props }: any, ref: any) => {
    const filteredProps = filterFramerMotionProps(props);
    return React.createElement(element, { ...filteredProps, ref }, children);
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
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (value: any) => ({ get: () => value, set: jest.fn() }),
  useTransform: (value: any) => value,
  useScroll: () => ({ scrollY: 0, scrollX: 0 }),
  useInView: () => true,
  domAnimation: {},
  LazyMotion: ({ children }: any) => children,
  m: {
    div: createMotionComponent('div'),
    span: createMotionComponent('span'),
  },
};