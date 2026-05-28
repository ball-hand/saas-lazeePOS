import { render, screen } from '@testing-library/react';
import { StatsCard } from './StatsCard';
import { describe, expect } from 'vitest';

describe('StatsCard Component', () => {
  it('should render the title and value correctly', () => {
    render(
      <StatsCard 
        title="Total Pendapatan" 
        value="Rp 50.000" 
        icon={<span data-testid="icon">ICON</span>} 
      />
    );
    
    expect(screen.getByText('Total Pendapatan')).toBeInTheDocument();
    expect(screen.getByText('Rp 50.000')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
