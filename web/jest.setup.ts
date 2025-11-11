import '@testing-library/jest-dom';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
    };
  },
}));

// Mock next/image
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: function Image(props) {
      return <img {...props} />;
    },
  };
});