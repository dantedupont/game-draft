import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import  Preferences  from '@/app/Preferences';

const mockProps = {
  playerCount: '4',
  setPlayerCount: vi.fn(),
  playingTime: 'Medium (1-2 hours)',
  setPlayingTime: vi.fn(),
  isLoading: false,
  makeRecommendations: vi.fn(), 
  image: '1'
};

describe('PreferencesCard', () => {
  it('should render with initial props', () => {
    render(<Preferences {...mockProps} />);

    expect(screen.getByText('Player Count:')).toBeInTheDocument();
    expect(screen.getByText('Playing Time:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recommend Games/i })).toBeInTheDocument();
  });

  it('should call makeRecommendations when the button is clicked', () => {
    render(<Preferences {...mockProps} />);

    // Find the button
    const recommendButton = screen.getByRole('button', { name: /Recommend Games/i });

    // Simulate a user click
    fireEvent.click(recommendButton);

    // Assert that our mock function was called exactly once
    expect(mockProps.makeRecommendations).toHaveBeenCalledTimes(1);
  });

  it('should show the loading state when isLoading is true', () => {
    // Render the component with isLoading set to true
    render(<Preferences {...mockProps} isLoading={true} />);

    // Find the button
    const recommendButton = screen.getByRole('button', { name: /Loading.../i });

    // Assert that the button is now disabled
    expect(recommendButton).toBeDisabled();

    // Assert that the button text has changed to "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});