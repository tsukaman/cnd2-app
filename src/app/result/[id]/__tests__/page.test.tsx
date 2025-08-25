import { render } from '@testing-library/react';
import { notFound } from 'next/navigation';
import ResultPage from '../page';
import { ResultStorage } from '@/lib/result-storage';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/result-storage');

jest.mock('@/components/diagnosis/DiagnosisResult', () => ({
  DiagnosisResultComponent: ({ result }: any) => (
    <div data-testid="diagnosis-result">{JSON.stringify(result)}</div>
  ),
}));

describe('ResultPage', () => {
  const mockResult = {
    id: 'test-id',
    type: 'クラウドネイティブシナジー',
    score: 85,
    message: 'Test message',
    conversationStarters: ['Topic 1', 'Topic 2'],
    hiddenGems: 'Hidden gem test',
    shareTag: '#Test',
    participants: [
      {
        basic: { name: 'User1', company: 'Company1', role: 'Engineer' },
        skills: [],
        social: {},
      },
      {
        basic: { name: 'User2', company: 'Company2', role: 'Manager' },
        skills: [],
        social: {},
      },
    ],
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders result when found', async () => {
    const mockGetResult = jest.fn().mockResolvedValue(mockResult);
    (ResultStorage.getInstance as jest.Mock).mockReturnValue({
      getResult: mockGetResult,
    });

    const { getByTestId } = render(
      await ResultPage({ params: Promise.resolve({ id: 'test-id' }) })
    );

    expect(mockGetResult).toHaveBeenCalledWith('test-id');
    expect(getByTestId('diagnosis-result')).toBeInTheDocument();
  });

  it('calls notFound when result not found', async () => {
    const mockGetResult = jest.fn().mockResolvedValue(null);
    (ResultStorage.getInstance as jest.Mock).mockReturnValue({
      getResult: mockGetResult,
    });

    await ResultPage({ params: Promise.resolve({ id: 'non-existent' }) });

    expect(mockGetResult).toHaveBeenCalledWith('non-existent');
    expect(notFound).toHaveBeenCalled();
  });
});