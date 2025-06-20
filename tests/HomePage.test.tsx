
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'


describe('HomePage', () => {
  it('should render the main titles correctly', () => {
    render(<HomePage />);
    expect(screen.getByText(/Capture Your Collection/i)).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('should have the "Recommend Games" button disabled initially', () => {
    render(<HomePage />);

    // Find the button by its text. The `i` makes it case-insensitive.
    const recommendButton = screen.getByRole('button', { name: /Recommend Games/i });
    
    // Make sure that its disabled
    expect(recommendButton).toBeDisabled();
  })
})