import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * App Component Tests
 * Basic smoke tests for the application root component
 */

test('renders IDMC conference title on homepage', () => {
  render(<App />);
  const titleElements = screen.getAllByRole('heading', { name: /idmc 2026/i });
  expect(titleElements.length).toBeGreaterThan(0);
});

test('renders navigation with Register link', () => {
  render(<App />);
  const registerLinks = screen.getAllByRole('link', { name: /register/i });
  expect(registerLinks.length).toBeGreaterThan(0);
});

test('renders footer with organizer info', () => {
  render(<App />);
  const organizerElements = screen.getAllByText(/gcf south metro/i);
  expect(organizerElements.length).toBeGreaterThan(0);
});
