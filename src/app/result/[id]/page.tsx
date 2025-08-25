import { notFound } from 'next/navigation';
import DiagnosisResult from '@/components/diagnosis/DiagnosisResult';
import { ResultStorage } from '@/lib/result-storage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const storage = ResultStorage.getInstance();
  const result = await storage.getResult(id);
  
  if (!result) {
    notFound();
  }
  
  return <DiagnosisResult result={result} />;
}