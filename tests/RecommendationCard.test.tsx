// tests/RecommendationsCard.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import  Recommendations  from '@/app/Recommendations';

describe('RecommendationsCard', () => {
  it('should render the placeholder text when output is empty', () => {
    // 1. Render the component with an empty string for the output prop
    render(<Recommendations output="" />);

    // 2. Check if the placeholder text is visible
    expect(screen.getByText('Recommendations will appear here...')).toBeInTheDocument();
  });

  it('should render the markdown output when provided', () => {
    const markdownText = '### Recommended Game: Catan';
    
    // 1. Render the component with some sample markdown text
    render(<Recommendations output={markdownText} />);

    // 2. Check that the placeholder is GONE
    expect(screen.queryByText('Recommendations will appear here...')).not.toBeInTheDocument();

    // 3. Check that the new content is visible. 
    // We look for the heading role created by the '###' markdown.
    expect(screen.getByRole('heading', { name: /Recommended Game: Catan/i })).toBeInTheDocument();
  });
});